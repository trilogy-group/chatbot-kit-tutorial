import { useState, useEffect } from "react";

export const useWebSocket = (url: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(url);
    websocket.onopen = () => console.log("Connected to WS server");
    websocket.onclose = () => console.log("Disconnected from WS server");
    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  return ws;
};