import Image from "next/image";
import { Inter, Poppins } from "next/font/google";
import { useEffect, useState } from "react";
import axios from "axios";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { useTextBuffer } from "../hooks/useTextBuffer";
import { StreamingText } from "../components/StreamingText";
import { Head } from "next/document";
import Celo from "../public/celo-gpt.webp";
import Send from "@/components/vectors/Send";
import { useChat } from "@/context/chat-context";
import AIMessage from "@/components/AIMessage";
import User from "@/components/vectors/User";
import Spinner from "@/components/vectors/Spinner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function Home() {
  const [message, setMessage] = useState("");
  const { messages, sendMessage } = useChat();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    console.log(loading);
  }, [loading]);
  return (
    <>
      <head>
        <title>celo-gpt</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <main className="flex bg-[#FCF6F1] h-screen flex-col items-center justify-between p-24-">
        <main
          className={`min-h-screen px-4  bg-gray-400- place-content-center grid min-w-[100vw]- ${poppins.className}`}
        >
          <div className="max-w-[800px] relative h-full border-3 border-[#331E3F] bg-[#E7E3D4] text-gray-900 shadow-lg md:rounded-md py-8 flex  mx-auto">
            <div className="self-end w-full pb-12 flex h-[73vh] md:h-[65vh] overflow-scroll scroll-hidden flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3 px-5">
                  <Image
                    className="w-[40px]  h-[40px] rounded-lg"
                    src={Celo}
                    alt="celo logo"
                  />
                  <p className="max-w-[400px]-">
                    Hi there! I'm <span className="font-bold">celo-gpt</span>, a
                    chatbot powered by chatGPT. I read the entire update version
                    of the Celo documentation. Ask me anything about Celo
                    ecosystem.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {messages.map(
                    (msg: { role: string; content: string }, i: number) =>
                      msg.role === "user" ? (
                        <p key={i} className="bg-[#FCF6F1] p-5 flex gap-5">
                          <div>
                            <User className="w-[30px]  h-[30px] text-gray-600" />
                          </div>
                          {msg.content}
                        </p>
                      ) : (
                        <div key={i} className="p-5 flex gap-3">
                          <Image
                            className="w-[40px]  h-[40px] rounded-lg"
                            src={Celo}
                            alt="celo logo"
                          />
                          <AIMessage
                            setLoading={setLoading}
                            query={msg.content}
                          />
                        </div>
                      )
                  )}
                </div>
              </div>
            </div>
            <form
              className="absolute px-2 flex bottom-5 max-w-md left-1/2 -translate-x-1/2 w-full"
              onSubmit={(e) => {
                setLoading(true);
                sendMessage(e, message);
                setMessage("");
              }}
            >
              <input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                }}
                disabled={loading}
                placeholder="Type a message..."
                className="outline-none max-w-md mx-auto w-full h-12 px-4 rounded-lg border bg-[#FCF6F1] border-gray-300"
              />
              {!loading ? (
                <button type="submit">
                  <Send className="absolute right-4 md:right-2 text-gray-600 top-1/2 -translate-y-1/2" />
                </button>
              ) : (
                <button
                  className="absolute right-2 text-gray-600 top-1/2 -translate-y-1/2"
                  disabled
                >
                  <Spinner className="w-6 h-6 " />
                </button>
              )}
            </form>
          </div>
        </main>
      </main>
    </>
  );
}
