from __future__ import annotations

import random
import time

from ..core.session import AutomationContext


def scroll(
    context: AutomationContext,
    scroll_count: int = 5,
    min_pause_seconds: float = 3,
    max_pause_seconds: float = 6,
) -> None:
    context.logger.info("Scrolling LinkedIn results feed %s times.", scroll_count)

    for index in range(scroll_count):
        context.page.mouse.wheel(0, 3000)
        pause_seconds = random.uniform(min_pause_seconds, max_pause_seconds)
        context.logger.info(
            "Completed scroll %s of %s. Sleeping for %.2f seconds.",
            index + 1,
            scroll_count,
            pause_seconds,
        )
        time.sleep(pause_seconds)
