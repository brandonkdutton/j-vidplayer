"use client";

import { Grid } from "@mui/material";
import { useState, useRef, useEffect, useCallback } from "react";
import ReadingsList, { Reading } from "./ReadingsList";
import Controls from "./Controls";
import Subtitles from "./Subtitles";
import Files from "./Files";
import Jisho from "./Jisho";

type SubTextGroup = {
  from: number;
  to: number;
  text: string;
  readings: Reading[];
};

export default function Home() {
  const [videoControlsVisible, setVideoControlsVisible] =
    useState<boolean>(false);
  const [subText, setSubText] = useState<SubTextGroup[]>([]);
  const [subLines, setSubLines] = useState<[string, Reading[]]>(["", []]);
  const [videoFile, setVideoFile] = useState<string>();
  const [jishoKanji, setJishoKanji] = useState<string>();
  const [jishoOpen, setJishoOpen] = useState<boolean>(false);
  const [selectedIndices, setSelectedIndices] = useState<[number, number][]>(
    []
  );

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

  const onSkip = useCallback(() => {
    setSelectedIndices([]);
  }, []);

  useEffect(() => {
    onSkip();
  }, [subLines, onSkip]);

  return (
    <>
      <Grid container direction="column" alignItems="center" spacing={3}>
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
              controls={videoControlsVisible}
              muted={true}
            />
          </Grid>
          <Subtitles line={subLines[0]} highlightedIndices={selectedIndices} />
        </Grid>
        <Files setSubtitleTextGroups={setSubText} setVideoSrc={setVideoFile} />
        <Controls
          videoRef={videoRef}
          onTimeUpdate={onTimeUpdate}
          onSkip={onSkip}
          setVideoControlsVisible={setVideoControlsVisible}
        />
        <Grid item>
          <ReadingsList
            readings={subLines[1]}
            setSelectedIndices={setSelectedIndices}
            setSelectedKanji={setJishoKanji}
            setJishoOpen={setJishoOpen}
          />
        </Grid>
      </Grid>
      <Jisho kanji={jishoKanji} open={jishoOpen} setOpen={setJishoOpen} />
    </>
  );
}
