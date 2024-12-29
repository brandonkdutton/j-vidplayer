"use client";

import { FC, useEffect, useState } from "react";
import { SwipeableDrawer, Button, Box, Paper } from "@mui/material";
import { DateTime } from "luxon";

type Anchor = "top" | "left" | "bottom" | "right";

type Props = {
  kanji: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Jisho: FC<Props> = ({ kanji, open, setOpen }) => {
  const [openTime, setOpenTime] = useState<number>(Infinity);

  useEffect(() => {
    if (open) {
      setOpenTime(DateTime.now().toMillis());
    }
  }, [open]);

  return (
    <div>
      <SwipeableDrawer
        anchor="bottom"
        open={open && Boolean(kanji)}
        onClose={() => {
          const now = DateTime.now().toMillis();
          if (now - 250 > openTime) {
            setOpen(false);
          }
        }}
        onOpen={() => undefined}
      >
        <Box
          sx={{
            width: "auto",
            minHeight: "70vh",
            overflowY: "scroll",
          }}
          component={Paper}
          role="presentation"
        >
          <iframe
            src={`https://jisho.org/search/${kanji}`}
            loading="eager"
            frameBorder="0"
            style={{
              overflow: "hidden",
              overflowX: "hidden",
              overflowY: "hidden",
              height: "100%",
              width: "100%",
              position: "absolute",
              top: "0px",
              left: "0px",
              right: "0px",
              bottom: "0px",
              borderRadius: 16,
            }}
            height="100%"
            width="100%"
          />
        </Box>
      </SwipeableDrawer>
    </div>
  );
};

export default Jisho;
