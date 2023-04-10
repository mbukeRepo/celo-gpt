import ChatProvider from "@/context/chat-context";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ChatProvider>
      <Component {...pageProps} />
    </ChatProvider>
  );
}
