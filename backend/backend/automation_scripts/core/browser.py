from __future__ import annotations

from playwright.sync_api import sync_playwright

from .session import AutomationConfig, AutomationContext
from .session_manager import session_exists
from ..utils.logger import get_logger


def create_context(
    config: AutomationConfig,
    *,
    use_saved_session: bool = False,
) -> AutomationContext:
    logger = get_logger("linkedin_automation")
    playwright = sync_playwright().start()
    browser = playwright.chromium.launch(
        headless=config.headless,
        slow_mo=config.slow_mo_ms,
    )
    storage_state = None

    if use_saved_session and session_exists(config):
        storage_state = str(config.session_state_path)
        logger.info("Loading browser context from saved session: %s", storage_state)

    browser_context = browser.new_context(storage_state=storage_state)
    page = browser_context.new_page()
    page.set_default_timeout(config.default_timeout_ms)

    logger.info(
        "Browser launched | headless=%s slow_mo_ms=%s use_saved_session=%s",
        config.headless,
        config.slow_mo_ms,
        use_saved_session and storage_state is not None,
    )

    return AutomationContext(
        config=config,
        logger=logger,
        playwright=playwright,
        browser=browser,
        browser_context=browser_context,
        page=page,
    )


def close_context(context: AutomationContext) -> None:
    errors = []

    for action, fn in (
        ("page", context.page.close),
        ("browser_context", context.browser_context.close),
        ("browser", context.browser.close),
        ("playwright", context.playwright.stop),
    ):
        try:
            fn()
        except Exception as exc:  # pragma: no cover
            errors.append(f"{action}: {exc}")

    if errors:
        context.logger.warning("Context teardown completed with errors: %s", "; ".join(errors))
