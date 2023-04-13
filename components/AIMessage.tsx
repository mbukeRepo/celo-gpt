import { useTextBuffer } from "../hooks/useTextBuffer";
import { StreamingText } from "./StreamingText";
import React, { Dispatch, SetStateAction, useEffect } from "react";

const AIMessage = ({
  query,
  setLoading,
}: {
  query: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const { buffer, done, refresh, cancel } = useTextBuffer({
    url: "/api/celo-gpt",
    throttle: 100,
    method: "POST",
    data: query,
  });

  useEffect(() => {
    if (done) {
      setLoading(false);
    }
  }, [done]);
  return (
    <div>
      <StreamingText buffer={buffer} />
    </div>
  );
};

export default AIMessage;
