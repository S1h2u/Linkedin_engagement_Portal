from __future__ import annotations

import time

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

from ..constants.selectors import GLOBAL_NAV_SELECTOR, LINKEDIN_LOGIN_URL
from ..core.session import AutomationContext


def login(context: AutomationContext) -> None:
    page = context.page
    logger = context.logger

    logger.info("Starting manual LinkedIn login step.")

    try:
        page.goto(LINKEDIN_LOGIN_URL, wait_until="domcontentloaded")
        logger.info(
            "Manual login required. Please sign in yourself in the opened LinkedIn browser within %s seconds.",
            context.config.manual_login_timeout_ms // 1000,
        )
        logger.info("Waiting for LinkedIn to redirect to an authenticated page after your login.")

        deadline = time.time() + (context.config.manual_login_timeout_ms / 1000)

        while time.time() < deadline:
            current_url = page.url.lower()

            if "linkedin.com/feed" in current_url or "linkedin.com/in/" in current_url:
                page.wait_for_timeout(context.config.post_login_wait_ms)
                logger.info("Login step completed successfully. Redirected to %s", page.url)
                return

            try:
                page.locator(GLOBAL_NAV_SELECTOR).wait_for(state="visible", timeout=2000)
                page.wait_for_timeout(context.config.post_login_wait_ms)
                logger.info("LinkedIn global navigation detected. Login step completed at %s", page.url)
                return
            except PlaywrightTimeoutError:
                time.sleep(2)

        raise RuntimeError(f"Unexpected post-login URL: {page.url}")
    except PlaywrightTimeoutError as exc:
        raise RuntimeError(
            "Manual login timed out before LinkedIn redirected to the feed page."
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"[LOGIN STEP FAILED] {exc}") from exc
