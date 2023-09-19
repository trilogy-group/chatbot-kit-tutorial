import React from "react";
import Message from "./Message";
import { MessageProps } from "../interface";

interface MessageListProps {
  messages: MessageProps[];
  isThinking: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isThinking }) => (
  <div className="messages-container">
    {messages.map((message, index) => (
      <Message key={index} type={message.type} content={message.content} />
    ))}
    {isThinking && (
      <div className="message thinking">
        <span>Thinking...</span>
      </div>
    )}
  </div>
);

export default MessageList;
