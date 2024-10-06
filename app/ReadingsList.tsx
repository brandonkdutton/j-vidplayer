import { FC } from "react";
import Chip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

export type Reading = {
  indices: [number, number][];
  reading: string;
  kanji: string;
};

type Props = {
  readings: Reading[];
};

const ReadingsList: FC<Props> = ({ readings }) => {
  const handleReadingPressed = (reading: Reading): void => {};

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
                onMouseDown={() => 0}
                onMouseUp={() => 0}
                variant="outlined"
                onClick={() => handleReadingPressed(r)}
              />
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
};

export default ReadingsList;
