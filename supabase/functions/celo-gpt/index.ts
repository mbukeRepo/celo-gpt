import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.2.1/mod.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.5.0";
import {
  oneLine,
  stripIndent,
  codeBlock,
} from "https://esm.sh/common-tags@1.8.2";
import GPT3Tokenizer from "https://esm.sh/gpt3-tokenizer@1.1.5";
import {
  Configuration,
  CreateCompletionRequest,
  OpenAIApi,
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  CreateChatCompletionRequest,
} from "https://esm.sh/openai@3.1.0";
import { ApplicationError, UserError } from "./errors.ts";

const openAiKey = Deno.env.get("OPENAI_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

const embed = async (sanitizedQuery: string, openai: OpenAIApi) => {
  const embeddingResponse = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: sanitizedQuery.replaceAll("\n", " "),
  });

  if (embeddingResponse.status !== 200) {
    throw new ApplicationError(
      "Failed to create embedding for question",
      embeddingResponse
    );
  }

  const [{ embedding }] = embeddingResponse.data.data;
  return embedding;
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

  if (matchError) {
    throw new ApplicationError("Failed to match page sections", matchError);
  }

  return pageSections;
};

const formatOutputWithChatGPT = async (
  pageSections: any,
  sanitizedQuery: string
) => {
  const tokenizer = new GPT3Tokenizer({ type: "gpt3" });
  let tokenCount = 0;
  let contextText = "";

  for (let i = 0; i < pageSections.length; i++) {
    const pageSection = pageSections[i];
    const content = pageSection.content;
    const encoded = tokenizer.encode(content);
    tokenCount += encoded.text.length;

    if (tokenCount >= 1500) {
      break;
    }

    contextText += `${content.trim()}\n---\n`;
  }

  const messages: ChatCompletionRequestMessage[] = [
    {
      role: ChatCompletionRequestMessageRoleEnum.System,
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
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: codeBlock`
        Here is the celo documentation:
        ${contextText}
      `,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
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
          - Prefer splitting your response into multiple paragraphs.
        `}
        ${oneLine`
          - Output as markdown with code snippets if available.
        `}
      `,
    },
    {
      role: ChatCompletionRequestMessageRoleEnum.User,
      content: codeBlock`
        Here is my question:
        ${oneLine`${sanitizedQuery}`}
    `,
    },
  ];

  const completionOptions: CreateChatCompletionRequest = {
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

  // Proxy the streamed SSE response from OpenAI
  return new Response(response.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
    },
  });
};

serve(async (req: any) => {
  try {
    // Handle CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (!openAiKey) {
      throw new ApplicationError("Missing environment variable OPENAI_KEY");
    }

    if (!supabaseUrl) {
      throw new ApplicationError("Missing environment variable SUPABASE_URL");
    }

    if (!supabaseServiceKey) {
      throw new ApplicationError(
        "Missing environment variable SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    const requestData = await req.json();

    if (!requestData) {
      throw new UserError("Missing request data");
    }

    const { query } = requestData;

    if (!query) {
      throw new UserError("Missing query in request data");
    }

    const sanitizedQuery = query.trim();

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const configuration = new Configuration({ apiKey: openAiKey });
    const openai = new OpenAIApi(configuration);
    await moderateContent(sanitizedQuery, openai);
    const embedding = await embed(sanitizedQuery, openai);
    const pageSections = await searchInDB(embedding, supabaseClient);
    await formatOutputWithChatGPT(pageSections, sanitizedQuery);
  } catch (err: unknown) {
    if (err instanceof UserError) {
      return new Response(
        JSON.stringify({
          error: "There was an error processing your request",
          data: "Please check your request data, if there is inappropriate content, please try again with different content",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Print out unexpected errors to help with debugging
    console.error(err);

    // TODO: include more response info in debug environments
    return new Response(
      JSON.stringify({
        error: "There was an error processing your request",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
