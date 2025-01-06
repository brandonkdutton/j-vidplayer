import re
import subprocess
import multiprocessing
import json
from dataclasses import dataclass, field

import pysrt

from ichiran_parser import handle_ichiran_parse, ParsedIchiranOutput


@dataclass
class Reading:
    indices: list[tuple[int, int]]
    reading: str
    kanji: str
    has_carryover: bool

    @property
    def __dict__(self):
        return {"indices": self.indices, "reading": self.reading, "kanji": self.kanji}


@dataclass
class Line:
    start: int
    end: int
    text: str
    readings: list[Reading] | None = field(default_factory=list)

    def dedupe_readings(self):
        new_readings: list[Reading] = []

        def reading_index(reading: str):
            try:
                return next(
                    (i for i, r in enumerate(new_readings) if r.reading == reading)
                )
            except StopIteration:
                return None

        for reading_obj in self.readings:
            if (i := reading_index(reading_obj.reading)) is not None:
                new_readings[i].indices.extend(reading_obj.indices)

                new_readings[i].has_carryover = (
                    new_readings[i].has_carryover or reading_obj.has_carryover
                )

                print(f"deduped: {reading_obj.reading} from {line.text}")
            else:
                new_readings.append(reading_obj)

        self.readings = new_readings


def ichiran_parse(textLines: list[str]) -> list[dict]:
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


def map_text_to_readings(text_data: list[str], use_fake=False):
    if use_fake:
        with open("./fake.json", "r") as f:
            return [ParsedIchiranOutput.from_json(j) for j in json.load(f)]

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

    return [ParsedIchiranOutput.from_json(j) for j in result]


def write_subtitles_file(results: list[Line]):
    out_file_name = f"{srt_file_path.split('.srt')[0]}.subtitles"

    with open(out_file_name, "w") as f:
        for line in results:
            f.writelines(
                (
                    str(line.start),
                    "\n",
                    str(line.end),
                    "\n",
                    line.text,
                    "\n",
                    json.dumps([r.__dict__ for r in line.readings], ensure_ascii=False),
                    "\n",
                )
            )


def read_readings(readings: list[ParsedIchiranOutput]):
    reading_index = 0

    def at(k: int):
        nonlocal reading_index

        if reading_index >= len(readings):
            return 0, None, None, None

        if k >= len(readings[reading_index].text):
            reading_index += 1
            k = 0
            if reading_index >= len(readings):
                return 0, None

        return k, readings[reading_index]

    return at


def merge_lines_and_text(
    lines: list[Line],
    text_data: list[str],
    use_fake=False,
):
    """Add readings mappings to their corresponding lines"""

    carried_over_length = 0
    carry_over_line = None
    k = 0

    get_reading_with_index = read_readings(map_text_to_readings(text_data, use_fake))

    for line_num, line in enumerate(lines):
        i, j = 0, 0

        line_offset = 0
        current_line = line.text

        while i < len(current_line):
            k, obj = get_reading_with_index(k)

            if obj is None:
                break

            if obj.text[k] == current_line[i]:
                if (i - j) + 1 == len(obj.text) - carried_over_length:
                    if carry_over_line is not None:

                        original_carried_over_text = carry_over_line.text
                        carry_over_line.text = (
                            original_carried_over_text + current_line[j : i + 1]
                        )

                        end_offset = carried_over_length + ((i - j) + 1)

                        carry_over_line.readings.extend(
                            (
                                Reading(
                                    [
                                        (
                                            len(carry_over_line.text) - end_offset,
                                            len(carry_over_line.text) - 1,
                                        )
                                    ],
                                    reading.reading,
                                    reading.kanji,
                                    has_carryover=True,
                                )
                                for reading in obj.readings
                            )
                        )

                        line.text = (
                            original_carried_over_text[-carried_over_length:] + line.text
                        )
                        line_offset = carried_over_length

                    line.readings.extend(
                        (
                            Reading(
                                [
                                    (
                                        0 if j == 0 else line_offset + j,
                                        line_offset + i,
                                    )
                                ],
                                reading.reading,
                                reading.kanji,
                                has_carryover=carried_over_length > 0,
                            )
                            for reading in obj.readings
                        )
                    )

                    carry_over_line = None
                    carried_over_length = 0
                    j = i + 1

                k += 1
            else:
                j = i + 1
                carry_over_line = None
                carried_over_length = 0

            i += 1

        if j < len(current_line):
            carried_over_length = len(current_line) - j
            carry_over_line = line

    return lines


