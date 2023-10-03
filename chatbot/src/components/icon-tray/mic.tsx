import { useEffect, useState, useRef } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

export enum MicState {
  ON,
  OFF,
  DISABLED_ON,
  DISABLED_OFF,
}

export interface MicProps {
  state: MicState;
  setState: (tate: MicState) => void;
  onTranscription?: (message?: string) => void;
}

export const Mic = ({ state, setState, onTranscription }: MicProps) => {
  const [transcribedText, setTranscribedText] = useState<string>('Click here to talk');

  const restartFlag = useRef(false);
  const disabled =
    state === MicState.DISABLED_ON || state === MicState.DISABLED_OFF;
  const Icon =
    state === MicState.ON || state === MicState.DISABLED_ON
      ? MicIcon
      : MicOffIcon;

  useEffect(() => {
    if (state === MicState.ON) {
      let recognition: any;

      if ("SpeechRecognition" in window) {
        recognition = new (window as any).SpeechRecognition();
      } else if ("webkitSpeechRecognition" in window) {
        recognition = new (window as any).webkitSpeechRecognition();
      }
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        console.log("MicLogs: Recognition Result", event);
        const latestResultKey = Object.keys(event.results).slice(-1)[0];
        const message = event.results[latestResultKey][0].transcript.trim();

        if (message.trim()) {
          onTranscription && onTranscription(message.trim());
          setTranscribedText(message.trim())
        }
      };
      recognition.onend = (event: Event) => {
        if (restartFlag.current) {
          restartFlag.current = false;
          recognition.start();
          console.log("MicLogs: Restarted listening");
        }
      };
      recognition.onerror = (event: any) => {
        console.log("MicLogs: Error in recognition: ", event);
        if (event.error === "no-speech") {
          restartFlag.current = true;
          recognition.stop();
        } else {
          if (state === MicState.ON) setState(MicState.OFF);
          else if (state === MicState.DISABLED_ON)
            setState(MicState.DISABLED_OFF);
        }
      };
      recognition.start();
      console.log("MicLogs: Started listening");

      return () => {
        recognition.stop();
        console.log("MicLogs: Stopped listening");
      };
     } else if (state === MicState.DISABLED_ON || state === MicState.DISABLED_OFF) {
      setTranscribedText('');
    }
  }, [state, setState, onTranscription]);


  return (
    <Tooltip title={<Typography fontSize={16}>{transcribedText}</Typography>} open={transcribedText.length > 0}  arrow placement="left">
      <IconButton
        style={{
          background: disabled ? "#F94449" : "#7070ff",
          color: "white",
          borderRadius: "50%",
          padding: 16,
          height: "2em",
          width: "2em",
          boxShadow:
            "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)",
        }}
        onClick={() => {
          setTranscribedText('');
          if (state === MicState.ON) setState!(MicState.OFF);
          else if (state === MicState.OFF) setState!(MicState.ON);
          else if (state === MicState.DISABLED_ON)
            setState!(MicState.DISABLED_OFF);
          else if (state === MicState.DISABLED_OFF)
            setState!(MicState.DISABLED_ON);
        }}
      >
        <Icon
          style={{
            height: "1.3em",
            width: "1.3em",
          }}
        />
      </IconButton>
    </Tooltip>
  );
};