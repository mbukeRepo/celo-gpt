import { Poppins } from "next/font/google";
import { useEffect, useState, useRef } from "react";
import { useChat } from "@/context/chat-context";
import Head from "next/head";
import AIMessage from "@/components/AIMessage";
import Pattern from "@/components/vectors/Pattern";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/cjs/styles/prism";
import Spinner from "@/components/vectors/Spinner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function Home() {
  const [message, setMessage] = useState("");
  const { messages, sendMessage, clearMessages } = useChat();
  const [loading, setLoading] = useState(false);

  const suggestions = [
    "What is Celo?",
    "What is Celo Gold?",
    "What is Celo Dollar?",
    "What is Celo Native?",
  ];

  const element = useRef<HTMLDivElement>(null);

  const [scrolled, setscrolled] = useState(false);

  function updateScroll() {
    if (!scrolled) {
      element.current!.scrollTop = element.current!.scrollHeight;
    }
  }

  const handleSubmit = (e: any) => {
    if (message !== "") {
      updateScroll();
      setLoading(true);
      sendMessage(e, message);
      setMessage("");
    }
  };
  const [loadingMessage, setloadingMessage] = useState<number | undefined>();

  return (
    <>
      <Head>
        <title>celo-gpt</title>
        <link rel="icon" href="https://docs.celo.org/img/color-favicon.png" />
      </Head>

      <div className={poppins.className + " h-full"}>
        <div className=" relative w-full">
          <div className="md:py-10 h-full py-0">
            <div className="max-w-2xl md:h-[600px] h-[100dvh] shadow-2xl overflow-hidden bg-gray-900 bg-opacity-60 backdrop-blur-sm text-gray-300 rounded-none md:rounded-[3px] relative z-50 mx-auto border border-gray-800">
              <div className="absolute -z-50 top-0 w-full h-full opacity-10">
                <img
                  className="h-full w-full object-contain object-center"
                  src="https://images.ctfassets.net/wr0no19kwov9/70NYVCJUO0GoHFZ4eC26At/f9e16b8cf01e453e4e6de1ad705fc489/Grid_Image_1.png?fm=webp&w=1920&q=70"
                  alt=""
                />
              </div>
              <div className="flex absolute bg-gray-900 bg-opacity-90 backdrop-blur-md top-0 w-full border-b border-gray-800 items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <img
                    src="celo-gpt.webp"
                    className="h-6 w-6 rounded-[3px]"
                    alt=""
                  />
                  <h4 className="font-medium text-[15px] px-1">Celo GPT</h4>
                </div>
                <div>
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      clearMessages();
                      setLoading(false);
                    }}
                    className="w-10 active:scale-95 transition-all h-10 border rounded-[3px] border-gray-800 bg-opacity-50 bg-gray-800 cursor-pointer flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={16}
                      height={16}
                      stroke="currentColor"
                      strokeWidth={2}
                      fill="none"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <polyline points="23 20 23 14 17 14" />
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                  </a>
                </div>
              </div>
              <div
                ref={element}
                onScroll={(e) => {
                  if (
                    e.currentTarget.scrollTop + 20 <
                      e.currentTarget.scrollHeight -
                        e.currentTarget.clientHeight &&
                    loading
                  ) {
                    setscrolled(true);
                  } else {
                    setscrolled(false);
                  }
                }}
                className="h-full pb-16 md:h-full scroller overflow-y-auto flex flex-col gap-3"
              >
                <div className="md:pt-[60px] pt-[50px] pb-[15px]">
                  {[
                    {
                      role: "bot",
                      content:
                        "Hi,👋 I'm Celo GPT. I read the entire latest version of the Celo documentation. Ask me anything about Celo.",
                    },
                    ...messages,
                  ].map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 md:gap-2 mx-0 md:mx-3 px-3 py-2 ${
                        msg.role === "bot"
                          ? "bg-gray-800 pb-4 bg-opacity-30 first-of-type:border-t-0 md:border-x md:border-t border-x-0 border-gray-800 border border-opacity-70 rounded-[3px] my-2"
                          : ""
                      }`}
                    >
                      <div className="w-[30px] h-full ">
                        {msg.role === "bot" ? (
                          <div className="w-6 h-6 mt-[2px]  rounded-[2px] overflow-hidden">
                            <img
                              src="celo-gpt.webp"
                              className="w-full  h-full"
                              alt=""
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 flex items-center bg-gray-700 rounded-[2px] justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke-width="1.5"
                              stroke="currentColor"
                              className="w-[16px]  h-[16px] text-white"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                              ></path>
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="w-[calc(100%-50px)]">
                        {msg.role === "bot" && i !== 0 ? (
                          <AIMessage
                            id={i}
                            loadingMessage={loadingMessage}
                            setloadingMessage={setloadingMessage}
                            loading={loading}
                            onCompleted={() => {
                              setscrolled(false);
                            }}
                            updateScroll={updateScroll}
                            setLoading={setLoading}
                            query={msg.content}
                          />
                        ) : (
                          <div className="w-full">
                            <p className="text-[13.5px] flex- gap-3 font-[400]  leading-7">
                              {msg.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {!messages.length ? (
                  <div className="mt-auto flex justify-center items-center flex-col">
                    <h4 className="text-[13px] font-medium capitalize text-gray-400">
                      you can start by asking me questions like:{" "}
                    </h4>
                    <div className="flex py-4 px-1 items-center justify-center gap-4 flex-wrap ">
                      {suggestions.map((suggestion, i) => (
                        <a
                          onClick={(e) => {
                            setLoading(true);
                            sendMessage(e, suggestion);
                            updateScroll();
                          }}
                          className="px-4 py-2 border border-gray-800 border-opacity-60 cursor-pointer active:scale-95 transition-all bg-gray-800 bg-opacity-40 text-[13px] rounded-[3px]"
                        >
                          {suggestion}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="border-t bg-gray-900 bg-opacity-90 backdrop-blur-sm fixed md:absolute bottom-0 w-full py-2 px-2 border-gray-800">
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                  }}
                  className="w-full border flex gap-3 items-center py-1 px-1  border-gray-800 bg-opacity-30 bg-gray-800 rounded-[3px]"
                >
                  <textarea
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSubmit(e);
                      }
                    }}
                    onChange={(e) => {
                      setMessage(e.target.value);
                    }}
                    value={message}
                    className="bg-transparent outline-none text-gray-300 font-[400] resize-none text-sm w-full py-1 px-2"
                    rows={1}
                    placeholder="Ask me anything about Celo."
                  />

                  <a
                    onClick={(e) => handleSubmit(e)}
                    className={`h-10 cursor-pointer flex active:scale-95 transition-all justify-center items-center w-11 outline-none rounded-[3px] bg-gradient-to-r from-[#fcff52] to-[#fcff52] ${
                      loading ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {loading ? (
                      <Spinner className="text-gray-900" />
                    ) : (
                      <svg
                        height={20}
                        width={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        className="stroke-gray-900"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g id="SVGRepo_bgCarrier" stroke-width="0" />
                        <g
                          id="SVGRepo_tracerCarrier"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <g id="SVGRepo_iconCarrier">
                          <path
                            d="M10.5004 11.9998H5.00043M4.91577 12.2913L2.58085 19.266C2.39742 19.8139 2.3057 20.0879 2.37152 20.2566C2.42868 20.4031 2.55144 20.5142 2.70292 20.5565C2.87736 20.6052 3.14083 20.4866 3.66776 20.2495L20.3792 12.7293C20.8936 12.4979 21.1507 12.3822 21.2302 12.2214C21.2993 12.0817 21.2993 11.9179 21.2302 11.7782C21.1507 11.6174 20.8936 11.5017 20.3792 11.2703L3.66193 3.74751C3.13659 3.51111 2.87392 3.39291 2.69966 3.4414C2.54832 3.48351 2.42556 3.59429 2.36821 3.74054C2.30216 3.90893 2.3929 4.18231 2.57437 4.72906L4.91642 11.7853C4.94759 11.8792 4.96317 11.9262 4.96933 11.9742C4.97479 12.0168 4.97473 12.0599 4.96916 12.1025C4.96289 12.1506 4.94718 12.1975 4.91577 12.2913Z"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </g>
                      </svg>
                    )}
                  </a>
                </form>
              </div>
            </div>
          </div>
          <div className="w-full h-screen absolute top-0">
            <Pattern />
          </div>
          <div
            style={{
              backgroundImage: "url(blur.svg-)",
            }}
            className="absolute bg-cover bg-center h-screen opacity-50  w-full bg-gradient-to-b from-[#0c1120] top-0"
          />
          <div className="absolute h-screen w-full bg-gradient-to-b to-gray-900/10 from-gray-900/90 top-0" />
        </div>
      </div>
    </>
  );
}
