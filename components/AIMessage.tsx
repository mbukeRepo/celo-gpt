import { useTextBuffer } from "../hooks/useTextBuffer";
import { StreamingText } from "./StreamingText";
import React from "react";

const AIMessage = ({ query }: { query: string }) => {
  const { buffer, done, refresh, cancel } = useTextBuffer({
    url: "/api/celo-gpt",
    throttle: 100,
    method: "POST",
    data: query,
  });
  return (
    <div>
      <StreamingText buffer={buffer} />
    </div>
  );
};

export default AIMessage;
