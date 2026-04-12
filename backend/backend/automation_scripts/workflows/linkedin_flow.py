from __future__ import annotations

from pathlib import Path

from ..core.session import AutomationContext
from ..core.session_manager import save_session
from ..steps.extract_step import extract_posts
from ..steps.login_step import login
from ..steps.scroll_step import scroll
from ..steps.search_step import search
from ..steps.session_step import ensure_authenticated_session
from ..utils.exporter import save_posts_to_file
from ..utils.filtering import apply_basic_filter
from ..utils.llm_filter import apply_llm_filter
from ..utils.review_state import save_review_state


def run_login_flow(context: AutomationContext) -> None:
    context.logger.info("Running LinkedIn login workflow.")
    login(context)
    save_session(context)


def run_full_flow(context: AutomationContext) -> dict[str, str | bool | int | list[dict[str, str]]]:
    context.logger.info("Running LinkedIn authenticated workflow.")
    ensure_authenticated_session(context)
    search_url = search(context, query="MSME India")
    scroll(context)
    extracted_posts = extract_posts(context, limit=20)

    if not extracted_posts:
        raise RuntimeError("No LinkedIn posts were extracted from the MSME India results page.")

    context.logger.info("Running basic filter on %s extracted posts.", len(extracted_posts))
    basic_filtered_posts = apply_basic_filter(extracted_posts, minimum_score=2)
    context.logger.info("Basic filter kept %s posts.", len(basic_filtered_posts))

    llm_filtered_posts = apply_llm_filter(context.config, basic_filtered_posts)
    context.logger.info("LLM filter kept %s posts.", len(llm_filtered_posts))

    ranked_basic_posts = sorted(basic_filtered_posts, key=lambda post: post.basic_score, reverse=True)
    ranked_llm_posts = sorted(llm_filtered_posts, key=lambda post: post.basic_score, reverse=True)

    posts = ranked_llm_posts[:5] if ranked_llm_posts else ranked_basic_posts[:5]

    if not posts:
        raise RuntimeError("No LinkedIn posts passed the filtering pipeline.")

    for index, post in enumerate(posts, start=1):
        post.id = index

    data_dir = Path(__file__).resolve().parents[1] / "data"
    output_path = save_posts_to_file(posts, data_dir)
    save_review_state(posts, data_dir)

    for index, post in enumerate(posts, start=1):
        preview = post.text[:300].replace("\n", " ")
        context.logger.info(
            "Post %s | author=%s | post_url=%s | author_url=%s | preview=%s",
            index,
            post.author or "unknown",
            post.post_url or "missing",
            post.url or "missing",
            preview,
        )

    return {
        "status": "Automation completed and extracted LinkedIn posts were saved as structured JSON.",
        "session_saved": True,
        "current_url": search_url,
        "raw_post_count": len(extracted_posts),
        "basic_filtered_count": len(basic_filtered_posts),
        "llm_filtered_count": len(llm_filtered_posts),
        "post_count": len(posts),
        "output_file": str(output_path),
        "posts": [post.to_dict() for post in posts],
    }
