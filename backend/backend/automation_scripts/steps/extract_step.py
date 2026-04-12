# # from __future__ import annotations

# # from urllib.parse import urljoin

# # from ..constants.selectors import (
# #     POST_AUTHOR_SELECTOR,
# #     POST_SELECTORS,
# #     POST_SEE_MORE_SELECTOR,
# #     POST_TEXT_SELECTOR,
# #     POST_URL_SELECTOR,
# # )
# # from ..core.session import AutomationContext
# # from ..models.post_model import ExtractedPost


# # def _get_post_elements(context: AutomationContext):
# #     for selector in POST_SELECTORS:
# #         posts = context.page.query_selector_all(selector)
# #         if posts:
# #             context.logger.info("Using post selector %s for extraction.", selector)
# #             return posts

# #     return []


# # def _expand_post_if_needed(context: AutomationContext, post) -> None:
# #     see_more = post.query_selector(POST_SEE_MORE_SELECTOR)
# #     if not see_more:
# #         return

# #     try:
# #         see_more.click(timeout=2000)
# #         context.page.wait_for_timeout(500)
# #     except Exception:
# #         context.logger.debug("Could not expand a truncated post; continuing with visible text.")


# # def extract_posts(context: AutomationContext, limit: int = 5) -> list[ExtractedPost]:
# #     context.logger.info("Extracting up to %s LinkedIn posts.", limit)
# #     posts = _get_post_elements(context)

# #     results: list[ExtractedPost] = []
# #     seen: set[str] = set()

# #     for post in posts:
# #         if len(results) >= limit:
# #             break

# #         try:
# #             _expand_post_if_needed(context, post)
# #             text_el = post.query_selector(POST_TEXT_SELECTOR)
# #             author_el = post.query_selector(POST_AUTHOR_SELECTOR)
# #             link_el = post.query_selector(POST_URL_SELECTOR)

# #             text = text_el.inner_text().strip() if text_el else ""
# #             author = author_el.inner_text().strip() if author_el else ""
# #             url = link_el.get_attribute("href") if link_el else ""
# #         except Exception as exc:
# #             context.logger.warning("Skipping a post that could not be read: %s", exc)
# #             continue

# #         if not text or len(text) < 20:
# #             continue

# #         if text in seen:
# #             continue

# #         seen.add(text)
# #         results.append(
# #             ExtractedPost(
# #                 text=text,
# #                 author=author,
# #                 url=urljoin("https://www.linkedin.com", url or ""),
# #             )
# #         )

# #     context.logger.info("Extracted %s posts from the LinkedIn results feed.", len(results))
# #     return results

# from __future__ import annotations

# from urllib.parse import urljoin

# from ..constants.selectors import (
#     POST_AUTHOR_SELECTOR,
#     POST_SELECTORS,
#     POST_SEE_MORE_SELECTOR,
#     POST_TEXT_SELECTOR,
#     POST_URL_SELECTOR,
# )
# from ..core.session import AutomationContext
# from ..models.post_model import ExtractedPost


# def _get_post_elements(context: AutomationContext):
#     for selector in POST_SELECTORS:
#         posts = context.page.query_selector_all(selector)
#         if posts:
#             context.logger.info("Using post selector %s for extraction.", selector)
#             return posts

#     return []


# def _expand_post_if_needed(context: AutomationContext, post) -> None:
#     see_more = post.query_selector(POST_SEE_MORE_SELECTOR)
#     if not see_more:
#         return

#     try:
#         see_more.click(timeout=2000)
#         context.page.wait_for_timeout(500)
#     except Exception:
#         context.logger.debug("Could not expand a truncated post; continuing with visible text.")


# def extract_posts(context: AutomationContext, limit: int = 5) -> list[ExtractedPost]:
#     context.logger.info("Extracting up to %s LinkedIn posts.", limit)
#     posts = _get_post_elements(context)

#     results: list[ExtractedPost] = []
#     seen: set[str] = set()

#     for post in posts:
#         if len(results) >= limit:
#             break

#         try:
#             _expand_post_if_needed(context, post)

#             # ✅ TEXT (primary + fallback)
#             try:
#                 text_el = post.query_selector("div.update-components-text")
#                 text = text_el.inner_text().strip() if text_el else ""
#             except Exception:
#                 try:
#                     text_el = post.query_selector(POST_TEXT_SELECTOR)
#                     text = text_el.inner_text().strip() if text_el else ""
#                 except Exception:
#                     text = ""

#             # ✅ AUTHOR (primary + fallback)
#             try:
#                 author_el = post.query_selector("span.update-components-actor__name")
#                 author = author_el.inner_text().strip() if author_el else "unknown"
#             except Exception:
#                 try:
#                     author_el = post.query_selector(POST_AUTHOR_SELECTOR)
#                     author = author_el.inner_text().strip() if author_el else "unknown"
#                 except Exception:
#                     author = "unknown"

