import re
import subprocess
import multiprocessing
import json
from dataclasses import dataclass

import pysrt

from ichiran_parser import handle_ichiran_parse


@dataclass
class Line:
    start: int
    end: int
    text: str


srt_file_path = "./videos/x/x.srt"
txt_file_path = "./videos/x/x.txt"

lines = [
    Line(start=r.start.ordinal, end=r.end.ordinal, text=r.text)
    for r in pysrt.open(srt_file_path).data
]


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
            mappings = handle_ichiran_parse(ichiran_json)
            results.extend(mappings)

    return results


def execute_function(func, args):
    return func(*args)


if __name__ == "__main__":
    with open(txt_file_path, "r") as f:
        split_text = re.split("[。、？]", f.read())
        text_data = [part.strip() for part in split_text if part.strip()]

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

    results = [x for xs in subprocess_results for x in xs]

    with open("./fake.json", "w") as fj:
        json.dump(results, fj, ensure_ascii=False)

    # out_file_name = f"{srt_file_path.split('.srt')[0]}.subtitles"

    # with open(out_file_name, "w") as f:
    #     for line in results:
    #         start, end, text, rankings = line
    #         f.writelines(
    #             (
    #                 str(start),
    #                 "\n",
    #                 str(end),
    #                 "\n",
    #                 text,
    #                 "\n",
    #                 json.dumps(rankings, ensure_ascii=False),
    #                 "\n",
    #             )
    #         )
