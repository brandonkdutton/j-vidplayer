"use client";

import { Grid, Button, styled } from "@mui/material";
import { ChangeEvent, FC, Dispatch, SetStateAction } from "react";
import { Reading } from "./ReadingsList";

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

type Props = {
  setSubtitleTextGroups: (groups: SubTextGroup[]) => void;
  setVideoSrc: (src: string) => void;
  hidden: boolean;
  setHidden: Dispatch<SetStateAction<boolean>>;
};

const Files: FC<Props> = ({
  setSubtitleTextGroups,
  setVideoSrc,
  hidden,
  setHidden,
}) => {
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
          setSubtitleTextGroups(subTextGroups);
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
      setVideoSrc(src);
    }
  };

  if (hidden) return null;

  return (
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
        <Button variant="text" onClick={() => setHidden(true)}>
          Hide
        </Button>
      </Grid>
    </Grid>
  );
};

export default Files;
