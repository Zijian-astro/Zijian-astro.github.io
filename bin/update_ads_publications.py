#!/usr/bin/env python3
"""Update al-folio publications from a NASA ADS public library."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


DEFAULT_LIBRARY_ID = "VS5BWzVyQMOzCiWsCB0gAw"
DEFAULT_OUTPUT = Path("_bibliography/papers.bib")
DEFAULT_NEWS_DIR = Path("_news")
FRONT_MATTER = "---\n---\n\n"
ADS_API_BASE_URL = "https://api.adsabs.harvard.edu/v1"
AUTHOR_PATTERNS = [
    re.compile(r"\{Zhang\},\s*Zijian", re.IGNORECASE),
    re.compile(r"\{Zhang\},\s*Zi-Jian", re.IGNORECASE),
    re.compile(r"\{Zhang\},\s*Z\.", re.IGNORECASE),
]
MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def strip_front_matter(text: str) -> str:
    if text.startswith(FRONT_MATTER):
        return text[len(FRONT_MATTER) :]
    return text


def selected_keys_from_existing_bibtex(path: Path) -> set[str]:
    if not path.exists():
        return set()

    text = strip_front_matter(path.read_text(encoding="utf-8"))
    selected: set[str] = set()
    for match in re.finditer(r"@\w+\s*\{\s*([^,\s]+)\s*,", text):
        key = match.group(1)
        entry_start = match.start()
        next_entry = text.find("\n@", match.end())
        entry_end = len(text) if next_entry == -1 else next_entry
        entry = text[entry_start:entry_end]
        if re.search(r"\bselected\s*=\s*\{true\}", entry, flags=re.IGNORECASE):
            selected.add(key)
    return selected


def iter_bibtex_entries(text: str):
    starts = [match.start() for match in re.finditer(r"(?m)^@\w+\s*\{", text)]
    if not starts:
        yield text
        return

    if starts[0] > 0:
        yield text[: starts[0]]

    for index, start in enumerate(starts):
        end = starts[index + 1] if index + 1 < len(starts) else len(text)
        yield text[start:end]


def add_selected_field(entry: str) -> str:
    if re.search(r"\bselected\s*=", entry, flags=re.IGNORECASE):
        return entry

    doi_match = re.search(r"(?m)^(\s*doi\s*=\s*\{[^\n]+\},?)\s*$", entry)
    if doi_match:
        insert_at = doi_match.end()
        return entry[:insert_at] + "\n     selected = {true}," + entry[insert_at:]

    closing = entry.rfind("\n}")
    if closing != -1:
        return entry[:closing] + "\n     selected = {true}," + entry[closing:]

    return entry


def bibtex_key(entry: str) -> str | None:
    match = re.match(r"@\w+\s*\{\s*([^,\s]+)\s*,", entry)
    if match:
        return match.group(1)
    return None


def bibtex_field(entry: str, field: str) -> str | None:
    match = re.search(rf"(?im)^\s*{re.escape(field)}\s*=\s*(.+?)\s*,?\s*$", entry)
    if not match:
        return None
    value = re.sub(r"\s+", " ", match.group(1)).strip()
    value = value.rstrip(",").strip()
    while len(value) >= 2 and (
        (value[0] == "{" and value[-1] == "}")
        or (value[0] == '"' and value[-1] == '"')
    ):
        value = value[1:-1].strip()
    return value


def bibtex_year(entry: str) -> int:
    value = bibtex_field(entry, "year")
    if value and value.isdigit():
        return int(value)
    return 0


def bibtex_month(entry: str) -> int:
    value = (bibtex_field(entry, "month") or "").lower()
    return MONTHS.get(value, 1)


def is_author_paper(entry: str) -> bool:
    authors = bibtex_field(entry, "author") or ""
    first_author = authors.split(" and ", 1)[0]
    return any(pattern.search(first_author) for pattern in AUTHOR_PATTERNS)


def auto_selected_keys(new_bibtex: str, limit: int) -> set[str]:
    if limit <= 0:
        return set()

    entries = []
    for chunk in iter_bibtex_entries(new_bibtex):
        key = bibtex_key(chunk)
        if key and is_author_paper(chunk):
            entries.append((bibtex_year(chunk), key))

    entries.sort(reverse=True)
    return {key for _, key in entries[:limit]}


def preserve_selected_flags(new_bibtex: str, selected_keys: set[str]) -> str:
    parts: list[str] = []
    for chunk in iter_bibtex_entries(new_bibtex):
        key = bibtex_key(chunk)
        if key and key in selected_keys:
            chunk = add_selected_field(chunk)
        parts.append(chunk)
    return "".join(parts)


def clean_title(title: str) -> str:
    title = title.strip("{}")
    replacements = {
        r"{\ensuremath{\sim}}": "~",
        r"\textasciitilde": "~",
        r"{\textendash}": "--",
        r"$zrsim10$": "z~10",
    }
    for old, new in replacements.items():
        title = title.replace(old, new)
    return re.sub(r"\s+", " ", title).strip()


def news_items_from_bibtex(bibtex: str, limit: int) -> list[tuple[str, str, str]]:
    if limit <= 0:
        return []

    items: list[tuple[int, int, str, str, str]] = []
    for chunk in iter_bibtex_entries(bibtex):
        key = bibtex_key(chunk)
        year = bibtex_year(chunk)
        month = bibtex_month(chunk)
        title = bibtex_field(chunk, "title")
        journal = bibtex_field(chunk, "journal") or "ADS"
        if key and year and title:
            items.append((year, month, key, clean_title(title), journal))

    items.sort(reverse=True)
    return [(f"{year}-{month:02d}-01", key, title, journal) for year, month, key, title, journal in items[:limit]]


def write_publication_news(news_dir: Path, bibtex: str, limit: int) -> None:
    news_dir.mkdir(parents=True, exist_ok=True)

    for path in news_dir.glob("ads-publication-*.md"):
        path.unlink()

    for date, key, title, journal in news_items_from_bibtex(bibtex, limit):
        safe_key = re.sub(r"[^A-Za-z0-9_.-]+", "-", key)
        path = news_dir / f"ads-publication-{safe_key}.md"
        path.write_text(
            "\n".join(
                [
                    "---",
                    "layout: post",
                    f"date: {date} 00:00:00-0000",
                    "inline: true",
                    "related_posts: false",
                    "---",
                    "",
                    f"New publication added: [{title}](/publications/) ({journal}).",
                    "",
                ]
            ),
            encoding="utf-8",
        )


def normalize_ads_bibtex(text: str) -> str:
    text = strip_front_matter(text).strip()
    replacements = {
        r"He I$λ$10830 absorption at z\raisebox{-0.5ex}\textasciitilde3": "He I lambda 10830 absorption at z~3",
        r"{\ensuremath{\sim}}": "~",
        r"\textasciitilde": "~",
        r"{\textendash}": "--",
        r"$zrsim10$": "z~10",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text + "\n"


def ads_request(url: str, token: str, payload: dict | None = None) -> dict:
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    request = Request(url, data=data, headers=headers, method="POST" if payload is not None else "GET")
    try:
        with urlopen(request, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"ADS API request failed with HTTP {exc.code}: {body}") from exc
    except URLError as exc:
        raise SystemExit(f"ADS API request failed: {exc.reason}") from exc


def fetch_library_bibcodes(library_id: str, token: str, rows: int = 2000) -> list[str]:
    query = urlencode({"raw": "true", "rows": rows})
    url = f"{ADS_API_BASE_URL}/biblib/libraries/{library_id}?{query}"
    data = ads_request(url, token)
    bibcodes = data.get("documents") or data.get("bibcode") or []
    if not bibcodes:
        raise SystemExit(f"No bibcodes found in ADS library {library_id}.")
    return list(bibcodes)


def fetch_ads_bibtex(library_id: str) -> str:
    token = os.environ.get("ADS_DEV_KEY") or os.environ.get("ADS_API_TOKEN")
    if not token:
        raise SystemExit("Missing ADS token. Set ADS_DEV_KEY or ADS_API_TOKEN.")

    bibcodes = fetch_library_bibcodes(library_id, token)
    payload = {
        "bibcode": bibcodes,
        "sort": "date desc, bibcode desc",
        "journalformat": 3,
    }
    data = ads_request(f"{ADS_API_BASE_URL}/export/bibtex", token, payload=payload)
    exported = data.get("export")
    if not exported:
        raise SystemExit(f"ADS BibTeX export returned no content: {data}")
    return exported


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export a NASA ADS library to al-folio's _bibliography/papers.bib."
    )
    parser.add_argument(
        "--library-id",
        default=DEFAULT_LIBRARY_ID,
        help=f"ADS library id to export. Default: {DEFAULT_LIBRARY_ID}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"BibTeX output path. Default: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--selected",
        nargs="*",
        default=[],
        help="Additional BibTeX keys/bibcodes to mark as selected.",
    )
    parser.add_argument(
        "--auto-selected",
        type=int,
        default=5,
        help="Automatically mark this many newest first-author papers as selected. Use 0 to disable.",
    )
    parser.add_argument(
        "--news-dir",
        type=Path,
        default=DEFAULT_NEWS_DIR,
        help=f"Directory for generated ADS news files. Default: {DEFAULT_NEWS_DIR}",
    )
    parser.add_argument(
        "--news-limit",
        type=int,
        default=3,
        help="Generate this many homepage news items from newest ADS publications. Use 0 to disable.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected_keys = selected_keys_from_existing_bibtex(args.output)
    selected_keys.update(args.selected)

    bibtex = fetch_ads_bibtex(args.library_id)
    bibtex = normalize_ads_bibtex(bibtex)
    selected_keys.update(auto_selected_keys(bibtex, args.auto_selected))
    bibtex = preserve_selected_flags(bibtex, selected_keys)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(FRONT_MATTER + bibtex, encoding="utf-8")
    write_publication_news(args.news_dir, bibtex, args.news_limit)
    print(f"Updated {args.output} from ADS library {args.library_id}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
