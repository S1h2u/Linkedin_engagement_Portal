from __future__ import annotations

from ..core.browser import close_context, create_context
from ..core.session import AutomationConfig
from ..core.session_manager import get_session_state_path, session_exists
from ..steps.engagement_step import like_and_comment
from ..workflows.linkedin_flow import run_full_flow, run_login_flow


def run_linkedin_login(config: AutomationConfig | None = None) -> dict[str, str | bool]:
    resolved_config = config or AutomationConfig.from_env()
    context = create_context(resolved_config, use_saved_session=False)

    try:
        run_login_flow(context)
        session_path = get_session_state_path(resolved_config)
        context.logger.info("LinkedIn login flow completed successfully.")
        return {
            "status": "Login completed and session saved.",
            "session_saved": True,
            "session_path": str(session_path),
        }
    except Exception:
        context.logger.exception("LinkedIn login flow failed.")
        raise
    finally:
        close_context(context)


def run_linkedin_automation(config: AutomationConfig | None = None) -> dict[str, str | bool]:
    resolved_config = config or AutomationConfig.from_env()

    if not session_exists(resolved_config):
        raise FileNotFoundError(
            f"No saved LinkedIn session found at {get_session_state_path(resolved_config)}."
        )

    context = create_context(resolved_config, use_saved_session=True)

    try:
        result = run_full_flow(context)
        context.logger.info("LinkedIn automation flow completed successfully.")
        return result
    except Exception:
        context.logger.exception("LinkedIn automation flow failed.")
        raise
    finally:
        close_context(context)


def run_linkedin_engagement(
    post_url: str,
    comment: str,
    config: AutomationConfig | None = None,
) -> dict[str, str | bool]:
    resolved_config = config or AutomationConfig.from_env()

    if not session_exists(resolved_config):
        raise FileNotFoundError(
            f"No saved LinkedIn session found at {get_session_state_path(resolved_config)}."
        )

    context = create_context(resolved_config, use_saved_session=True)

    try:
        like_and_comment(context, post_url, comment)
        context.logger.info("LinkedIn engagement action completed successfully.")
        return {
            "status": "LinkedIn like and comment posted successfully.",
            "post_url": post_url,
            "comment_posted": True,
        }
    except Exception:
        context.logger.exception("LinkedIn engagement action failed.")
        raise
    finally:
        close_context(context)
