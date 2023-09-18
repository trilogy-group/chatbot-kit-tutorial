import React, { useState, useEffect } from "react";
import "./App.css";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { useWebSocket } from "./hooks/useWebsocket";
import { MessageProps } from "./interface";

const App: React.FC = () => {
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const ws = useWebSocket(
    "wss://..."
  );

  useEffect(() => {
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.op === "chat" && data.type === "message") {
          setTimeout(() => {
            setMessages((prevMessages) => {
              if (
                prevMessages.length === 0 ||
                prevMessages[prevMessages.length - 1].type === "sent"
              ) {
                const contentType = data.text.startsWith("Thought:")
                  ? "thought"
                  : "answer";
                return [
                  ...prevMessages,
                  { type: "received", content: data.text, contentType },
                ];
              } else {
                const newMessages = [...prevMessages];
                const lastMessage = newMessages[newMessages.length - 1];
                const updatedLastMessage = {
                  ...lastMessage,
                  content: lastMessage.content + data.text,
                };
                newMessages[newMessages.length - 1] = updatedLastMessage;
                return newMessages;
              }
            });
            setIsThinking(false);
          }, 2000);
        }
      };
    }
  }, [ws]);

  const sendMessage = () => {
    if (ws) {
      ws.send(
        JSON.stringify({
          op: "chat",
          type: "message",
          text: message,
        })
      );
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: "sent", content: message, contentType: "" },
      ]);
      setMessage("");
      setIsThinking(true);
      console.log("Message sent");
    } else {
      console.log("Cannot send message, not connected to WS server");
    }
  };

  return (
    <div className="App">
      <div className="left-partition">
        <h1>Welcome to your coding assistant</h1>
        <div className="beta-version">This is a beta version</div>
      </div>
      <div className="right-partition">
        <MessageList messages={messages} isThinking={isThinking} />
        <ChatInput
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
        />
      </div>
    </div>
  );
};

export default App;
