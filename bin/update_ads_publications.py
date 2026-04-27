#!/usr/bin/env python3
"""Update al-folio publications from a NASA ADS public library."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


DEFAULT_LIBRARY_ID = "VS5BWzVyQMOzCiWsCB0gAw"
DEFAULT_OUTPUT = Path("_bibliography/papers.bib")
FRONT_MATTER = "---\n---\n\n"


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


def preserve_selected_flags(new_bibtex: str, selected_keys: set[str]) -> str:
    parts: list[str] = []
    for chunk in iter_bibtex_entries(new_bibtex):
        key_match = re.match(r"@\w+\s*\{\s*([^,\s]+)\s*,", chunk)
        if key_match and key_match.group(1) in selected_keys:
            chunk = add_selected_field(chunk)
        parts.append(chunk)
    return "".join(parts)


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


def fetch_ads_bibtex(library_id: str) -> str:
    try:
        from ads import Library
        import ads.services.export as export
    except ImportError as exc:
        raise SystemExit(
            "Missing Python package 'ads'. Install it with: python -m pip install ads"
        ) from exc

    library = Library.get(id=library_id)
    return export.bibtex(library)


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
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected_keys = selected_keys_from_existing_bibtex(args.output)
    selected_keys.update(args.selected)

    bibtex = fetch_ads_bibtex(args.library_id)
    bibtex = normalize_ads_bibtex(bibtex)
    bibtex = preserve_selected_flags(bibtex, selected_keys)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(FRONT_MATTER + bibtex, encoding="utf-8")
    print(f"Updated {args.output} from ADS library {args.library_id}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
