// ChatInput.tsx
import React, { KeyboardEvent } from 'react';
import { ChatInputProps } from '../interface';


const ChatInput: React.FC<ChatInputProps> = ({ message, setMessage, sendMessage }) => (
  <div className="input-container">
    <input
      type="text"
      value={message}
      onChange={e => setMessage(e.target.value)}
      onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          sendMessage();
        }
      }}
    />
    <svg onClick={sendMessage} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send-icon">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  </div>
);

export default ChatInput;