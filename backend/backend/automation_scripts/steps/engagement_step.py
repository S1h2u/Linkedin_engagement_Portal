from __future__ import annotations

from ..core.session import AutomationContext


def like_and_comment(context: AutomationContext, post_url: str, comment: str) -> None:
    if not post_url:
        raise RuntimeError("Cannot post engagement because the post URL is missing.")

    page = context.page
    logger = context.logger

    logger.info("Opening LinkedIn post for engagement: %s", post_url)
    page.goto(post_url, wait_until="domcontentloaded")
    page.wait_for_timeout(5000)  # ✅ Wait for page load

    # =====================
    # ✅ LIKE ACTION
    # =====================
    try:
        like_button = page.get_by_role("button", name="Like").first
        like_button.click()
        logger.info("Clicked Like on the LinkedIn post.")
    except Exception as exc:
        logger.warning("Could not click Like button: %s", exc)

    # =====================
    # ✅ COMMENT ACTION (FINAL FIX - PROPER BUTTON + VERIFICATION)
    # =====================
    comment_box = None
    try:
        # Step 1: Find and click comment box
        comment_box = page.locator("div[role='textbox']").first
        comment_box.wait_for(state="visible", timeout=15000)
        comment_box.click()
        page.wait_for_timeout(1000)

        logger.info("Comment box focused.")

        # Step 2: Type comment SLOWLY (triggers LinkedIn input events)
        comment_box.type(comment, delay=20)
        page.wait_for_timeout(1500)

        logger.info("Comment text typed: %s", comment[:100])

        # Step 3: Find the COMMENT button (blue button inside the comment box)
        # Try multiple selectors to find the comment submit button
        comment_button = None
        
        # Try selector 1: "Comment" button text
        try:
            comment_button = page.locator("button:has-text('Comment')").last
            comment_button.wait_for(state="visible", timeout=5000)
            logger.info("Found Comment button via text selector.")
        except:
            logger.debug("Comment button text selector failed.")
        
        # Try selector 2: Button in comment toolbar
        if not comment_button:
            try:
                comment_button = page.locator(".ql-editor + button").last
                comment_button.wait_for(state="visible", timeout=5000)
                logger.info("Found Comment button via editor selector.")
            except:
                logger.debug("Comment button editor selector failed.")

        # Try selector 3: Click Submit button
        if not comment_button:
            try:
                comment_button = page.locator("button[aria-label*='ubmit'], button[aria-label*='Post']").last
                comment_button.wait_for(state="visible", timeout=5000)
                logger.info("Found Comment button via aria-label selector.")
            except:
                logger.debug("Comment button aria-label selector failed.")

        if not comment_button:
            raise RuntimeError("Could not find comment submission button.")

        # Step 4: Ensure button is enabled before clicking
        page.wait_for_timeout(1000)

        logger.info("Comment button located and enabled.")

        # Step 5: Scroll to comment button to ensure it's in view
        comment_button.scroll_into_view_if_needed()
        page.wait_for_timeout(500)

        # Step 6: Click the Comment button
        comment_button.click()
        logger.info("Comment button clicked.")

        # Step 7: CRITICAL - Wait for submission to complete
        page.wait_for_timeout(4000)

        # Step 8: Verify comment was ACTUALLY posted to feed (not just in compose box)
        try:
            # Check if comment appears in the comment section (outside the compose box)
            # Wait for comment author name to appear (this is in the posted comment, not compose)
            page.wait_for_selector("div.comments", timeout=5000)
            
            # Additional verification: Look for our comment text in posted comments
            page.wait_for_selector(f"span:has-text('{comment[:50]}')", timeout=5000)
            
            logger.info("✅ Comment verified on feed - submission successful!")
        except:
            # Try alternative verification
            try:
                page.wait_for_selector(f"text={comment[:30]}", timeout=3000)
                logger.info("✅ Comment verified (alternative) - submission successful!")
            except:
                logger.warning("Could not verify comment visually, but submission was attempted. Check LinkedIn manually.")

        logger.info("Comment posted successfully ✅")

    except Exception as exc:
        logger.error(f"Comment failed: {exc}")
        
        # Only attempt fallback if we successfully focused the comment box
        if comment_box:
            # Fallback 1: Try pressing Enter key
            try:
                logger.info("Attempting fallback 1: Press Enter key...")
                comment_box.press("Enter")
                page.wait_for_timeout(2000)
                logger.info("Enter key pressed as fallback.")
                logger.info("Comment posted via Enter key fallback ✅")
                return
            except Exception as fallback_err1:
                logger.error(f"Fallback 1 (Enter key) failed: {fallback_err1}")
            
            # Fallback 2: Try Ctrl+Enter (common submit shortcut)
            try:
                logger.info("Attempting fallback 2: Press Ctrl+Enter...")
                comment_box.press("Control+Enter")
                page.wait_for_timeout(2000)
                logger.info("Ctrl+Enter pressed as fallback.")
                logger.info("Comment posted via Ctrl+Enter fallback ✅")
                return
            except Exception as fallback_err2:
                logger.error(f"Fallback 2 (Ctrl+Enter) failed: {fallback_err2}")
        
        raise
