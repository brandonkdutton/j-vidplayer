"use client";

import { parse } from "@plussub/srt-vtt-parser";
import { useState, ReactEventHandler, useRef, useEffect } from "react";

export default function Home() {
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [subText, setSubText] = useState<ReturnType<typeof parse>["entries"]>(
    []
  );
  const [subTextCurrentLine, setSubTextCurrentLine] = useState<string>("subs");

  const videoRef = useRef<HTMLVideoElement>(null);

  const onTimeUpdate: ReactEventHandler<HTMLVideoElement> = (e) => {
    const time = (videoRef.current?.currentTime ?? 0) * 1000;
    setDisplayTime(Math.floor(time ?? 0));

    let l = 0;
    let r = subText.length - 1;

    while (l <= r) {
      const m = Math.floor((l + r) / 2);

      if (time >= subText[m].from && time < subText[m].to) {
        setSubTextCurrentLine(subText[m].text);
        break;
      } else if (time > subText[m].to) {
        l = m + 1;
      } else {
        r = m - 1;
      }
    }
  };

  useEffect(() => {
    fetch("/vidd.srt").then((value) => {
      value
        .text()
        .then((text) => {
          const parsed = parse(text).entries;
          setSubText(parsed);
        })
        .catch((e) => alert("error"));
    });
  }, []);

  return (
    <div>
      <video
        id="video"
        ref={videoRef}
        controls
        style={{ minHeight: 400, minWidth: 500 }}
        onTimeUpdate={onTimeUpdate}
      >
        <source src="/vid.mp4" type="video/mp4" />
      </video>
      <h3>{subTextCurrentLine}</h3>
      <h5>{displayTime}</h5>
    </div>
  );
}
