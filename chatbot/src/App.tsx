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

  useEffect(() => {
    const websocket = new WebSocket("ws://your-websocket-endpoint");
    websocket.onopen = () => console.log("Connected to WS server");
    websocket.onmessage = (event) => {
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { type: "received", content: event.data },
        ]);
        setIsThinking(false);
      }, 2000); // delay of 2 seconds
    };
    websocket.onclose = () => console.log("Disconnected from WS server");
    setWs(websocket);
  }, []);

  const sendMessage = () => {
    if (ws) {
      ws.send(message);
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
