from __future__ import annotations

from ..constants.selectors import LINKEDIN_FEED_URL
from ..core.session import AutomationContext


def ensure_authenticated_session(context: AutomationContext) -> None:
    context.logger.info("Validating saved LinkedIn session.")

    page = context.page

    page.goto(LINKEDIN_FEED_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(3000)

    current_url = page.url.lower()
    context.logger.info("Current URL after navigation: %s", current_url)

    if any(x in current_url for x in ["login", "checkpoint", "challenge"]):
        raise RuntimeError("Saved session is no longer authenticated. Please log in again.")

    if "linkedin.com/feed" in current_url or "linkedin.com/in/" in current_url:
        context.logger.info("Saved LinkedIn session is valid.")
        return

    raise RuntimeError("Saved LinkedIn session could not be validated.")
