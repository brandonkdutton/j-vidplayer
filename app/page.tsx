"use client";

import { Grid, Typography, Button, IconButton, styled } from "@mui/material";
import { parse } from "@plussub/srt-vtt-parser";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import ReadingsList, { Reading } from "./ReadingsList";
import FastForwardIcon from "@mui/icons-material/FastForward";
import FastRewindIcon from "@mui/icons-material/FastRewind";
import PauseIcon from "@mui/icons-material/Pause";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

enum FileType {
  SUB = "SUB",
  VID = "VID",
}

type SubTextGroup = {
  from: number;
  to: number;
  text: string;
  readings: Reading[];
};

export default function Home() {
  const [subText, setSubText] = useState<SubTextGroup[]>([]);
  const [subLines, setSubLines] = useState<[string, Reading[]]>(["", []]);
  const [hideFileInputs, setHideFileInputs] = useState<boolean>(false);
  const [videoFile, setVideoFile] = useState<string>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const onTimeUpdate = (timeOverride?: number) => {
    const time = (timeOverride ?? videoRef.current?.currentTime ?? 0) * 1000;
    let l = 0;
    let r = subText.length - 1;

    let found = false;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);

      if (time >= subText[m].from && time < subText[m].to) {
        const newText = subText[m].text;
        found = true;
        setSubLines((old) => {
          if (newText === old[0]) {
            return old;
          }
          return [newText, subText[m].readings];
        });
        break;
      } else if (time > subText[m].to) {
        l = m + 1;
      } else {
        r = m - 1;
      }
    }
    if (!found) {
      setSubLines(["", []]);
    }
  };

  const loadSubFile = (url: string) => {
    fetch(url).then((value) => {
      value
        .text()
        .then((text) => {
          const textLines = text.split("\n");
          const subTextGroups: SubTextGroup[] = [];
          let group: Partial<SubTextGroup> = {};

          for (let i = 0; i < textLines.length; i++) {
            const line = textLines[i];
            switch (i % 4) {
              case 0:
                group.from = parseInt(line);
                break;
              case 1:
                group.to = parseInt(line);
                break;
              case 2:
                group.text = line;
                break;
              case 3:
                group.readings = JSON.parse(line);
                subTextGroups.push(group as SubTextGroup);
                group = {};
                break;
            }
          }

          setSubText(subTextGroups);
          console.log(subTextGroups);
        })
        .catch((e) => alert("error"));
    });
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    type: FileType
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const src = URL.createObjectURL(file);
    if (type === FileType.SUB) {
      loadSubFile(src);
    } else {
      setVideoFile(src);
    }
  };

  const fastForward = () => {
    videoRef.current!.controls = false;
    const newTime2 = videoRef.current!.currentTime + 5;
    onTimeUpdate(newTime2);
    videoRef.current!.currentTime = newTime2;
    videoRef.current!.controls = false;
  };
  const rewind = () => {
    videoRef.current!.controls = false;
    const newTime1 = videoRef.current!.currentTime - 5;
    onTimeUpdate(newTime1);
    videoRef.current!.currentTime = newTime1;
    videoRef.current!.controls = false;
  };
  const pause = () => {
    if (videoRef.current!.paused) {
      videoRef.current!.play();
    } else {
      videoRef.current!.pause();
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
  }, [videoRef]);

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      spacing={2}
      justifyContent="space-between"
      sx={{ width: "100%", height: "100%", minHeight: "80vh" }}
    >
      <Grid item container direction="column" alignItems="center" spacing={2}>
        <Grid item>
          <video
            id="video"
            style={{ width: "100%", maxHeight: 500 }}
            ref={videoRef}
            onTimeUpdate={() => onTimeUpdate()}
            webkit-playsinline
            playsInline
            autoPlay
            src={videoFile}
            controls
            muted={false}
          />
        </Grid>
        <Grid
          item
          container
          direction="column"
          alignItems="center"
          justifyContent="center"
          spacing={1}
        >
          <Grid item>
            <Typography sx={{ textAlign: "center" }}>{subLines[0]}</Typography>
          </Grid>
        </Grid>
      </Grid>

      {!hideFileInputs && (
        <Grid item container justifyContent="space-evenly">
          <Grid item>
            <Button variant="text" component="label">
              Video file
              <VisuallyHiddenInput
                type="file"
                accept="video/*"
                onChange={(e) => handleFileChange(e as any, FileType.VID)}
              />
            </Button>
          </Grid>
          <Grid item>
            <Button variant="text" component="label">
              Subtitles file
              <VisuallyHiddenInput
                type="file"
                accept=".subtitles"
                onChange={(e) => handleFileChange(e as any, FileType.SUB)}
              />
            </Button>
          </Grid>
          <Grid item>
            <Button variant="text" onClick={() => setHideFileInputs(true)}>
              Hide
            </Button>
          </Grid>
        </Grid>
      )}
      <Grid item container justifyContent="space-between">
        <Grid item>
          <IconButton size="large" onClick={rewind}>
            <FastRewindIcon fontSize="inherit" />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton size="large" onClick={pause}>
            <PauseIcon fontSize="inherit" />
          </IconButton>
        </Grid>
        <Grid item>
          <IconButton size="large" onClick={fastForward}>
            <FastForwardIcon fontSize="inherit" />
          </IconButton>
        </Grid>
      </Grid>
      <Grid item>
        <ReadingsList readings={subLines[1]} />
      </Grid>
    </Grid>
  );
}
