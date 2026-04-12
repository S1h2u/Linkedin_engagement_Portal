from __future__ import annotations

import json
from pathlib import Path

from ..models.post_model import ExtractedPost

REVIEW_STATE_FILENAME = "latest_review_state.json"


def get_review_state_path(data_dir: Path) -> Path:
    return data_dir / REVIEW_STATE_FILENAME


def save_review_state(posts: list[ExtractedPost], data_dir: Path) -> Path:
    data_dir.mkdir(parents=True, exist_ok=True)
    state_path = get_review_state_path(data_dir)
    payload = {"posts": [post.to_dict() for post in posts]}
    state_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return state_path


def load_review_state(data_dir: Path) -> list[ExtractedPost]:
    state_path = get_review_state_path(data_dir)
    if not state_path.exists():
        raise FileNotFoundError(f"No review state found at {state_path}.")

    payload = json.loads(state_path.read_text(encoding="utf-8"))
    return [ExtractedPost.from_dict(item) for item in payload.get("posts", [])]
