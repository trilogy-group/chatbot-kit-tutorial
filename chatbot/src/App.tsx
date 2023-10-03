import React, { useState, useRef, useCallback, useEffect } from "react";
import { AvatarUE } from "./components/avatar-ue";
import { IconTray } from "./components/icon-tray";
import "./App.css";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import { models } from "./components/icon-tray/models";
import { useWebSocket } from "./hooks/useWebsocket";
import { MessageProps } from "./interface";
import {
  REACT_APP_BACKEND_ENDPOINT,
  WS_ENDPOINT,
  BACKEND_ENDPOINT,
} from "./constants";
import { MicState } from "./components/icon-tray/mic";
import { AudioState } from "./components/icon-tray/audio";

import { useLocalStorage } from "./hooks/useLocalStorage";

const App: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState<string>();
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [model, setModel] = useState<(typeof models)[0] | undefined>(undefined);

  const [micState, setMicState] = useState<MicState>(MicState.OFF);
  const [audioState, setAudioState] = useState<AudioState>(AudioState.ON);

  const [sessionIdUE, setSessionIdUE] = useState<string>();
  const [socketUrlUE, setSocketUrlUE] = useState<string>();
  const [loadingUE, setLoadingUE] = useState(true);
  const [animationURL, setanimationURL] = useState<string>();

  const [session, setSession_] = useLocalStorage("session");
  // extra session copy to avoid reassign of onUserMessage
  const sessionRef = useRef(session);
  const setSession = useCallback(
    (session: any) => {
      setSession_(session);
      sessionRef.current = session;
    },
    [setSession_]
  );
  const waitForSessionStart = useCallback(
    (sessionId: string) => {
      fetch(`${REACT_APP_BACKEND_ENDPOINT}/unreal/session/${sessionId}/`)
        .then((res) => res.json())
        .then(async (res) => {
          console.log(`Session ${sessionId} status ${res.status.S}`);
          setSession(res);
          if (["ACTIVE", "PERSISTENT"].includes(res.status.S)) {
            setSessionIdUE(sessionId);
            setSocketUrlUE(res.socketUrl.S);
            setanimationURL(res.backendUrl.S);
          } else if (res.status.S === "PENDING") {
            setTimeout(() => {
              waitForSessionStart(sessionId);
            }, 2000);
          }
        })
        .catch((err) =>
          console.error(`Error in fetching session details ${err}`)
        );
    },
    [setSession, setSessionIdUE, setSocketUrlUE, setanimationURL]
  );

  useEffect(() => {
    if (model?.isServer) {
      if (
        sessionRef.current &&
        ["PENDING", "ACTIVE", "PERSISTENT"].includes(
          sessionRef.current.status.S
        ) &&
        Date.now() - Number(sessionRef.current.lastUse.N) <= 300000
      ) {
        waitForSessionStart(sessionRef.current.sessionId.S);
      } else {
        fetch(`${REACT_APP_BACKEND_ENDPOINT}/unreal/session/`, {
          method: "POST",
        })
          .then((res) => res.json())
          .then((res) => {
            setSession(res);
            waitForSessionStart(res.sessionId.S);
          })
          .catch((err) =>
            console.error(`Error in creating server session ${err}`)
          );
      }
      return () => {
        if (sessionIdUE && sessionRef.current?.status === "ACTIVE") {
          fetch(
            `${REACT_APP_BACKEND_ENDPOINT}/unreal/session/${sessionIdUE}/`,
            {
              method: "DELETE",
            }
          )
            .then((_) => {
              setSessionIdUE(undefined);
              setSession(undefined);
            })
            .catch((err) =>
              console.error(
                "Error in destroying server session",
                sessionIdUE,
                err
              )
            );
        }
      };
    }
  }, [model]); // eslint-disable-line

  const ws = useWebSocket(WS_ENDPOINT);

  useEffect(() => {
    if (ws) {
      setIsConnected(true);
    } else {
      setIsConnected(false);
    }
  }, [ws]);
  useEffect(() => {
    if (ws && isConnected) {
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
                console.log(prevMessages);
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
  }, [ws, isConnected]);

  const sendMessage = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "sent", content: message, contentType: "" },
    ]);
    setIsThinking(true);
    fetch(`${BACKEND_ENDPOINT}/conversation`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setMessages((prevMessages) => {
          const contentType = "answer";
          fetch(`${animationURL}/session/${sessionIdUE}/speech/`, {
            method: "POST",
            body: JSON.stringify({ text: data.response }),
            headers: { "Content-Type": "application/json" },
          })
            .then((_) =>
              console.log(
                `Successfully sent speech request to unreal session ${sessionIdUE}`
              )
            )
            .catch((err) =>
              console.error(
                `Error in speech request to unreal session ${sessionIdUE}: ${err}`
              )
            );
          return [
            ...prevMessages,
            { type: "received", content: data.response, contentType },
          ];
        });
        setIsThinking(false);
      })
      .catch((error) => console.error("Error:", error));
    console.log("Message sent");
  };
  const onAudioEnd = useCallback(() => {
    setAudioUrl(undefined);
  }, [setAudioUrl]);
  const onUserMessage = useCallback(
    (message?: string) => {
      setLoadingUE(true);
      fetch(
        `${REACT_APP_BACKEND_ENDPOINT}/unreal/session/${sessionIdUE}/conversation/`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message, autoGenerate: true }),
        }
      )
        .then((_) =>
          setSession({
            ...sessionRef.current,
            lastUse: { N: Date.now().toString() },
          })
        )
        .catch((err) =>
          console.error(
            "Error in sending conversation request to session",
            sessionIdUE,
            err
          )
        );
    },
    [sessionIdUE, setSession]
  );
  return (
    <div className="App">
      <div className="left-partition">
        <h1>Welcome to your coding assistant</h1>
        <div className="beta-version">This is a beta version</div>
      </div>
      <div className="right-partition">
        <MessageList messages={messages} isThinking={isThinking} />
        {!isConnected && (
          <div className="connecting">
            <span>Connecting to server...</span>
          </div>
        )}
        <div className="chat-input-container">
          <div className="avatar-icon-container">
            <AvatarUE
              loading={loadingUE}
              setLoading={setLoadingUE}
              sessionStatus={session?.status.S}
              lastUse={session?.lastUse.N}
              socketUrl={socketUrlUE}
              setMicState={setMicState}
              audioState={audioState}
            />
            <IconTray
              audioUrl={audioUrl}
              onTranscription={onUserMessage}
              onAudioEnd={onAudioEnd}
              setModel={setModel}
              micState={micState}
              setMicState={setMicState}
              audioState={audioState}
              setAudioState={setAudioState}
            />
          </div>
          <ChatInput
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
