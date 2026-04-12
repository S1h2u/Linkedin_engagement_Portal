from __future__ import annotations

from ..models.post_model import ExtractedPost

EXCLUDE_KEYWORDS = [
    "hiring",
    "we're hiring",
    "we are hiring",
    "happy birthday",
    "birthday",
    "anniversary",
    "congratulations",
    "congrats",
    "job opening",
    "vacancy",
    "excited to share",
    "thrilled to announce",
    "join our team",
    "join us",
    "apply now",
]

INCLUDE_KEYWORDS = [
    "msme",
    "loan",
    "credit",
    "finance",
    "bank",
    "policy",
    "scheme",
    "working capital",
    "rejected",
    "approval",
    "interest rate",
]


def basic_score(text: str) -> int:
    text_lower = text.lower()
    return sum(keyword in text_lower for keyword in INCLUDE_KEYWORDS)


def basic_filter(text: str) -> bool:
    text_lower = text.lower()

    if any(keyword in text_lower for keyword in EXCLUDE_KEYWORDS):
        return False

    score = basic_score(text)

    if score < 2:
        return False

    return True


def apply_basic_filter(posts: list[ExtractedPost], minimum_score: int = 2) -> list[ExtractedPost]:
    filtered_posts: list[ExtractedPost] = []

    for post in posts:
        score = basic_score(post.text)
        passes = basic_filter(post.text) and score >= minimum_score
        post.basic_score = score
        post.passed_basic_filter = passes

        if passes:
            filtered_posts.append(post)

    return filtered_posts
