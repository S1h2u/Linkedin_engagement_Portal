# LinkedIn Automation Bot

Important: the backend now runs through Django, not FastAPI. Start it with `python manage.py runserver` and use the `/api/linkedin/.../` endpoints.

This repo now includes a modular, step-based automation framework under `backend/automation_scripts` so browser automation can grow like a test runner instead of turning into one large script.

## Structure

```text
backend/
├── automation_scripts/
│   ├── constants/
│   ├── core/
│   ├── runner/
│   ├── steps/
│   ├── utils/
│   └── workflows/
└── main.py
```

## Environment Setup

Add these values to `.env` in the project root:

```env
LINKEDIN_EMAIL=your-linkedin-email
LINKEDIN_PASSWORD=your-linkedin-password
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ENABLE_LLM_FILTER=true
PLAYWRIGHT_HEADLESS=false
PLAYWRIGHT_SLOW_MO_MS=150
PLAYWRIGHT_TIMEOUT_MS=30000
LINKEDIN_POST_LOGIN_WAIT_MS=5000
```

## Install

```bash
pip install -r requirements.txt
playwright install chromium
```

## Run Automation

From the project root:

```bash
python -m backend.main linkedin-login
```

This command will:

1. Load `.env`
2. Start a Playwright Chromium browser
3. Run the LinkedIn login workflow
4. Close browser resources safely

## Next Extension Points

- Add more atomic files inside `backend/automation_scripts/steps`
- Orchestrate them inside `backend/automation_scripts/workflows`
- Keep API/backend entrypoints thin and route execution through `runner`
