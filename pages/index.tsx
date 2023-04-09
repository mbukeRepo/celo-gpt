import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useState } from "react";
import axios from "axios";
import remarkGfm from "remark-gfm";
import ReactMarkdown from "react-markdown";
import { useTextBuffer } from "../hooks/useTextBuffer";
import { StreamingText } from "../components/StreamingText";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [answer, setAnswer] = useState("");
  const [query, setQuery] = useState(
    "The easiest way to access ContractKit in your React applications."
  );
  const { buffer, done, refresh, cancel } = useTextBuffer({
    url: "/api/celo-gpt",
    throttle: 100,
    method: "POST",
    data: query,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <StreamingText buffer={buffer} />
    </main>
  );
}
