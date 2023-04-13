import { Poppins } from "next/font/google";
import { useEffect, useState, useRef } from "react";
import { useChat } from "@/context/chat-context";
import Head from "next/head";
import AIMessage from "@/components/AIMessage";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function Home() {
  const [message, setMessage] = useState("");
  const { messages, sendMessage, clearMessages } = useChat();
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    console.log(loading);
  }, [loading]);

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

  useEffect(() => {
    updateScroll();
  }, []);

  const handleSubmit = (e: any) => {
    if (message !== "") {
      updateScroll();
      setLoading(true);
      sendMessage(e, message);
      setMessage("");
    }
  };

  return (
    <>
      <Head>
        <title>celo-gpt</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={poppins.className}>
        <div className="h-screen relative w-full">
          <div className="py-10">
            <div className="max-w-2xl overflow-hidden bg-slate-900 bg-opacity-30 text-gray-300 rounded-[3px] relative z-50 mx-auto border border-slate-800">
              <div className="flex absolute bg-slate-900 bg-opacity-80 backdrop-blur-sm top-0 w-full border-b border-slate-800 items-center justify-between px-3 py-2">
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
                    e.currentTarget.scrollTop <
                      e.currentTarget.scrollHeight -
                        e.currentTarget.clientHeight &&
                    loading
                  ) {
                    console.log("sc");
                    // setscrolled(true);
                  }
                }}
                className="h-[500px] scroll-smooth overflow-y-auto flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
              >
                <div className="pt-[60px] pb-[15px]">
                  {[
                    {
                      role: "bot",
                      content:
                        "Hi,👋 I'm Celo GPT. I'm a chatbot that uses GPT-3 to answer your questions about Celo.",
                    },
                    ...messages,
                  ].map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-4 mx-3 px-3 py-2 ${
                        msg.role === "bot"
                          ? "bg-slate-800 pb-4 bg-opacity-30 border-slate-800 border border-opacity-70 rounded-[3px] my-2"
                          : ""
                      }`}
                    >
                      <div className="w-6- h-6- flex">
                        {msg.role === "bot" ? (
                          <div className="w-6 h-6 mt-[2px]  rounded-[2px] overflow-hidden">
                            <img
                              src="celo-gpt.webp"
                              className="w-full  h-full"
                              alt=""
                            />
                          </div>
                        ) : (
                          <div className="h-7 w-7 flex items-center bg-slate-700 rounded-[2px] justify-center">
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

                      <div>
                        {msg.role === "bot" && i !== 0 ? (
                          <AIMessage
                            loading={loading}
                            onCompleted={() => {
                              setscrolled(false);
                            }}
                            updateScroll={updateScroll}
                            setLoading={setLoading}
                            query={msg.content}
                          />
                        ) : (
                          <p className="text-[13.5px] flex- gap-3 font-[400]  leading-7">
                            {msg.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {!messages.length ? (
                  <div className="mt-auto flex justify-center items-center flex-col">
                    <h4 className="text-[13px] font-medium capitalize text-slate-400">
                      you can start by asking me questions like:{" "}
                    </h4>
                    <div className="flex py-4 items-center justify-center gap-4 flex-wrap ">
                      {suggestions.map((suggestion, i) => (
                        <a
                          onClick={(e) => {
                            setLoading(true);
                            sendMessage(e, suggestion);
                            updateScroll();
                          }}
                          className="px-4 py-2 border border-slate-800 border-opacity-60 cursor-pointer active:scale-95 transition-all bg-slate-800 bg-opacity-40 text-[13px] rounded-[3px]"
                        >
                          {suggestion}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="border-t py-2 px-2 border-slate-800">
                <form
                  onSubmit={(e) => {
                    handleSubmit(e);
                  }}
                  className="w-full border flex gap-3 items-center py-1 px-1  border-slate-800 bg-opacity-30 bg-slate-800 rounded-[3px]"
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
                    className="bg-transparent outline-none text-slate-300 font-[400] resize-none text-sm w-full py-1 px-2"
                    rows={1}
                    placeholder="Ask on open eneded question"
                  />

                  <a
                    onClick={(e) => handleSubmit(e)}
                    className={`h-10 cursor-pointer flex active:scale-95 transition-all justify-center items-center w-11 outline-none rounded-[3px] bg-gradient-to-r from-yellow-400 to-yellow-400 ${
                      loading ? "pointer-events-none opacity-80" : ""
                    }`}
                  >
                    <svg
                      height={20}
                      width={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
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
                  </a>
                </form>
              </div>
            </div>
          </div>
          <div
            style={{
              backgroundImage: "url(blur.svg-)",
            }}
            className="absolute bg-cover bg-center h-full opacity-50  w-full bg-gradient-to-b from-[#0c1120] top-0"
          />
          <div className="absolute h-full w-full bg-gradient-to-b from-[#0c1120] top-0" />
        </div>
      </div>

      {/* <main className="flex bg-[#FCF6F1] h-screen flex-col items-center justify-between p-24-">
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
              className="absolute px-2 flex bottom-5 max-w-[320px] md:max-w-md left-1/2 -translate-x-1/2 w-full"
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
                  <Send className="absolute right-4 md:right-4 text-gray-600 top-1/2 -translate-y-1/2" />
                </button>
              ) : (
                <button
                  className="absolute right-4 text-gray-600 top-1/2 -translate-y-1/2"
                  disabled
                >
                  <Spinner className="w-6 h-6 " />
                </button>
              )}
            </form>
          </div>
        </main>
      </main> */}
    </>
  );
}
