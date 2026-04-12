# Git Configuration & File Management Guide

## Files That Should Be Committed (✅ Tracked)

### Backend
- ✅ `backend/requirements.txt` - Python dependencies list
- ✅ `backend/.env.example` - Template for environment variables
- ✅ `backend/backend/` - Django app files (settings.py, urls.py, etc.)
- ✅ `backend/automation_scripts/` - All automation scripts
- ✅ `backend/README.md` - Backend documentation
- ✅ `backend/manage.py` - Django management script

### Frontend
- ✅ `frontend/package.json` - NPM dependencies
- ✅ `frontend/package-lock.json` - Locked dependency versions
- ✅ `frontend/.env.local.example` - Environment variable template
- ✅ `frontend/app/` - Next.js app directory
- ✅ `frontend/components/` - React components (including LinkedInAutomation.tsx)
- ✅ `frontend/lib/` - Utility libraries and API clients
- ✅ `frontend/tsconfig.json` - TypeScript configuration
- ✅ `frontend/tailwind.config.js` - Tailwind CSS configuration
- ✅ `frontend/next.config.js` - Next.js configuration
- ✅ `frontend/LINKEDIN_AUTOMATION_GUIDE.md` - Feature documentation

### Root
- ✅ `.gitignore` - Git ignore rules
- ✅ `README.md` - Project documentation

---

## Files That Should NOT Be Committed (❌ Ignored)

### Sensitive Files (⚠️ CRITICAL)
- ❌ `.env` - Contains credentials, API keys, passwords
- ❌ `.env.local` - Local development environment variables
- ❌ `.env.*.local` - Any local environment variant files

### Generated/Dependency Files
- ❌ `node_modules/` - NPM packages (install via `npm install`)
- ❌ `venv/` / `env/` / `.venv` - Python virtual environments
- ❌ `__pycache__/` - Python compiled files
- ❌ `.next/` - Next.js build artifacts
- ❌ `dist/` - Build output
- ❌ `build/` - Build artifacts

### Database Files
- ❌ `db.sqlite3` - Local SQLite database
- ❌ `db.sqlite3-journal` - Database journal files

### Logs & Caches
- ❌ `*.log` - Log files
- ❌ `.pytest_cache/` - Pytest cache
- ❌ `.coverage` - Coverage reports

### Browser Automation Files
- ❌ `linkedin_storage_state.json` - LinkedIn session storage
- ❌ `latest_review_state.json` - Automation state files
- ❌ `playwright-report/` - Test reports

### IDE/Editor Files
- ❌ `.vscode/` - VS Code settings
- ❌ `.idea/` - IntelliJ settings
- ❌ `*.swp` / `*.swo` - Vim swap files

### OS Files
- ❌ `.DS_Store` - macOS specific
- ❌ `Thumbs.db` - Windows specific

---

## How to Set Up After Cloning

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Linkedin_engagement_Portal
```

### 2. Set Up Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your editor
# Add:
# - LINKEDIN_EMAIL
# - LINKEDIN_PASSWORD
# - OPENAI_API_KEY
# - Other API configurations

# Run migrations
python manage.py migrate

# Start backend
python manage.py runserver
```

### 3. Set Up Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
# Add:
# - NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Start development server
npm run dev
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Example |
|----------|----------|---------|
| `LINKEDIN_EMAIL` | Yes | your_email@example.com |
| `LINKEDIN_PASSWORD` | Yes | your_password |
| `OPENAI_API_KEY` | Yes | sk-proj-... |
| `DJANGO_SECRET_KEY` | No | random-secret-key |
| `PLAYWRIGHT_HEADLESS` | No | true/false |
| `MARKET_PULSE_BASE_URL` | No | http://localhost:8000 |

### Frontend (.env.local)

| Variable | Required | Example |
|----------|----------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Yes | http://localhost:8000 |

---

## Current .gitignore Status

Your `.gitignore` now properly:
- ✅ Prevents .env files from being committed
- ✅ Ignores node_modules and venv
- ✅ Ignores database files and logs
- ✅ Ignores IDE and OS-specific files
- ✅ Allows example files (.env.example, .env.local.example)
- ✅ Ignores browser automation temporary files

---

## Security Checklist Before Pushing to GitHub

- [ ] No `.env` file in repository
- [ ] No `.env.local` file in repository
- [ ] No `db.sqlite3` file in repository
- [ ] No API keys or credentials visible in code
- [ ] `.env.example` files are present as templates
- [ ] `requirements.txt` is up to date
- [ ] `package.json` is up to date
- [ ] No node_modules or venv folders

---

## If You Accidentally Committed Sensitive Files

```bash
# Remove from Git history (but keep locally)
git rm --cached .env
git rm --cached backend/db.sqlite3

# Commit the removal
git commit -m "Remove sensitive files from tracking"
git push origin main

# Force GitHub to remove from history
git push origin --force-with-lease
```

**⚠️ After doing this, regenerate all API keys and passwords!**

---

## Tips for Developers

1. **Always start with .env.example**: Copy it to .env and fill in your values
2. **Never commit .env**: It's in .gitignore for a reason
3. **Update examples**: If you add new env variables, update .env.example
4. **Document secrets**: Add comments in .env.example explaining what each variable does
5. **Use secrets management**: For production, use environment variable services (GitHub Secrets, CI/CD platforms, etc.)

