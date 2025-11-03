#!/usr/bin/env python3
"""Utility to mark an Obsidian backlog note as started.

Usage:
    ./frontend/scripts/start_activity.py E1-A1-1

The script updates the frontmatter status to ``in-progress`` and adds a ``started-at``
ISO timestamp when missing. This allows product managers to "press a button" and
kick off the activity workflow without manually editing the note.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
OBSIDIAN_ROOT = REPO_ROOT / "obsidian"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Mark an Obsidian activity note as in-progress and timestamp the start.",
    )
    parser.add_argument(
        "activity_id",
        help="Identifier of the activity (e.g., E1-A1-1). The script looks for obsidian/<ID>.md.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show the resulting status change without writing to disk.",
    )
    return parser.parse_args()


def load_note(activity_id: str) -> tuple[Path, list[str]]:
    note_path = OBSIDIAN_ROOT / f"{activity_id}.md"
    if not note_path.exists():
        raise FileNotFoundError(
            f"Could not find obsidian note for activity '{activity_id}'. Expected file: {note_path}"
        )
    return note_path, note_path.read_text(encoding="utf-8").splitlines()


def update_frontmatter(lines: list[str]) -> list[str]:
    if not lines or lines[0].strip() != "---":
        raise ValueError("Note is missing YAML frontmatter header.")

    try:
        closing_idx = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("Note frontmatter is not closed with '---'.") from exc

    frontmatter = lines[1:closing_idx]
    status_idx = None
    started_idx = None

    for idx, line in enumerate(frontmatter):
        stripped = line.strip()
        if stripped.startswith("status:"):
            status_idx = idx
        if stripped.startswith("started-at:"):
            started_idx = idx

    if status_idx is None:
        # Insert status near the top to preserve readability.
        frontmatter.insert(0, "status: in-progress")
        status_idx = 0
    else:
        frontmatter[status_idx] = "status: in-progress"

    if started_idx is None:
        timestamp = _dt.datetime.now(tz=_dt.timezone.utc).isoformat(timespec="seconds")
        insertion_idx = status_idx + 1
        frontmatter.insert(insertion_idx, f"started-at: {timestamp}")
    else:
        # Preserve existing timestamp.
        pass

    # Reassemble lines
    updated_lines = ["---", *frontmatter, "---", *lines[closing_idx + 1 :]]
    return updated_lines


def main() -> int:
    args = parse_args()
    try:
        note_path, lines = load_note(args.activity_id)
        updated_lines = update_frontmatter(lines)
    except (FileNotFoundError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    if args.dry_run:
        print("\n".join(updated_lines))
    else:
        note_path.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")
        print(f"Activity '{args.activity_id}' marked as in-progress at {note_path}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
