"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ width: "100%", display: "inline-block" }}>
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <main style={{ width: "100%", display: "inline-block" }}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
