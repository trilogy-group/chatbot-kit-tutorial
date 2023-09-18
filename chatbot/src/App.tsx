import React, { useState, useEffect } from "react";
import "./App.css";
import Message from "./components/Message";
import ChatInput from "./components/ChatInput";

interface MessageProps {
  type: "sent" | "received";
  content: string;
}

const App: React.FC = () => {
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  // const [finalAnswer, setFinalAnswer] = useState<string>("");

  useEffect(() => {
    const websocket = new WebSocket(
      "wss://<id>"
    );
    websocket.onopen = () => console.log("Connected to WS server");
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.op === "chat" && data.type === "message") {
        setTimeout(() => {
          setMessages((prevMessages) => {
            // If there are no previous messages or the last message is sent by the user, create a new received message
            if (
              prevMessages.length === 0 ||
              prevMessages[prevMessages.length - 1].type === "sent"
            ) {
              return [
                ...prevMessages,
                { type: "received", content: data.text },
              ];
            } else {
              // Otherwise, append the token to the last received message
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
        }, 2000); // delay of 2 seconds
      }
    };
    websocket.onclose = () => console.log("Disconnected from WS server");
    setWs(websocket);
  }, []);

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
        { type: "sent", content: message },
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
        <h1>Welcome to Chatbot template!</h1>
      </div>
      <div className="right-partition">
        <div className="messages-container">
          {messages.map((message, index) => (
            <Message
              key={index}
              type={message.type}
              content={message.content}
            />
          ))}
          {isThinking && (
            <div className="message thinking">
              Thinking<span className="dot">...</span>
            </div>
          )}
        </div>
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
