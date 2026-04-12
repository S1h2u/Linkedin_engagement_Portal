from __future__ import annotations

def get_config():
    from automation_scripts.core.session import AutomationConfig

    return AutomationConfig.from_env()


def _get_data_dir():
    from pathlib import Path

    return Path(__file__).resolve().parents[2] / "automation_scripts" / "data"


def login() -> dict[str, str | bool]:
    from automation_scripts.runner.linkedin_runner import run_linkedin_login

    return run_linkedin_login(get_config())


def run_bot() -> dict[str, str | bool]:
    from automation_scripts.runner.linkedin_runner import run_linkedin_automation

    return run_linkedin_automation(get_config())


def generate_comments(tone: str = "balanced") -> dict[str, object]:
    from automation_scripts.utils.comment_generator import generate_comment
    from automation_scripts.utils.review_state import load_review_state, save_review_state

    data_dir = _get_data_dir()
    posts = load_review_state(data_dir)
    config = get_config()

    for post in posts:
        if not post.comment and post.status == "pending":
            post.comment = generate_comment(config, post.text, tone=tone)
            post.tone = tone

    save_review_state(posts, data_dir)
    return {
        "status": f"Generated comments (tone: {tone}) for extracted LinkedIn posts.",
        "posts": [post.to_dict() for post in posts],
    }


def get_review_posts() -> dict[str, object]:
    from automation_scripts.utils.review_state import load_review_state

    data_dir = _get_data_dir()
    posts = load_review_state(data_dir)
    return {
        "status": "Loaded latest review posts.",
        "posts": [post.to_dict() for post in posts],
    }


def apply_post_action(post_id: int, action: str, refine_prompt: str = "", tone: str = "") -> dict[str, object]:
    from automation_scripts.runner.linkedin_runner import run_linkedin_engagement
    from automation_scripts.utils.comment_generator import generate_comment, refine_comment
    from automation_scripts.utils.review_state import load_review_state, save_review_state

    data_dir = _get_data_dir()
    posts = load_review_state(data_dir)

    target = next((post for post in posts if post.id == post_id), None)
    if target is None:
        raise ValueError(f"Post with id {post_id} was not found.")

    normalized_action = action.strip().lower()
    config = get_config()
    
    # Use existing tone or provided tone
    effective_tone = tone.strip() or target.tone

    if normalized_action == "reject":
        target.status = "rejected"
    elif normalized_action == "refine":
        if not refine_prompt.strip():
            raise ValueError("refine_prompt is required when action is refine.")
        target.comment = refine_comment(config, target.comment, refine_prompt.strip(), target.text, tone=effective_tone)
        target.status = "pending"
        if tone.strip():
            target.tone = effective_tone
    elif normalized_action == "approve":
        if not target.comment.strip():
            target.comment = generate_comment(config, target.text, tone=effective_tone)
        # 🔥 FIX: Use target.post_url (real post URL) not target.url (author profile)
        run_linkedin_engagement(target.post_url, target.comment, config)
        target.status = "approved"
    else:
        raise ValueError("Unsupported action. Use approve, reject, or refine.")

    save_review_state(posts, data_dir)
    return {
        "status": f"Action '{normalized_action}' completed successfully.",
        "posts": [post.to_dict() for post in posts],
        "post": target.to_dict(),
    }


def check_session() -> dict[str, str | bool]:
    from automation_scripts.core.session_manager import (
        get_session_state_path,
        session_exists,
    )

    config = get_config()
    return {
        "session_saved": session_exists(config),
        "session_path": str(get_session_state_path(config)),
    }
