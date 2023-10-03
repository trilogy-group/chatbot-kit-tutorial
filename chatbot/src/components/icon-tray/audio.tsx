import { useEffect, useRef } from "react";
import IconButton from "@mui/material/IconButton";
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

export enum AudioState {
  ON,
  OFF
}

export interface AvatarVoiceProps {
  url?: string;
  onEnd?: () => void;
  state: AudioState;
  setState: (audioStae: AudioState) => void;
}

export const AvatarVoice = ({ url, onEnd, state, setState }: AvatarVoiceProps) => {
  const muted = state === AudioState.OFF;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const Icon = muted ? VolumeOffIcon : VolumeUpIcon;

  useEffect(() => {
    function isValidBase64(str: string) {
      const regex = /^data:audio\/([a-zA-Z0-9]+);base64,([a-zA-Z0-9+/]+={0,2})$/;
      return regex.test(str);
    }

    if (url) {
      const audio = new Audio(url);
      audioRef.current = audio;
      if (onEnd) audio.onended = onEnd;
      audio.muted = muted;
      if (isValidBase64(url)){
        audio.play();
      } else {
        console.log("Current audio is of invalid format", url)
        const event = new Event('ended');
        audio.dispatchEvent(event);
      }
      return () => onEnd && audio.removeEventListener("ended", onEnd);
    }
  }, [url, onEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <IconButton
      style={{
        background: "#7070ff",
        color: "white",
        borderRadius: "100px",
        padding: 16,
        height: "2em",
        width: "2em",
        boxShadow:
            "0 8px 16px 0 rgba(0,0,0,0.2), 0 6px 20px 0 rgba(0,0,0,0.19)",
      }}
      onClick={() => {
        if (state === AudioState.ON) setState!(AudioState.OFF);
        else if (state === AudioState.OFF) setState!(AudioState.ON);
      }}
    >
      <Icon
        style={{
          height: "1.3em",
          width: "1.3em",
        }}
      />
    </IconButton>
  );
};