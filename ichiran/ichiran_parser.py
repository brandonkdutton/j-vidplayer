import json
from dataclasses import dataclass


@dataclass
class Ranking:
    count: int
    reading: str
    gloss: list[str] | None = None

    @property
    def __dict__(self):
        return {"reading": self.reading, "glossary": json.dumps(self.gloss)}


def extract_conj(alts: list):
    keys = []

    for a in alts:
        if not ("conj" in a and len(a["conj"]) > 0):
            keys.append(a["reading"])
            continue

        x = a["conj"]

        for y in x:
            if "reading" in y:
                keys.append(y["reading"])
            elif "via" in y:
                keys.extend([x["reading"] for x in y["via"]])
            else:
                raise ValueError("ooops")
    return keys


def handle_ichiran_parse(ichiran_json: list) -> list[Ranking]:
    totals = {}

    for p in ichiran_json:
        if not isinstance(p, str):
            for x in p[0][0]:
                data = x[1]

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
                    keys = extract_conj([data])
                elif "alternative" in data and "conj" in data["alternative"][0]:
                    keys = extract_conj(data["alternative"])
                else:
                    try:
                        keys = [data["reading"]]
                    except KeyError:
                        keys = [x["reading"] for x in data["alternative"]]
                    except Exception:
                        print("ooops")

                for key in keys:
                    if key in totals:
                        totals[key].count += 1
                    else:
                        item = Ranking(count=1, reading=key)

                        if "gloss" in data:
                            item.gloss = [x["gloss"] for x in data["gloss"]]

                        totals[key] = item

    rankings = sorted(totals.values(), key=lambda x: x.count, reverse=True)
    return rankings


if __name__ == "__main__":
    with open("./out.json", "r") as f:
        ichiran_parsed = json.load(f)

    rankings = handle_ichiran_parse(ichiran_parsed)

    with open("./parsedOutput.json", "w") as file:
        json.dump([r.__dict__ for r in rankings], file, indent=2, ensure_ascii=False)

    print(f"words: {len(rankings)}")
