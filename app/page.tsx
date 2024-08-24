"use client";

import { Grid, Typography, Input, InputLabel, Button } from "@mui/material";
import { parse } from "@plussub/srt-vtt-parser";
import { useState, ReactEventHandler, useRef, ChangeEvent } from "react";

enum FileType {
  SUB = "SUB",
  VID = "VID",
}

export default function Home() {
  const [subText, setSubText] = useState<ReturnType<typeof parse>["entries"]>(
    []
  );
  const [subLines, setSubLines] = useState<[string, string]>(["", ""]);

  const videoRef = useRef<HTMLVideoElement>(null);

  const onTimeUpdate: ReactEventHandler<HTMLVideoElement> = (e) => {
    const time = (videoRef.current?.currentTime ?? 0) * 1000;

    let l = 0;
    let r = subText.length - 1;

    while (l <= r) {
      const m = Math.floor((l + r) / 2);

      if (time >= subText[m].from && time < subText[m].to) {
        const newText = subText[m].text;
        setSubLines((old) => {
          if (newText === old.at(-1)) {
            return old;
          }
          return [old.at(-1)!, newText];
        });
        break;
      } else if (time > subText[m].to) {
        l = m + 1;
      } else {
        r = m - 1;
      }
    }
  };

  const [videoFile, setVideoFile] = useState<string>();

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
      fetch(src).then((value) => {
        value
          .text()
          .then((text) => {
            const parsed = parse(text).entries;
            setSubText(parsed);
            console.log(parsed);
          })
          .catch((e) => alert("error"));
      });
    } else {
      setVideoFile(src);
    }
  };

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      sx={{ width: "100%", height: "100%" }}
    >
      <Grid
        item
        container
        direction="column"
        alignItems="center"
        spacing={2}
        sx={{ width: "100%", height: "100vh" }}
      >
        <Grid item>
          <video
            id="video"
            style={{ width: "100%" }}
            ref={videoRef}
            controls
            onTimeUpdate={onTimeUpdate}
            webkit-playsinline
            playsInline
            autoPlay
            src={videoFile}
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
          {/* <Grid item sx={{ textAlign: "center" }}>
            <Typography>{subLines[1]}</Typography>
          </Grid> */}
        </Grid>
      </Grid>
      <Grid item>
        <InputLabel htmlFor="video-input-file">Video file</InputLabel>
        <Input
          id="video-file-input"
          type="file"
          inputProps={{
            accept: "video/*",
            onChange: (e) => handleFileChange(e as any, FileType.VID),
          }}
        />
        <InputLabel htmlFor="video-input-file">Subtitles file</InputLabel>
        <Input
          id="video-file-input"
          type="file"
          inputProps={{
            onChange: (e) => handleFileChange(e as any, FileType.SUB),
          }}
        />
      </Grid>
    </Grid>
  );
}
