"use client";

import { useState } from "react";
import { Grid, IconButton } from "@mui/material";
import { RefObject, useEffect, FC } from "react";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

type Props = {
  videoRef: RefObject<HTMLVideoElement>;
  onTimeUpdate: (time: number) => void;
};

const Controls: FC<Props> = ({ videoRef, onTimeUpdate }) => {
  const [paused, setPaused] = useState<boolean>(false);

  const fastForward = () => {
    videoRef.current!.controls = false;
    const newTime2 = videoRef.current!.currentTime + 5;
    videoRef.current!.currentTime = newTime2;
    videoRef.current!.controls = false;
    onTimeUpdate(newTime2);
  };
  const rewind = () => {
    videoRef.current!.controls = false;
    const newTime1 = videoRef.current!.currentTime - 5;
    videoRef.current!.currentTime = newTime1;
    videoRef.current!.controls = false;
    onTimeUpdate(newTime1);
  };
  const pause = () => {
    if (videoRef.current!.paused) {
      videoRef.current!.play();
      setPaused(false);
    } else {
      videoRef.current!.pause();
      setPaused(true);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case "ArrowLeft":
          event.preventDefault();
          rewind();
          break;
        case "ArrowRight":
          event.preventDefault();
          fastForward();
          break;
        case "Space":
          event.preventDefault();
          pause();
          break;
        default:
          break;
      }
    };

    addEventListener("keydown", handleKeyPress);

    return () => {
      removeEventListener("keydown", handleKeyPress);
    };
  }, [fastForward, rewind, pause]);

  return (
    <Grid item container justifyContent="space-evenly" sx={{ height: 80 }}>
      <Grid item>
        <IconButton size="large" onClick={rewind}>
          <FastRewindIcon fontSize="inherit" />
        </IconButton>
      </Grid>
      <Grid item>
        <IconButton size="large" onClick={pause}>
          {paused ? (
            <PlayArrowIcon fontSize="inherit" />
          ) : (
            <PauseIcon fontSize="inherit" />
          )}
        </IconButton>
      </Grid>
      <Grid item>
        <IconButton size="large" onClick={fastForward}>
          <FastForwardIcon fontSize="inherit" />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default Controls;
