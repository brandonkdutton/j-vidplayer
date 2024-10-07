import { FC, JSX } from "react";
import { Grid, Typography } from "@mui/material";
import { styled } from "@mui/system";

const Span = styled("span")({
  margin: 0,
  padding: 0,
});

type Props = {
  line: string;
  highlightedIndices: [number, number][];
};

const Subtitles: FC<Props> = ({ line, highlightedIndices }) => {
  const toRender: JSX.Element[] = [];

  if (highlightedIndices.length > 0) {
    let i = 0;
    for (const indices of highlightedIndices) {
      const [lower, upper] = indices;

      toRender.push(<Span>{line.slice(i, lower)}</Span>);
      toRender.push(
        <Span sx={{ color: "#90caf9" }}>{line.slice(lower, upper + 1)}</Span>
      );

      i = upper + 1;
    }
    toRender.push(<Span>{line.slice(i, line.length)}</Span>);
  } else {
    toRender.push(<Span>{line}</Span>);
  }

  return (
    <Grid
      item
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      spacing={1}
    >
      <Grid item sx={{ height: 60, textAlign: "center" }}>
        <Typography>{toRender}</Typography>
      </Grid>
    </Grid>
  );
};

export default Subtitles;
