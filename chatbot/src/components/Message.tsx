import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism"

interface MessageProps {
  type: 'sent' | 'received';
  content: string;
}
const Message: React.FC<MessageProps> = ({ type, content }) => (
  <div className={`message ${type}`}>
    <ReactMarkdown
      components={{
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline && match ? (
            <SyntaxHighlighter style={okaidia} language={match[1]} PreTag="div">
              {String(children)}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }
      }}
    >
      {content.replace(/\n/g, '  \n')}
    </ReactMarkdown>
  </div>
);

export default Message;