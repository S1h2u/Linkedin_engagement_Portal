from __future__ import annotations

from ..core.session import AutomationContext


def open_feed(context: AutomationContext) -> str:
    context.logger.info("Opening LinkedIn feed using the saved session.")
    context.page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
    context.page.wait_for_timeout(2000)
    return context.page.url
