import React from 'react';

interface MessageProps {
  type: 'sent' | 'received';
  content: string;
}

const Message: React.FC<MessageProps> = ({ type, content }) => (
  <div className={`message ${type}`}>
    <p>{content}</p>
  </div>
);

export default Message;