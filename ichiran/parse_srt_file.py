import subprocess
import json
import asyncio
from dataclasses import dataclass, field

import pysrt

from ichiran_parser import handle_ichiran_parse, Ranking


@dataclass
class Line:
    start: int
    end: int
    text: str
    rankings: list[Ranking] | None = field(default_factory=list)


file_path = "./くら寿司.srt"

lines = [
    Line(start=r.start.ordinal, end=r.end.ordinal, text=r.text)
    for r in pysrt.open(file_path).data
]


def ichiran_parse(line: Line):
    ichiran_json = json.loads(
        subprocess.run(
            f'./ichiran-cli -f "{line.text}" | jq .',
            shell=True,
            capture_output=True,
            text=True,
        ).stdout
    )

    line.rankings = handle_ichiran_parse(ichiran_json)

    return line


async def do_async_calls():
    return await asyncio.gather(
        *[asyncio.to_thread(lambda: ichiran_parse(line)) for line in lines],
    )


subtitle_lines = asyncio.run(do_async_calls())

out_file_name = f"{file_path.split('.srt')[0]}.subtitles"

with open(out_file_name, "w") as f:
    for line in subtitle_lines:
        f.writelines(
            (
                str(line.start),
                "\n",
                str(line.end),
                "\n",
                line.text,
                "\n",
                json.dumps([x.__dict__ for x in line.rankings], ensure_ascii=False),
                "\n",
            )
        )
