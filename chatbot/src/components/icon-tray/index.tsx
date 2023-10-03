import { AudioState, AvatarVoice } from "./audio";
import { Mic, MicState } from "./mic";
import { SelectModel } from "./select-model";

export interface IconTrayProps {
  audioUrl?: string;
  onAudioEnd?: () => void;
  onTranscription?: () => void;
  setModel: (model: any) => void;
  micState: MicState;
  setMicState: (state: MicState) => void;
  audioState: AudioState;
  setAudioState: (state: AudioState) => void;
}

export const IconTray = ({
  audioUrl,
  onAudioEnd,
  onTranscription,
  setModel,
  micState,
  setMicState,
  audioState, 
  setAudioState
}: IconTrayProps) => {
  return (
    <div
      style={{
        marginTop: "25px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-evenly",
        position: "relative",
        bottom: "1em",
        alignSelf: "center",
        width: "1em",
        gap: "1em"
      }}
    >
      <SelectModel setModel={setModel} />
      <AvatarVoice
        url={audioUrl}
        state={audioState}
        setState={setAudioState}
        onEnd={onAudioEnd}
      />
      <Mic
        state={micState}
        setState={setMicState}
        onTranscription={onTranscription}
      />
    </div>
  );
};