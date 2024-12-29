"use client";

import { FC, useState, useEffect } from "react";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import { DateTime } from "luxon";

const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
        setIsTouchDevice(true);
      } else {
        setIsTouchDevice(false);
      }
    };

    checkTouchDevice();
    window.addEventListener("resize", checkTouchDevice);

    return () => {
      window.removeEventListener("resize", checkTouchDevice);
    };
  }, []);

  return isTouchDevice;
};

export type Reading = {
  indices: [number, number][];
  reading: string;
  kanji: string;
};

type Props = {
  readings: Reading[];
  setSelectedIndices: (indices: [number, number][]) => void;
  setSelectedKanji: (kanji: string) => void;
  setJishoOpen: (open: boolean) => void;
};

const holdThresholdMilliseconds = 250;

const ReadingsList: FC<Props> = ({
  readings,
  setSelectedIndices,
  setSelectedKanji,
  setJishoOpen,
}) => {
  const [touchStartTime, setTouchStartTime] = useState<DateTime>();

  const handleTouchStart = (reading: Reading) => {
    setTouchStartTime(DateTime.utc());
    setSelectedIndices(reading.indices);
  };

  const handleTouchEnd = (reading: Reading) => {
    if (!touchStartTime) return;

    const diff = touchStartTime.diffNow().toMillis();

    if (-diff >= holdThresholdMilliseconds) {
      setSelectedIndices([]);
    } else {
      setJishoOpen(true);
      setSelectedKanji(reading.kanji);
    }

    setTouchStartTime(undefined);
  };

  const isTouchScreen = useIsTouchDevice();

  const handleClick = (reading: Reading) => {
    if (isTouchScreen) return;
    setJishoOpen(true);
    setSelectedKanji(reading.kanji);
  };

  return (
    <Grid
      item
      container
      direction="column"
      justifyContent="space-between"
      alignItems="flex-end"
    >
      <Grid
        item
        container
        spacing={1}
        justifyContent="center"
        sx={{
          width: "100%",
          maxWidth: 360,
          bgcolor: "background.paper",
          position: "relative",
          overflow: "auto",
          maxHeight: 300,
          "& ul": { padding: 0 },
        }}
      >
        {readings.map((r) => {
          return (
            <Grid item key={`${r.reading}:${JSON.stringify(r.indices)}`}>
              <Chip
                label={r.kanji}
                onTouchStart={() => handleTouchStart(r)}
                onMouseEnter={() => setSelectedIndices(r.indices)}
                onTouchEnd={() => handleTouchEnd(r)}
                onMouseLeave={() => setSelectedIndices([])}
                onContextMenu={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(r.kanji);
                }}
                variant="outlined"
                onClick={() => handleClick(r)}
              />
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
};

export default ReadingsList;
