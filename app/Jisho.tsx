"use client";

import { FC, useState } from "react";
import { SwipeableDrawer, Button, Box, Paper } from "@mui/material";

type Anchor = "top" | "left" | "bottom" | "right";

type Props = {
  kanji: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Jisho: FC<Props> = ({ kanji, open, setOpen }) => {
  const toggleDrawer =
    (anchor: Anchor, open: boolean) =>
    (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event &&
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }
      setOpen(open);
    };

  return (
    <div>
      <SwipeableDrawer
        anchor="bottom"
        open={open && Boolean(kanji)}
        onClose={toggleDrawer("bottom", false)}
        onOpen={toggleDrawer("bottom", true)}
      >
        <Box
          sx={{
            width: "auto",
            minHeight: "70vh",
            overflowY: "scroll",
          }}
          component={Paper}
          role="presentation"
          onClick={toggleDrawer("bottom", false)}
          onKeyDown={toggleDrawer("bottom", false)}
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
