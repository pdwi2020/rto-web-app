#!/usr/bin/env python3
"""
Utility to convert the Ranjith Tamil Nadu dataset (CSV) into the JSONL format
consumed by the RAG knowledge base.

Example:
    python3 scripts/convert_dataset.py \
        final-plan/rto_dataset_concise_ranjith.csv \
        rto-platform/data/knowledge_base.jsonl
"""

from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


# Replacements to keep the output ASCII while preserving meaning.
ASCII_REPLACEMENTS: Dict[str, str] = {
    "₹": "Rs.",
    "–": "-",
    "—": "-",
    "’": "'",
    "“": '"',
    "”": '"',
    "…": "...",
}


@dataclass
class DatasetMetadata:
    project: str = "Tamil Nadu RTO Knowledge Base"
    author: str = "Transport Department"
    date: str = ""

    @property
    def source_label(self) -> str:
        suffix = f"{self.date}" if self.date else "2025 Edition"
        return f"{self.project} ({suffix})"


def sanitize_text(value: str) -> str:
    """Replace known unicode characters and collapse whitespace."""
    if value is None:
        return ""
    text = value.strip()
    for src, dst in ASCII_REPLACEMENTS.items():
        text = text.replace(src, dst)
    # Collapse consecutive whitespace
    return " ".join(text.split())


def parse_float(value: str) -> Optional[float]:
    """Parse float values where possible, otherwise return None."""
    text = sanitize_text(value)
    if not text or text in {"-", "NA", "N/A"}:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def read_dataset(csv_path: Path) -> (DatasetMetadata, List[Dict[str, str]]):
    metadata = DatasetMetadata()
    entries: List[Dict[str, str]] = []

    with csv_path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            question = sanitize_text(row.get("Question", ""))
            if not question:
                # Capture metadata if present on the first non-entry row
                if not entries:
                    metadata.project = sanitize_text(row.get("Project", metadata.project)) or metadata.project
                    metadata.author = sanitize_text(row.get("Author", metadata.author)) or metadata.author
                    metadata.date = sanitize_text(row.get("Date", metadata.date)) or metadata.date
                continue
            row["Question"] = question
            row["Answer"] = sanitize_text(row.get("Answer", ""))
            row["Category"] = sanitize_text(row.get("Category", ""))
            row["Intent"] = sanitize_text(row.get("Intent", ""))
            row["Broker Time (days)"] = sanitize_text(row.get("Broker Time (days)", ""))
            row["RTO Time (days)"] = sanitize_text(row.get("RTO Time (days)", ""))
            row["Official Fee (₹)"] = sanitize_text(row.get("Official Fee (₹)", ""))
            entries.append(row)

    if not entries:
        raise ValueError(f"No records with questions found in {csv_path}")
    return metadata, entries


def build_content(row: Dict[str, str], state: str) -> str:
    question = row["Question"]
    answer = row["Answer"]
    intent = row.get("Intent") or "General"
    category = row.get("Category") or "General"

    parts = [
        f"Question: {question}",
        f"Answer: {answer}",
        (
            "Applicable Region: Regional Transport Offices across "
            f"{state}, India (Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem)."
        ),
        f"Service Category: {category}. Intent: {intent}.",
    ]

    broker_time = parse_float(row.get("Broker Time (days)", ""))
    if broker_time is not None:
        parts.append(f"Typical broker assistance time: {broker_time:.0f} day(s).")

    rto_time = parse_float(row.get("RTO Time (days)", ""))
    if rto_time is not None:
        parts.append(f"Expected Tamil Nadu transport department processing: {rto_time:.0f} day(s).")

    fee_text = row.get("Official Fee (₹)", "")
    if fee_text and fee_text not in {"-", "_"}:
        parts.append(f"Indicative official fee range: {fee_text} (Tamil Nadu rates).")

    return " ".join(parts)


def build_document(
    idx: int,
    row: Dict[str, str],
    state: str,
    metadata: DatasetMetadata,
) -> Dict[str, object]:
    doc_id = f"tnkb-{idx:04d}"
    content = build_content(row, state)

    tags = sorted(
        {
            row.get("Category", "").lower() or "general",
            row.get("Intent", "").lower() or "general",
            state.lower().replace(" ", "-"),
        }
    )

    return {
        "id": doc_id,
        "title": row["Question"],
        "content": content,
        "source": metadata.source_label,
        "category": row.get("Category", "General"),
        "intent": row.get("Intent", "General"),
        "tags": tags,
        "metadata": {
            "state": state,
            "category": row.get("Category", "General"),
            "intent": row.get("Intent", "General"),
            "broker_time_days": parse_float(row.get("Broker Time (days)", "")),
            "rto_time_days": parse_float(row.get("RTO Time (days)", "")),
            "official_fee_text": row.get("Official Fee (₹)", ""),
            "author": metadata.author,
        },
    }


def convert_dataset(input_path: Path, output_path: Path, state: str) -> None:
    metadata, entries = read_dataset(input_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", encoding="utf-8", newline="\n") as fh:
        for idx, row in enumerate(entries, start=1):
            document = build_document(idx, row, state, metadata)
            fh.write(json.dumps(document, ensure_ascii=True))
            fh.write("\n")

    print(f"Converted {len(entries)} records from {input_path} to {output_path}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Convert Tamil Nadu RTO dataset to JSONL knowledge base.")
    parser.add_argument("input_csv", type=Path, help="Path to the CSV dataset (e.g., rto_dataset_concise_ranjith.csv)")
    parser.add_argument("output_jsonl", type=Path, help="Destination JSONL file for the knowledge base")
    parser.add_argument(
        "--state",
        default="Tamil Nadu",
        help="State/region label to embed in the knowledge base content (default: Tamil Nadu)",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    convert_dataset(args.input_csv, args.output_jsonl, args.state)


if __name__ == "__main__":
    main()
