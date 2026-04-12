from __future__ import annotations

from pathlib import Path

from .session import AutomationConfig, AutomationContext


def get_session_state_path(config: AutomationConfig) -> Path:
    return config.session_state_path


def session_exists(config: AutomationConfig) -> bool:
    return get_session_state_path(config).exists()


def save_session(context: AutomationContext) -> Path:
    session_path = get_session_state_path(context.config)
    session_path.parent.mkdir(parents=True, exist_ok=True)
    context.browser_context.storage_state(path=str(session_path))
    context.logger.info("Saved LinkedIn session to %s", session_path)
    return session_path
