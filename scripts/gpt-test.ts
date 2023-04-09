import { createClient } from "@supabase/supabase-js";
import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi,
  CreateChatCompletionRequest,
  ChatCompletionRequestMessage,
} from "openai";
import { oneLine, codeBlock } from "common-tags";

let counter = 0;
// import GPT3NodeTokenizer from "gpt3-tokenizer";
// console.log(GPT3NodeTokenizer);
// console.log(Object.assign({}, GPT3NodeTokenizer).default);
// import {  } from "gpt3-tokenizer";

// GPT3NodeTokenizer

// const GPT3NodeTokenizer = (vv).default;
// console.log("GPT3NodeTokenizer", GPT3NodeTokenizer);
// const GPT3NodeTokenizer = require("gpt3-tokenizer").default;
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const openAiKey = process.env.OPENAI_KEY;

const supabaseUrl = `https://${process.env.NEXT_PROJECT_ID}.supabase.co`;

const supabaseClient = createClient(
  supabaseUrl,
  process.env.NEXT_ANON_KEY as string
);

// export const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
// };

// const sanitizedQueryString = async (req: any) => {
//   const requestData = await req.json();

//   if (!requestData) {
//     //   throw new UserError('Missing request data')
//   }

//   const { query } = requestData;

//   if (!query) {
//     //   throw new UserError('Missing query in request data')
//   }

//   // Intentionally log the query
//   console.log({ query });

//   const sanitizedQuery = query.trim();
//   return sanitizedQuery;
// };

// const queryDocs = async (sanitizedQuery: string) => {
//   // const sanitizedQuery = await sanitizedQueryString(query);
//   await moderateContent(sanitizedQuery);
//   const embedding = await embed(sanitizedQuery);
//   const pageSections = await searchInDB(embedding);
//   await formatOutputWithChatGPT(pageSections, sanitizedQuery);
// };

// queryDocs("How do I get started with Celo?");
