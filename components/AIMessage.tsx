import { useTextBuffer } from "../hooks/useTextBuffer";
import { StreamingText } from "./StreamingText";
import React, { Dispatch, SetStateAction, useEffect } from "react";

const AIMessage = ({
  query,
  setLoading,
  updateScroll,
  onCompleted,
  loading,
}: {
  query: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  updateScroll: () => void;
  onCompleted: () => void;
  loading: boolean;
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
      onCompleted();
    }
  }, [done]);

  useEffect(() => {
    updateScroll();
  }, [buffer]);

  return (
    <div className="dark:prose-invert prose prose-slate text-[13.5px] font-[400]  leading-7">
      <StreamingText loading={loading} buffer={buffer} />
    </div>
  );
};

export default AIMessage;