def apply_text_punctuation_to_lines(lines: list[Line], raw_text: str):
    punctuation = set("[。、？? ]")

    def new_line_has_carryover(line_index: int, char_i: int):
        if line_index == 0:
            return False

        current_start: Reading = lines[line_index].readings[0]
        pervious_end: Reading = lines[line_index - 1].readings[-1]

        # find first reading from smallest index
        for r in lines[line_index].readings:
            for idx in r.indices:
                if idx < min(current_start.indices):
                    current_start = r

        # find last reading from largest index
        for r in lines[line_index - 1].readings:
            for idx in r.indices:
                if idx > max(pervious_end.indices):
                    pervious_end = r

        lower, upper = min(current_start.indices)

        if char_i >= ((upper - lower) + 1):
            return False

        if (
            current_start.has_carryover
            and pervious_end.has_carryover
            and current_start.kanji == pervious_end.kanji
        ):
            return True

        return False

    line_i = 0
    char_i = 0

    def step_line_index():
        nonlocal line_i
        nonlocal char_i

        char_i += 1

        if char_i >= len(lines[line_i].text):
            char_i = 0
            line_i += 1

        # if line_i >= len(lines):
        #     raise StopIteration

    raw_text_i = 0

    while raw_text_i < len(raw_text):
        if lines[line_i].text[char_i] == raw_text[raw_text_i]:
            raw_text_i += 1
            step_line_index()
        elif lines[line_i].text[char_i] in punctuation:
            # punctuation already exists in the line but not in the raw text
            raise ValueError("this should never happen")
        elif new_line_has_carryover(line_i, char_i):
            # current line has carryover from previous line so the raw text index
            # is the carryover's length too far ahead now. Move it back
            lower, upper = min(lines[line_i].readings[0].indices)
            carry_over_length = (upper - lower) + 1
            raw_text_i -= carry_over_length
        elif raw_text[raw_text_i] in punctuation:
            # add punctuation to line
            old_line_text = lines[line_i].text
            new_text_with_punctuation = (
                old_line_text[:char_i] + raw_text[raw_text_i] + old_line_text[char_i:]
            )
            lines[line_i].text = new_text_with_punctuation

            # update indices
            for reading in lines[line_i].readings:
                for i, (lower, upper) in enumerate(reading.indices):
                    if lower >= char_i:
                        reading.indices[i] = (lower + 1, upper + 1)

            raw_text_i += 1
            step_line_index()
        else:
            raise ValueError("lol what?")


if __name__ == "__main__":
    srt_file_path = "./videos/ADHDすぎてパスポート取ろうとしたら絶望【スーパートラブルVlog】/ADHDすぎてパスポート取ろうとしたら絶望【スーパートラブルVlog】.srt"
    txt_file_path = "./videos/ADHDすぎてパスポート取ろうとしたら絶望【スーパートラブルVlog】/ADHDすぎてパスポート取ろうとしたら絶望【スーパートラブルVlog】.txt"

    lines = [
        Line(start=r.start.ordinal, end=r.end.ordinal, text=r.text)
        for r in pysrt.open(srt_file_path).data
    ]

    with open(txt_file_path, "r") as f:
        raw_text = f.read()
        text_data = [
            part.strip() for part in re.split("[。、？? ]", raw_text) if part.strip()
        ]

    merge_lines_and_text(lines, text_data, use_fake=True)

    for line in lines:
        line.dedupe_readings()

    apply_text_punctuation_to_lines(lines, raw_text)

    write_subtitles_file(lines)

    print("done")
