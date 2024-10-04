import { FC, useState } from "react";
import Chip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

type Props = {
  glossary: { reading: string; glossary: string }[];
};

const Demo = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
}));

const Glossary: FC<Props> = ({ glossary }) => {
  const [def, setDef] = useState<string[]>([]);

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
        {glossary.map(({ reading, glossary }) => {
          const regex = /"([^"]*)"/g;
          const matches = glossary.match(regex);
          const cleanedMatches =
            matches?.map((match) => match.replace(/"/g, "")) ?? [];

          return (
            <Grid item key={reading}>
              <Chip
                label={reading}
                variant="outlined"
                onClick={() => {
                  setDef(cleanedMatches);
                }}
              />
            </Grid>
          );
        })}
      </Grid>
      <Grid item container spacing={2}>
        <Grid item xs={12} md={6}>
          <Demo>
            <List dense>
              {def.map((d) => (
                <ListItem key={d}>
                  <ListItemText
                    //primary="Single-line item"
                    secondary={d}
                  />
                </ListItem>
              ))}
            </List>
          </Demo>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Glossary;
