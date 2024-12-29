import json
from dataclasses import dataclass


@dataclass
class IchiranReading:
    kanji: str
    reading: str


@dataclass
class ParsedIchiranOutput:
    text: str
    readings: list[IchiranReading]

    @property
    def __dict__(self):
        return {"text": self.text, "readings": [r.__dict__ for r in self.readings]}

    @staticmethod
    def from_json(json: dict):
        return ParsedIchiranOutput(
            text=json["text"], readings=[IchiranReading(**j) for j in json["readings"]]
        )


def extract_conj(alts: list, use_first_alt: bool) -> list[tuple[str, str]]:
    keys = []

    for a in alts:
        text = a["text"]
        if not ("conj" in a and len(a["conj"]) > 0):
            keys.append((a["reading"], text))

            if use_first_alt:
                return keys
            else:
                continue

        x = a["conj"]

        for y in x:
            if "reading" in y:
                keys.append((y["reading"], text))
            elif "via" in y:
                keys.extend([(x["reading"], text) for x in y["via"]])
            else:
                raise ValueError("ooops")

        if use_first_alt:
            return keys

    return keys


def handle_ichiran_parse(
    ichiran_json: list, use_first_alt=False, exclude_particles_and_copulas=False
) -> list[dict]:
    mappings = []

    for p in ichiran_json:
        if not isinstance(p, str):
            for x in p[0][0]:
                data = x[1]

                if exclude_particles_and_copulas:
                    try:
                        for gloss in data["gloss"]:
                            pos = gloss["pos"]
                            for s in ("prt", "suf", "cop", "cop-da"):
                                if s in pos:
                                    raise StopIteration()
                    except (KeyError, IndexError):
                        pass
                    except StopIteration:
                        continue

                    try:
                        for conj in data["conj"]:
                            for prop in conj["prop"]:
                                pos = prop["pos"]
                                for s in ["cop"]:
                                    if s in pos:
                                        raise StopIteration()
                    except (KeyError, IndexError):
                        pass
                    except StopIteration:
                        continue

                if "conj" in data and len(data["conj"]) > 0:
                    entries = extract_conj([data], use_first_alt)
                elif "alternative" in data and "conj" in data["alternative"][0]:
                    entries = extract_conj(data["alternative"], use_first_alt)
                else:
                    try:
                        entries = [(data["reading"], data["text"])]
                    except KeyError:
                        if use_first_alt:
                            x = data["alternative"][0]
                            entries = [(x["reading"], x["text"])]
                        else:
                            entries = [
                                (x["reading"], x["text"]) for x in data["alternative"]
                            ]
                    except Exception:
                        print("ooops")

                mappings.append(
                    ParsedIchiranOutput(
                        text=entries[0][1],
                        readings=[
                            IchiranReading(reading=reading, kanji=reading.split(" ")[0])
                            for reading, text in entries
                        ],
                    ).__dict__
                )

    return mappings


if __name__ == "__main__":
    with open("./何.json", "r") as f:
        data = json.load(f)
        result = handle_ichiran_parse(data, False, False)
        print("done")
