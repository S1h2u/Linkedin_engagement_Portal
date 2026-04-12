from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass
class ExtractedPost:
    text: str
    author: str
    url: str
    post_url: str = ""  # 🔥 REAL post URL (/posts/ or /activity/)
    id: int = 0
    basic_score: int = 0
    passed_basic_filter: bool = False
    llm_category: str = ""
    passed_llm_filter: bool = False
    comment: str = ""
    status: str = "pending"
    tone: str = "balanced"

    def to_dict(self) -> dict[str, object]:
        return asdict(self)

    @classmethod
    def from_dict(cls, payload: dict[str, object]) -> "ExtractedPost":
        return cls(
            id=int(payload.get("id", 0) or 0),
            text=str(payload.get("text", "") or ""),
            author=str(payload.get("author", "") or ""),
            url=str(payload.get("url", "") or ""),
            post_url=str(payload.get("post_url", "") or ""),
            basic_score=int(payload.get("basic_score", 0) or 0),
            passed_basic_filter=bool(payload.get("passed_basic_filter", False)),
            llm_category=str(payload.get("llm_category", "") or ""),
            passed_llm_filter=bool(payload.get("passed_llm_filter", False)),
            comment=str(payload.get("comment", "") or ""),
            status=str(payload.get("status", "pending") or "pending"),
            tone=str(payload.get("tone", "balanced") or "balanced"),
        )
