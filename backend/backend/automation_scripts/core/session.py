from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

from dotenv import load_dotenv

if TYPE_CHECKING:
    from playwright.sync_api import Browser, BrowserContext, Page, Playwright
else:
    Browser = BrowserContext = Page = Playwright = Any


@dataclass
class AutomationConfig:
    linkedin_email: str
    linkedin_password: str
    openai_api_key: str
    openai_model: str
    enable_llm_filter: bool = True
    headless: bool = False
    slow_mo_ms: int = 150
    default_timeout_ms: int = 30000
    post_login_wait_ms: int = 5000
    manual_login_timeout_ms: int = 300000
    session_state_path: Path = Path("backend/automation_scripts/data/linkedin_storage_state.json")

    @classmethod
    def from_env(cls) -> "AutomationConfig":
        load_dotenv()

        email = os.getenv("LINKEDIN_EMAIL", "").strip()
        password = os.getenv("LINKEDIN_PASSWORD", "").strip()
        openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
        enable_llm_filter = os.getenv("ENABLE_LLM_FILTER", "true").strip().lower() == "true"
        headless = os.getenv("PLAYWRIGHT_HEADLESS", "false").strip().lower() == "true"
        slow_mo_ms = int(os.getenv("PLAYWRIGHT_SLOW_MO_MS", "150"))
        default_timeout_ms = int(os.getenv("PLAYWRIGHT_TIMEOUT_MS", "30000"))
        post_login_wait_ms = int(os.getenv("LINKEDIN_POST_LOGIN_WAIT_MS", "5000"))
        manual_login_timeout_ms = int(os.getenv("LINKEDIN_MANUAL_LOGIN_TIMEOUT_MS", "300000"))
        repo_root = Path(__file__).resolve().parents[3]
        session_state_path = Path(
            os.getenv(
                "LINKEDIN_SESSION_STATE_PATH",
                str(repo_root / "backend" / "automation_scripts" / "data" / "linkedin_storage_state.json"),
            )
        )

        return cls(
            linkedin_email=email,
            linkedin_password=password,
            openai_api_key=openai_api_key,
            openai_model=openai_model,
            enable_llm_filter=enable_llm_filter,
            headless=headless,
            slow_mo_ms=slow_mo_ms,
            default_timeout_ms=default_timeout_ms,
            post_login_wait_ms=post_login_wait_ms,
            manual_login_timeout_ms=manual_login_timeout_ms,
            session_state_path=session_state_path,
        )


@dataclass
class AutomationContext:
    config: AutomationConfig
    logger: logging.Logger
    playwright: Playwright
    browser: Browser
    browser_context: BrowserContext
    page: Page
