"""Centralized selectors for LinkedIn automation."""

LINKEDIN_LOGIN_URL = "https://www.linkedin.com/login"
LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/"

EMAIL_INPUT = 'input[name="session_key"]'
PASSWORD_INPUT = 'input[name="session_password"]'
SUBMIT_BUTTON = 'button[type="submit"]'

# A stable authenticated-page signal we can wait for without using JS eval.
GLOBAL_NAV_SELECTOR = "nav.global-nav"
SEARCH_INPUT_SELECTOR = 'input[data-testid="typeahead-input"]'
SEARCH_INPUT_FALLBACK_PLACEHOLDER = "Search"
POSTS_TAB_SELECTOR = "button.search-reusables__filter-pill-button"
DATE_FILTER_SELECTOR = "#searchFilter_datePosted"
PAST_24_HOURS_FILTER_SELECTOR = "#datePosted-past-24h"
PAST_24_HOURS_LABEL_SELECTOR = "label[for='datePosted-past-24h']"
SHOW_RESULTS_BUTTON_SELECTOR = 'button[aria-label="Apply current filter to show results"]'
POST_SELECTORS = [
    "div.feed-shared-update-v2",
    "div[data-urn]",
]
POST_TEXT_SELECTOR = "div.update-components-text span[dir='ltr']"
POST_AUTHOR_SELECTOR = "span.update-components-actor__name"
POST_URL_SELECTOR = "a[href*='/posts/']"
POST_SEE_MORE_SELECTOR = "button[aria-label*='more']"
