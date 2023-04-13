import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
  CreateChatCompletionRequest,
  ChatCompletionRequestMessage,
} from "openai";
import { oneLine, codeBlock } from "common-tags";
import GPT3NodeTokenizer from "gpt3-tokenizer";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

const openAiKey = process.env.NEXT_PUBLIC_OPENAI_KEY as string;
const supabaseUrl = process.env.NEXT_SUPABASE_URL as string;
const supabaseServiceKey = process.env.NEXT_PUBLIC_ANON_KEY as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

class ApplicationError extends Error {
  constructor(message: string, public data: Record<string, any> = {}) {
    super(message);
  }
}

class UserError extends ApplicationError {}

// TODO: integrate moderation to limit offensive content
const moderateContent = async (sanitizedQuery: string, openai: OpenAIApi) => {
  const moderationResponse = await openai.createModeration({
    input: sanitizedQuery,
  });

  const [results] = moderationResponse.data.results;

  if (results.flagged) {
    // content flagged throw warning
    throw new ApplicationError("Flagged content", {
      flagged: true,
      categories: results.categories,
    });
  }
};
const searchInDB = async (embedding: any, supabaseClient: SupabaseClient) => {
  const { error: matchError, data: pageSections } = await supabaseClient.rpc(
    "match_page_sections",
    {
      embedding,
      match_threshold: 0.78,
      match_count: 10,
      min_content_length: 50,
    }
  );

  // console.log(pageSections);

  if (matchError) {
    console.log(matchError);
    throw new ApplicationError("Failed to match page sections", matchError);
  }

  return pageSections;
};
const formatOutputWithChatGPT = async (
  pageSections: any,
  sanitizedQuery: string
) => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const tokenizer = new GPT3NodeTokenizer({ type: "gpt3" });
  let tokenCount = 0;
  let contextText = "";

  for (let i = 0; i < pageSections.length; i++) {
    const pageSection = pageSections[i];
    const content = pageSection.content;
    const encoded = tokenizer.encode(content);
    tokenCount += encoded.text.length;

    if (tokenCount >= 1024) {
      break;
    }

    contextText += `${content.trim()}\n---\n`;
  }

  console.log(contextText);

  const messages = [
    {
      role: "system",
      content: codeBlock`
        ${oneLine`
          You are a very enthusiastic Celo AI who loves
          to help people! Given the following information from
          the celo documentation, answer the user's question using
          only that information, outputted in markdown format.
        `}
        ${oneLine`
          If you are unsure
          and the answer is not explicitly written in the documentation, say
          "Sorry, I don't know how to help with that."
        `}

        ${oneLine`
          Always include related code snippets if available.
        `}
      `,
    },
    {
      role: "user",
      content: codeBlock`
        Here is the celo documentation:
        ${contextText}
      `,
    },
    {
      role: "user",
      content: codeBlock`
        ${oneLine`
          Answer my next question using only the above documentation.
          You must also follow the below rules when answering:
        `}
        ${oneLine`
          - Do not make up answers that are not provided in the documentation.
        `}
        ${oneLine`
          - If you are unsure and the answer is not explicitly written
          in the documentation context, say
          "Sorry, I don't know how to help with that."
        `}
        ${oneLine`
          - Prefer splitting your response into multiple paragraphs and add one blank line between them.
        `}
        ${oneLine`
          - Output as markdown with code snippets if available.
        `}
        ${oneLine`
          - Make sure to not do spelling mistakes. Please use the words from the documentation.
        `}
        ${oneLine`
          - Keep the answer short, clear and organised as possible.
        `}
      `,
    },
    {
      role: "user",
      content: codeBlock`
        Here is my question:
        ${oneLine`${sanitizedQuery}`}
    `,
    },
  ];

  const completionOptions = {
    model: "gpt-3.5-turbo",
    messages,
    max_tokens: 1024,
    temperature: 0,
    stream: true,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(completionOptions),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApplicationError("Failed to generate completion", error);
  }
  let counter = 0;
  const stream = new ReadableStream({
    async start(controller) {
      function onParse(event: ParsedEvent | ReconnectInterval) {
        if (event.type === "event") {
          const data = event.data;
          if (data === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0].delta?.content || "";
            if (counter < 2 && (text.match(/\n/) || []).length) {
              // this is a prefix character (i.e., "\n\n"), do nothing
              return;
            }
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            counter++;
          } catch (e) {
            // console.log(e);

            controller.error(e);
          }
        }
      }

      // stream response (SSE) from OpenAI may be fragmented into multiple chunks
      // this ensures we properly read chunks & invoke an event for each SSE event stream
      const parser = createParser(onParse);

      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of response.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};

export const config = {
  runtime: "edge",
  unstable_allowDynamic: ["/node_modules/**"],
};

export default async function handler(req: NextRequest, ev: NextFetchEvent) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }
  // console.log(await req.json());
  const { query } = await req.json();
  try {
    if (!query) {
      throw new UserError("Missing query in request data");
    }
    const sanitizedQuery = query.trim();
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const embeddingResponse = await fetch(
      "https://api.openai.com/v1/embeddings",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-ada-002",
          input: sanitizedQuery.replaceAll("\n", " "),
        }),
      }
    );

    const data = await embeddingResponse.json();

    const embedding = data.data[0].embedding;

    if (embeddingResponse.status !== 200) {
      throw new ApplicationError(
        "Failed to create embedding for question",
        embeddingResponse
      );
    }

    const pageSections = await searchInDB(embedding, supabaseClient);
    const stream = await formatOutputWithChatGPT(pageSections, sanitizedQuery);
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error: ApplicationError | UserError | Error | any) {
    console.log(error);
    return new Response(error.message, {
      status: 500,
      headers: corsHeaders,
    });
  }
}
