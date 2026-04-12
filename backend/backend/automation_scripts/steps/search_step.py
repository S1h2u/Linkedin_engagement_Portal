from __future__ import annotations

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from urllib.parse import quote

from ..constants.selectors import (
    DATE_FILTER_SELECTOR,
    LINKEDIN_FEED_URL,
    PAST_24_HOURS_FILTER_SELECTOR,
    PAST_24_HOURS_LABEL_SELECTOR,
    POSTS_TAB_SELECTOR,
    POST_SELECTORS,
    SEARCH_INPUT_FALLBACK_PLACEHOLDER,
    SEARCH_INPUT_SELECTOR,
    SHOW_RESULTS_BUTTON_SELECTOR,
)
from ..core.session import AutomationContext


def _get_search_input(context: AutomationContext):
    page = context.page

    primary = page.locator(SEARCH_INPUT_SELECTOR).first
    try:
        primary.wait_for(state="visible", timeout=8000)
        context.logger.info("Using primary LinkedIn search locator: %s", SEARCH_INPUT_SELECTOR)
        return primary
    except PlaywrightTimeoutError:
        fallback = page.get_by_placeholder(SEARCH_INPUT_FALLBACK_PLACEHOLDER).first
        fallback.wait_for(state="visible", timeout=5000)
        context.logger.info(
            "Primary search locator not found. Using fallback placeholder locator: %s",
            SEARCH_INPUT_FALLBACK_PLACEHOLDER,
        )
        return fallback


def _wait_for_results(context: AutomationContext) -> str:
    for selector in POST_SELECTORS:
        try:
            context.page.locator(selector).first.wait_for(state="visible", timeout=10000)
            context.logger.info(
                "LinkedIn content results loaded with selector %s at %s",
                selector,
                context.page.url,
            )
            return context.page.url
        except PlaywrightTimeoutError:
            continue

    raise RuntimeError("LinkedIn content results did not load with any known post selector.")


def search(context: AutomationContext, query: str = "MSME") -> str:
    page = context.page
    context.logger.info("Searching LinkedIn content through the UI flow for query: %s", query)

    page.goto(LINKEDIN_FEED_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(2000)

    search_input = _get_search_input(context)
    search_input.click()
    page.wait_for_timeout(500)
    search_input.fill(query)
    page.wait_for_timeout(1000)
    search_input.press("Enter", delay=100)

    page.wait_for_url("**/search/results/**", timeout=15000)
    page.wait_for_timeout(4000)

    current_url = page.url.lower()
    context.logger.info("Current search results URL before Posts selection: %s", current_url)

    # ✅ NEW: Direct navigation to Posts (Content) using URL
    if "/search/results/content/" not in current_url:
        encoded_query = quote(query)
        content_url = f"https://www.linkedin.com/search/results/content/?keywords={encoded_query}"
        
        context.logger.info("Redirecting to LinkedIn Posts via URL: %s", content_url)
        page.goto(content_url, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)

    # --- Rest of your flow stays EXACTLY same ---

    page.locator(DATE_FILTER_SELECTOR).wait_for(state="visible", timeout=10000)
    page.wait_for_timeout(1000)

    page.locator(DATE_FILTER_SELECTOR).click()
    page.wait_for_timeout(2000)

    page.locator(PAST_24_HOURS_FILTER_SELECTOR).wait_for(state="visible", timeout=10000)
    page.locator(PAST_24_HOURS_LABEL_SELECTOR).click()
    page.wait_for_timeout(1000)

    show_results_button = page.locator("button[aria-label='Apply current filter to show results']:visible")
    show_results_button.wait_for(timeout=10000)
    show_results_button.click()
    page.wait_for_timeout(2000)

    return _wait_for_results(context)