#             # ✅ POST URL (target only real post/activity links)
#             try:
#                 link_el = post.query_selector("a[href*='/posts/'], a[href*='/activity/']")
#                 url = link_el.get_attribute("href") if link_el else ""
#             except Exception:
#                 try:
#                     link_el = post.query_selector(POST_URL_SELECTOR)
#                     url = link_el.get_attribute("href") if link_el else ""
#                 except Exception:
#                     url = ""

#         except Exception as exc:
#             context.logger.warning("Skipping a post that could not be read: %s", exc)
#             continue

#         # ✅ Basic validation
#         if not text or len(text) < 20:
#             continue

#         if text in seen:
#             continue

#         seen.add(text)

#         results.append(
#             ExtractedPost(
#                 text=text,
#                 author=author,
#                 url=urljoin("https://www.linkedin.com", url or ""),
#             )
#         )

#     context.logger.info("Extracted %s posts from the LinkedIn results feed.", len(results))
#     return results


from __future__ import annotations

from urllib.parse import urljoin

from ..constants.selectors import (
    POST_SELECTORS,
    POST_SEE_MORE_SELECTOR,
)
from ..core.session import AutomationContext
from ..models.post_model import ExtractedPost


def _get_post_elements(context: AutomationContext):
    for selector in POST_SELECTORS:
        posts = context.page.query_selector_all(selector)
        if posts:
            context.logger.info("Using post selector %s for extraction.", selector)
            return posts
    return []


def _expand_post_if_needed(context: AutomationContext, post) -> None:
    see_more = post.query_selector(POST_SEE_MORE_SELECTOR)
    if not see_more:
        return

    try:
        see_more.click(timeout=2000)
        context.page.wait_for_timeout(500)
    except Exception:
        context.logger.debug("Could not expand a truncated post; continuing.")


def extract_posts(context: AutomationContext, limit: int = 5) -> list[ExtractedPost]:
    context.logger.info("Extracting up to %s LinkedIn posts.", limit)
    posts = _get_post_elements(context)

    results: list[ExtractedPost] = []
    seen: set[str] = set()

    for post in posts:
        if len(results) >= limit:
            break

        try:
            _expand_post_if_needed(context, post)

            # =====================
            # ✅ TEXT (robust)
            # =====================
            text = ""
            for sel in [
                "div.update-components-text",
                "span.break-words",
                "div.feed-shared-update-v2__description",
            ]:
                try:
                    el = post.query_selector(sel)
                    if el:
                        text = el.inner_text().strip()
                        if text:
                            break
                except:
                    continue

            # =====================
            # ✅ AUTHOR (FINAL FIX)
            # =====================
            author = "unknown"

            try:
                el = post.query_selector(
                    "span.update-components-actor__title span[dir='ltr'] span[aria-hidden='true']"
                )
                if el:
                    author = el.inner_text().strip()
            except:
                pass

            # =====================
            # ✅ AUTHOR PROFILE URL
            # =====================
            author_url = ""
            try:
                el = post.query_selector("a.update-components-actor__meta-link")
                if el:
                    author_url = el.get_attribute("href")
            except:
                pass

            # =====================
            # ✅ REAL POST URL - URN EXTRACTION (MOST RELIABLE) 🔥
            # =====================
            post_url = ""

            try:
                # 🎯 Extract data-urn from post element
                urn = post.get_attribute("data-urn")

                if urn and "activity:" in urn:
                    # Parse: urn:li:activity:7123456789
                    activity_id = urn.split("activity:")[-1]
                    post_url = f"https://www.linkedin.com/feed/update/urn:li:activity:{activity_id}"
                    context.logger.info(f"Extracted post URL from URN: {post_url}")

            except Exception as e:
                context.logger.warning(f"URN extraction failed: {e}")
                
                # 🔄 Fallback: Try link extraction if URN fails
                try:
                    for link in post.query_selector_all("a"):
                        try:
                            href = link.get_attribute("href")
                            if href and ("/posts/" in href or "/activity/" in href):
                                post_url = href
                                context.logger.debug(f"Fallback: Found post URL via link: {post_url}")
                                break
                        except:
                            continue
                except Exception as fallback_err:
                    context.logger.debug(f"Link extraction fallback also failed: {fallback_err}")

        except Exception as exc:
            context.logger.warning("Skipping a post that could not be read: %s", exc)
            continue

        # =====================
        # ✅ VALIDATION
        # =====================
        if not text or len(text) < 20:
            continue

        if text in seen:
            continue

        seen.add(text)

        # 🔥 CRITICAL: Store REAL post_url, not author profile
        results.append(
            ExtractedPost(
                text=text,
                author=author,
                url=urljoin("https://www.linkedin.com", author_url or ""),  # Author profile
                post_url=urljoin("https://www.linkedin.com", post_url or ""),  # 🔥 REAL post URL
            )
        )

    context.logger.info("Extracted %s posts from the LinkedIn results feed.", len(results))
    return results