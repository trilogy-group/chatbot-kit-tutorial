import { useCallback, useEffect, useRef, useState } from "react";
import { WebRtcPlayer } from "./WebRtcPlayer";
import { MicState } from "../icon-tray/mic";
import { AudioState } from "../icon-tray/audio";

import { LinearProgress } from "@mui/material";

const WS_OPEN_STATE = 1;
const streamerId = "DefaultStreamer";
const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export interface AvatarUEProps {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    sessionStatus?: string;
    lastUse?: number;
    socketUrl?: string;
    setMicState?: (micState: MicState | ((prevMicState: MicState) => MicState)) => void;
    audioState: AudioState;
}

export const AvatarUE = ({
    loading,
    setLoading,
    sessionStatus,
    lastUse,
    socketUrl,
    setMicState,
    audioState
}: AvatarUEProps) => {
    const webSocket = useRef<WebSocket>();
    const webRtcPlayer = useRef<WebRtcPlayer>();
    const autoPlayAudio = useRef<Boolean>(true);
    const [message, setMessage] = useState<string | undefined>("Getting your avatar ready! It's like brewing the perfect cup of coffee - takes 2-3 minutes");
    const micOnTimeout = useRef<NodeJS.Timeout>();
    const listStreamersInterval = useRef<NodeJS.Timer>();

    const playVideo = useCallback(() => {
        setLoading(false);
        setMessage(undefined);
        webRtcPlayer.current?.video.play().catch((onRejectedReason: any) => {
            if (webRtcPlayer.current?.audio.srcObject) {
                webRtcPlayer.current?.audio.pause();
            }
            console.error(onRejectedReason);
            console.log("Browser does not support autoplaying video without interaction - to resolve this we are going to show the play button overlay.");
        });
    }, [setLoading]);

    const playStream = useCallback(() => {
        if (webRtcPlayer.current && webRtcPlayer.current.video) {
            if (webRtcPlayer.current.audio.srcObject && autoPlayAudio.current) {
                // Video and Audio are seperate tracks
                webRtcPlayer.current.audio.play().then(() => {
                    // audio play has succeeded, start playing video
                    playVideo();
                }).catch((onRejectedReason) => {
                    console.error(onRejectedReason);
                    console.log("Browser does not support autoplaying audio without interaction - to resolve this we are going to show the play button overlay.")
                });
            } else {
                // Video and audio are combined in the video element
                playVideo();
            }
        }
    }, [playVideo]);

    const handleConnectionError = useCallback(() => {
        setMessage("Oops! We're having trouble connecting your avatar. Consider switching networks, like using mobile data, and try again.");
    }, [setMessage]);
    
    const setupWebRtcPlayer = useCallback((htmlElement: any, config: any) => {
        const webRtcPlayerObj: any = webRtcPlayer.current = new WebRtcPlayer(config, handleConnectionError);
        const ws = webSocket.current;
        autoPlayAudio.current = typeof config.autoPlayAudio !== 'undefined' ? config.autoPlayAudio : true;
        htmlElement.appendChild(webRtcPlayerObj.video);
        htmlElement.appendChild(webRtcPlayerObj.audio);

        webRtcPlayerObj.onWebRtcOffer = function (offer: any) {
            if (ws && ws.readyState === WS_OPEN_STATE) {
                let offerStr = JSON.stringify(offer);
                console.log("%c[Outbound SS message (offer)]", "background: lightgreen; color: black", offer);
                ws.send(offerStr);
            }
        };

        webRtcPlayerObj.onWebRtcCandidate = function (candidate: any) {
            if (ws && ws.readyState === WS_OPEN_STATE) {
                ws.send(JSON.stringify({
                    type: 'iceCandidate',
                    candidate: candidate
                }));
            }
        };

        webRtcPlayerObj.onWebRtcAnswer = function (answer: any) {
            if (ws && ws.readyState === WS_OPEN_STATE) {
                let answerStr = JSON.stringify(answer);
                console.log("%c[Outbound SS message (answer)]", "background: lightgreen; color: black", answer);
                ws.send(answerStr);

                if (webRtcPlayerObj.sfu) {
                    // Send data channel setup request to the SFU
                    const requestMsg = { type: "dataChannelRequest" };
                    console.log("%c[Outbound SS message (dataChannelRequest)]", "background: lightgreen; color: black", requestMsg);
                    ws.send(JSON.stringify(requestMsg));
                }
            }
        };

        webRtcPlayerObj.onSFURecvDataChannelReady = function () {
            if (webRtcPlayerObj.sfu) {
                // Send SFU a message to let it know browser data channels are ready
                const requestMsg = { type: "peerDataChannelsReady" };
                console.log("%c[Outbound SS message (peerDataChannelsReady)]", "background: lightgreen; color: black", requestMsg);
                ws?.send(JSON.stringify(requestMsg));
            }
        }

        webRtcPlayerObj.onVideoInitialised = function () {
            if (ws && ws.readyState === WS_OPEN_STATE) {
                playStream();
            }
        };

        webRtcPlayerObj.onNewVideoTrack = function (streams: any) {
            if (webRtcPlayerObj.video && webRtcPlayerObj.video.srcObject && webRtcPlayerObj.onVideoInitialised) {
                webRtcPlayerObj.onVideoInitialised();
            }
        }
    }, [handleConnectionError, playStream]);

    const onConfig = useCallback((config: any) => {
        let playerDiv = document.getElementById('player');
        setupWebRtcPlayer(playerDiv, config);
    }, [setupWebRtcPlayer]);

    function onWebRtcOffer(webRTCData: any) {
        webRtcPlayer.current?.receiveOffer(webRTCData);
    }

    function onWebRtcAnswer(webRTCData: any) {
        webRtcPlayer.current?.receiveAnswer(webRTCData);
    }

    function onWebRtcSFUPeerDatachannels(webRTCData: any) {
        webRtcPlayer.current?.receiveSFUPeerDataChannelRequest(webRTCData);
    }

    function onWebRtcIce(iceCandidate: any) {
        webRtcPlayer.current?.handleCandidateFromServer(iceCandidate);
    }

    function closeStream() {
        console.log("----------------------Closing stream----------------------");
        if (webRtcPlayer.current) {
            // Remove video element from the page.
            let playerDiv = document.getElementById('player');
            if (playerDiv) {
                playerDiv.removeChild(webRtcPlayer.current.video);
            }
            // Close the peer connection and associated webrtc machinery.
            webRtcPlayer.current.close();
            webRtcPlayer.current = undefined;
        }
    }

    const waitForSocketToReady = useCallback(() => {
        return new Promise<void>((resolve, reject) => {
            if (socketUrl) {
                const ws = new WebSocket(socketUrl);
                ws.onopen = () => {
                    console.log("Connected to websocket");
                    resolve();
                }
                ws.onerror = () => {
                    console.log("Failed to connect to websocket, trying again in 5 seconds");
                    sleep(5000).then(waitForSocketToReady).then(resolve);
                }
            } else reject();
        });
    }, [socketUrl]);

    useEffect(() => {
        if (socketUrl) {
            waitForSocketToReady().then(() => {
                webSocket.current = new WebSocket(socketUrl);
                const ws: any = webSocket.current
                ws.attemptStreamReconnection = true;

                ws.onmessagebinary = function (event: any) {
                    if (!event || !event.data) { return; }

                    event.data.text().then(function (messageString: any) {
                        // send the new stringified event back into `onmessage`
                        ws.onmessage({ data: messageString });
                    }).catch(function (error: any) {
                        console.error(`Failed to parse binary blob from websocket, reason: ${error}`);
                    });
                }

                ws.onmessage = function (event: MessageEvent) {
                    // Check if websocket message is binary, if so, stringify it.
                    if (event.data && event.data instanceof Blob) {
                        ws.onmessagebinary(event);
                        return;
                    }

                    let msg = JSON.parse(event.data);
                    if (msg.type === 'config') {
                        console.log("%c[Inbound SS (config)]", "background: lightblue; color: black", msg);
                        onConfig(msg);
                    } else if (msg.type === "streamerList") {
                        if (msg.ids.length) {
                            console.log("Connected streamers", msg.ids);
                            if (msg.ids.includes(streamerId)) {
                                clearInterval(listStreamersInterval.current);
                                listStreamersInterval.current = undefined;
                                ws.send(JSON.stringify({
                                    type: "subscribe",
                                    streamerId: streamerId
                                }));
                            }
                        }
                    } else if (msg.type === 'playerCount') {
                        console.log("%c[Inbound SS (playerCount)]", "background: lightblue; color: black", msg);
                    } else if (msg.type === 'offer') {
                        console.log("%c[Inbound SS (offer)]", "background: lightblue; color: black", msg);
                        onWebRtcOffer(msg);
                    } else if (msg.type === 'answer') {
                        console.log("%c[Inbound SS (answer)]", "background: lightblue; color: black", msg);
                        onWebRtcAnswer(msg);
                    } else if (msg.type === 'iceCandidate') {
                        onWebRtcIce(msg.candidate);
                    } else if (msg.type === 'warning' && msg.warning) {
                        console.warn(msg.warning);
                    } else if (msg.type === 'peerDataChannels') {
                        onWebRtcSFUPeerDatachannels(msg);
                    } else {
                        console.error("Invalid SS message type", msg.type);
                    }
                };

                ws.onerror = function (event: any) {
                    console.log(`WS error: ${JSON.stringify(event)}`);
                };

                ws.onclose = function (event: any) {
                    if (lastUse && Date.now() - Number(lastUse) > 300000) {
                        setMessage("Avatar session closed because of inactivity");
                    } else {
                        setMessage(`Avatar session closed. Server error: ${JSON.stringify(event.code)} - ${event.reason}`);
                    }
                    closeStream();

                    if (ws.attemptStreamReconnection === true) {
                        console.log(`WS closed: ${JSON.stringify(event.code)} - ${event.reason}`);
                    }

                    webSocket.current = undefined;
                };

                ws.onopen = (e: Event) => {
                    listStreamersInterval.current = setInterval(() => {
                        ws.send(JSON.stringify({
                            type: "listStreamers"
                        }));
                    }, 1000);
                }
            });

            return () => {
                webSocket.current?.close();
                webSocket.current = undefined;
            }
        }
    }, [socketUrl, waitForSocketToReady, onConfig]); // eslint-disable-line

    useEffect(() => {
        if (setMicState) {
            const interval = setInterval(() => {
                if (webRtcPlayer.current?.pcClient) {
                    const receivers = webRtcPlayer.current?.pcClient.getReceivers();
                    for (let receiver of receivers) {
                        const sources = receiver.getSynchronizationSources();
                        for (let source of sources) {
                            if (source.audioLevel !== undefined) {
                                if (source.audioLevel !== 0) {
                                    micOnTimeout.current && clearTimeout(micOnTimeout.current);
                                    micOnTimeout.current = undefined;
                                    setLoading(false);
                                    setMicState((micState: MicState) => {
                                        if (micState === MicState.ON) return MicState.DISABLED_ON;
                                        else if (micState === MicState.OFF) return MicState.DISABLED_OFF;
                                        return micState;
                                    });
                                } else if (source.audioLevel === 0) {
                                    if (!micOnTimeout.current) {
                                        micOnTimeout.current = setTimeout(() => {
                                            setMicState((micState: MicState) => {
                                                if (micState === MicState.DISABLED_ON) return MicState.ON;
                                                else if (micState === MicState.DISABLED_OFF) return MicState.OFF;
                                                return micState;
                                            });
                                        }, 1500);
                                    }
                                }
                            }
                        }
                    }
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [setMicState, setLoading]);

    useEffect(() => {
        if (webRtcPlayer.current && webRtcPlayer.current.audio) {
            if (audioState === AudioState.OFF) {
                webRtcPlayer.current.audio.muted = true;
            } else if (audioState === AudioState.ON) {
                webRtcPlayer.current.audio.muted = false;
            }
        }
    }, [audioState]);

    useEffect(() => {
        if (sessionStatus === "COMPLETE") {
            setLoading(false);
            setMessage("No resource available at the moment, please try again in some time");
        }
    }, [sessionStatus, setLoading, setMessage]);

    return (
        <div style={{ position: 'absolute', overflow: 'hidden', height: '20%', width: '20%' }}>
          {loading && <LinearProgress style={{ position: 'absolute', top: 0, width: '100%' }} />}
          {message && <p>{message}</p>}
          {sessionStatus && ["ACTIVE", "PERSISTENT"].includes(sessionStatus) && <div id="player" style={{ height: "100%", width: "100%" }}></div>}
        </div>
      );
}