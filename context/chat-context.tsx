import {
  createContext,
  ReactNode,
  useContext,
  useCallback,
  useState,
  useMemo,
} from "react";
import axios from "axios";
import { FormEventHandler } from "react";

interface IChatContext {
  messages: { role: string; content: string }[];
  sendMessage: (event: any, data: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ChatContext = createContext<IChatContext>({
  messages: [],
  sendMessage: () => {},
  loading: false,
  setLoading: () => {},
});

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(
    async (event: any, message: string) => {
      event.preventDefault();
      const userMessage = {
        role: "user",
        content: message,
      };
      setMessages((messages) => [
        ...messages,
        userMessage,
        { role: "bot", content: message },
      ]);
    },
    [messages, messages]
  );

  const value = useMemo(
    () => ({ messages, sendMessage, loading, setLoading }),
    [messages, sendMessage]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatProvider;

export const useChat = () => useContext(ChatContext);
