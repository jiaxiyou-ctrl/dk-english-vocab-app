#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
DATA = APP / "data"
IMAGES = APP / "assets" / "images"


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    index = load_json(DATA / "topics-index.json")
    all_topics = load_json(DATA / "all-topics.json")
    indexed = [topic for category in index["categories"] for topic in category["topics"]]
    by_id = {topic["id"]: topic for topic in all_topics}
    errors = []
    repeated_page_topics = 0

    if len(indexed) != 180:
      errors.append(f"topics-index.json should list 180 topics, found {len(indexed)}")
    if len(all_topics) != 180:
      errors.append(f"all-topics.json should contain 180 topics, found {len(all_topics)}")

    total_words = 0
    for topic_meta in indexed:
        topic_id = topic_meta["id"]
        topic_path = DATA / f"topic-{topic_id}.json"

        if not topic_path.exists():
            errors.append(f"missing data file: {topic_path.name}")
            continue

        topic = load_json(topic_path)
        if topic_id not in by_id:
            errors.append(f"topic-{topic_id} is missing from all-topics.json")

        words = sum(len(page.get("words", [])) for page in topic.get("pages", []))
        total_words += words
        if words != topic_meta.get("totalWords"):
            errors.append(
                f"topic-{topic_id} totalWords mismatch: index={topic_meta.get('totalWords')} file={words}"
            )

        images = []
        for page in topic.get("pages", []):
            image = page.get("image", "")
            image_name = image.replace("assets/images/", "")
            if not (IMAGES / image_name).exists():
                errors.append(f"topic-{topic_id} references missing image: {image}")
            if "pageNum" not in page:
                errors.append(f"topic-{topic_id} has a page entry without pageNum")
            images.append(image)

        unique_images = list(dict.fromkeys(images))
        if len(images) > len(unique_images):
            repeated_page_topics += 1

    print(f"Checked {len(indexed)} indexed topics")
    print(f"Checked {len(all_topics)} bundled topics")
    print(f"Indexed words: {total_words}")
    print(f"Topics with multi-section page reuse: {repeated_page_topics}")
    print(f"Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
