from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from ..models.post_model import ExtractedPost


def save_posts_to_file(posts: list[ExtractedPost], data_dir: Path) -> Path:
    data_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    output_path = data_dir / f"{timestamp}.json"

    payload = {
        f"post_{index}": post.to_dict()
        for index, post in enumerate(posts, start=1)
    }

    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return output_path
