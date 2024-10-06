import re
import subprocess
import multiprocessing
import json
from dataclasses import dataclass, field

import pysrt

from ichiran_parser import handle_ichiran_parse


@dataclass
class Line:
    start: int
    end: int
    text: str
    readings: list[str] | None = field(default_factory=list)


def ichiran_parse(textLines: list[str]) -> list[tuple[str, str, str]]:
    results = []

    for text in textLines:
        process_result = subprocess.run(
            f'./ichiran-cli -f "{text}" | jq .',
            shell=True,
            capture_output=True,
            text=True,
        ).stdout

        if bool(process_result):
            ichiran_json = json.loads(process_result)
            mappings = handle_ichiran_parse(
                ichiran_json, use_first_alt=True, exclude_particles_and_copulas=False
            )
            results.extend(mappings)

    return results


def execute_function(func, args):
    return func(*args)


def map_text_to_readings(text_data: list[str], use_fake=False):
    if use_fake:
        with open("./fake.json", "r") as f:
            j: list[tuple[str, str, str]] = json.load(f)
            return j

    max_subprocesses = min(64, len(text_data))
    items_per_process = len(text_data) // max_subprocesses

    subprocess_params = [
        [text_data[(i * items_per_process) : (i + 1) * items_per_process]]
        for i in range(max_subprocesses)
    ]
    subprocess_params.append([text_data[items_per_process * max_subprocesses :]])

    with multiprocessing.Pool(processes=max_subprocesses) as pool:
        subprocess_results = pool.starmap(ichiran_parse, subprocess_params)
        pool.close()

    result = [x for xs in subprocess_results for x in xs]

    if not use_fake:
        with open("./fake.json", "w") as f:
            json.dump(result, f, ensure_ascii=False)

    return result


def write_subtitles_file(results):
    out_file_name = f"{srt_file_path.split('.srt')[0]}.subtitles"

    with open(out_file_name, "w") as f:
        for line in results:
            start, end, text, rankings = line
            f.writelines(
                (
                    str(start),
                    "\n",
                    str(end),
                    "\n",
                    text,
                    "\n",
                    json.dumps(rankings, ensure_ascii=False),
                    "\n",
                )
            )


def read_readings(readings: list[tuple[str, str, str]]):
    reading_index = 0

    def at(k: int):
        nonlocal reading_index

        if reading_index >= len(readings):
            return 0, None, None

        if k >= len(readings[reading_index][0]):
            reading_index += 1
            k = 0
            if reading_index >= len(readings):
                return 0, None, None

        text, reading, kanji = readings[reading_index]

        return k, text, reading

    return at


def merge_lines_and_text(lines: list[Line], text_data: list[str]):
    """Add readings mappings to their corresponding lines"""

    carried_over_length = 0
    carry_over_line = None
    k = 0

    get_reading_with_index = read_readings(map_text_to_readings(text_data, use_fake=True))

    for line in lines:
        i, j = 0, 0
        while i < len(line.text):
            k, text, reading = get_reading_with_index(k)

            if reading is None:
                break

            if text[k] == line.text[i]:
                if (i - j) + 1 == len(text) - carried_over_length:
                    if carry_over_line is not None:
                        carry_over_line.readings.append(reading)

                    line.readings.append(reading)

                    carry_over_line = None
                    carried_over_length = 0
                    j = i + 1

                k += 1
            else:
                j = i + 1
                carry_over_line = None
                carried_over_length = 0

            i += 1

        if j < len(line.text):
            carried_over_length = len(line.text) - j
            carry_over_line = line

    return lines


if __name__ == "__main__":
    srt_file_path = "./videos/x/x.srt"
    txt_file_path = "./videos/x/x.txt"

    lines = [
        Line(start=r.start.ordinal, end=r.end.ordinal, text=r.text)
        for r in pysrt.open(srt_file_path).data
    ]

    with open(txt_file_path, "r") as f:
        split_text = re.split("[。、？?]", f.read())
        text_data = [part.strip() for part in split_text if part.strip()]

    merge_lines_and_text(lines, text_data)

    print("done")
