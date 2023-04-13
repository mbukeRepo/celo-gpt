import { useTextBuffer } from "../hooks/useTextBuffer";
import { StreamingText } from "./StreamingText";
import React, { Dispatch, SetStateAction, useEffect } from "react";

const AIMessage = ({
  query,
  setLoading,
  updateScroll,
  onCompleted,
  loading,
  loadingMessage,
  id,
  setloadingMessage,
}: {
  query: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  updateScroll: () => void;
  onCompleted: () => void;
  loading: boolean;
  setloadingMessage: Dispatch<SetStateAction<number | undefined>>;
  loadingMessage: number | undefined;
  id: number;
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
      setloadingMessage(undefined);
    }
  }, [done]);

  useEffect(() => {
    updateScroll();
    if (!loadingMessage) {
      setloadingMessage(id);
    }
  }, [buffer]);

  return (
    <div className="dark:prose-invert w-full prose prose-slate text-[13.5px] font-[400]  leading-7">
      <StreamingText
        loadingMessage={loadingMessage}
        loading={loading}
        done={done}
        buffer={buffer}
      />
    </div>
  );
};

export default AIMessage;
