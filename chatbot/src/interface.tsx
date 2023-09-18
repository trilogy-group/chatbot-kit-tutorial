export interface MessageProps {
  type: "sent" | "received";
  content: string;
}

export interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  sendMessage: () => void;
}
