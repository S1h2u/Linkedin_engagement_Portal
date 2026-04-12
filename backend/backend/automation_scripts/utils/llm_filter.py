from __future__ import annotations

from ..core.session import AutomationConfig
from ..models.post_model import ExtractedPost

VALID_CATEGORIES = {"MSME_INSIGHT", "NOT_RELEVANT"}


def _classify_post_text(client, model: str, text: str) -> str:
    prompt = f"""You are filtering LinkedIn posts.

Only classify as MSME_INSIGHT if:
- It discusses real business problems, policies, finance, credit, banking, regulation, or impact on MSMEs

Do not classify as MSME_INSIGHT if:
- It is a hiring post
- It is promotional content
- It is a company announcement
- It is generic motivational content
- It is celebratory or congratulatory content

Post:
{text}

Return only one:
MSME_INSIGHT
NOT_RELEVANT
"""

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You strictly filter LinkedIn posts for high-signal MSME insights only."},
            {"role": "user", "content": prompt},
        ],
        temperature=0,
    )
    content = response.choices[0].message.content if response.choices else ""
    category = (content or "").strip().upper()

    if category not in VALID_CATEGORIES:
        return "NOT_RELEVANT"

    return category


def apply_llm_filter(config: AutomationConfig, posts: list[ExtractedPost]) -> list[ExtractedPost]:
    if not posts:
        return []

    if not config.enable_llm_filter:
        for post in posts:
            post.llm_category = "SKIPPED"
            post.passed_llm_filter = True
        return posts

    if not config.openai_api_key:
        for post in posts:
            post.llm_category = "SKIPPED_NO_API_KEY"
            post.passed_llm_filter = True
        return posts

    try:
        from openai import OpenAI
    except ImportError:
        for post in posts:
            post.llm_category = "SKIPPED_NO_SDK"
            post.passed_llm_filter = True
        return posts

    client = OpenAI(api_key=config.openai_api_key)
    filtered_posts: list[ExtractedPost] = []

    for post in posts:
        category = _classify_post_text(client, config.openai_model, post.text)
        post.llm_category = category
        post.passed_llm_filter = category == "MSME_INSIGHT"

        if post.passed_llm_filter:
            filtered_posts.append(post)

    return filtered_posts
