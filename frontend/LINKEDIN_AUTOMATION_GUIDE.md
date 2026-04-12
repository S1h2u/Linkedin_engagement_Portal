# 🤖 LinkedIn Comment Automation Integration

## Overview

The LinkedIn Comment Automation feature is now integrated into your Next.js frontend. It allows you to:

- ✅ **Login** to LinkedIn
- 🚀 **Scrape** LinkedIn posts relevant to your interests
- ✨ **Generate** AI-powered comments using tone customization
- 📋 **Review** and approve/reject/refine comments before posting
- 💬 **Post** comments directly to LinkedIn

---

## 🔧 Setup Instructions

### 1. **Update Backend URL**

Create or update your `.env.local` file in the frontend directory:

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and set the backend URL:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**For deployed backends**, use your backend's domain:
```
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

### 2. **Ensure Backend is Running**

Make sure your Django backend is running:

```bash
cd backend
python manage.py runserver
```

Or for production:
```bash
python manage.py runserver 0.0.0.0:8000
```

### 3. **Backend Environment Variables**

Ensure your backend has the required environment variables (check `backend/.env`):

```
OPENAI_API_KEY=your-openai-key
MARKET_PULSE_BASE_URL=http://your-api-url
```

### 4. **Start Frontend Development Server**

```bash
cd frontend
npm install  # if dependencies not installed
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🎯 How to Use

### **Step 1: Login to LinkedIn**
- Click the **🔐 Login to LinkedIn** button
- This initiates the browser automation to log into LinkedIn
- Wait for confirmation that the session is active (green status indicator)

### **Step 2: Run the Bot**
- Click **🚀 Run Bot (Scrape Posts)**
- The bot will scrape posts from your LinkedIn feed
- This may take a few minutes depending on the number of posts

### **Step 3: Generate Comments**
1. Select a **tone** from the dropdown:
   - `balanced` (neutral, professional)
   - `professional` (formal, business-focused)
   - `casual` (friendly, conversational)
   - `engaging` (interactive, high-energy)
   - `insightful` (analytical, thoughtful)

2. Click **✨ Generate Comments**
- The AI will generate comments for pending posts

### **Step 4: Review Posts**
- View your **scraped posts** with **generated comments**
- For each post, you can:
  - **✅ Approve & Post** - Post the comment immediately
  - **❌ Reject** - Skip this post
  - **▼ Refine Comment** - Provide feedback to improve the comment

### **Step 5: Refine Comments (Optional)**
- Click **▼ Refine Comment** to expand refinement options
- Enter your feedback/refinement prompt
- Click **Apply Refinement** to regenerate the comment
- The new comment will maintain your selected tone

---

## 🔄 API Endpoints

The component uses these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/linkedin/login/` | POST | Authenticate with LinkedIn |
| `/api/linkedin/run/` | POST | Scrape posts from feed |
| `/api/linkedin/session/` | GET | Check if session is active |
| `/api/linkedin/review-posts/` | GET | Get scraped posts |
| `/api/linkedin/generate-comments/` | POST | Generate AI comments (accepts `tone` param) |
| `/api/linkedin/action/` | POST | Approve/reject/refine post comments |

---

## 📊 Post Model Structure

Each post contains:

```typescript
{
  id: number;                    // Unique post ID
  text: string;                  // Post content
  author: string;                // Who posted it
  url: string;                   // Author's profile URL
  post_url: string;              // Direct link to the post
  basic_score: number;           // Initial relevance score (0-100)
  passed_basic_filter: boolean;  // Passed basic filtering
  llm_category: string;          // AI-determined category
  passed_llm_filter: boolean;    // Passed AI Filter
  comment: string;               // Generated comment
  status: string;                // pending | approved | rejected
  tone: string;                  // balanced | professional | casual | etc.
}
```

---

## 🎨 UI Components

### **LinkedInAutomation Component**
Location: `frontend/components/LinkedInAutomation.tsx`

Features:
- Session status indicator
- Control panel for bot actions
- Tone selection dropdown
- Posts review grid
- Comment refinement interface
- Status badges and action buttons

---

## 📝 Error Handling

The component displays user-friendly error messages:

- ❌ **Login failed** - Check LinkedIn credentials in browser automation
- ❌ **Bot failed** - Check internet connection and LinkedIn access
- ❌ **Comment generation failed** - Check OpenAI API key
- ⚠️ **No posts found** - Run the bot first

---

## 🔐 Security Notes

- **CORS**: Backend allows requests from frontend via `@csrf_exempt` decorators
- **Authentication**: LinkedIn login handled via Playwright browser automation
- **API Keys**: Store OPENAI_API_KEY in backend `.env` (never expose to frontend)

---

## 🚀 Deployment

### **Frontend (Vercel/Netlify)**
```bash
# Build for production
npm run build

# The .env.local variables are loaded at build time
# For dynamic backends, use NEXT_PUBLIC_BACKEND_URL
```

### **Backend (Django)**
```bash
# Production server
gunicorn backend.wsgi:application --bind 0.0.0.0:8000

# Make sure CORS/CSRF settings allow frontend origin
```

---

## 📚 File Structure

```
frontend/
├── components/
│   └── LinkedInAutomation.tsx    # 🔥 Main automation UI component
├── lib/
│   └── api.ts                     # 🔥 API functions for automation
├── app/
│   └── page.tsx                   # 🔥 Updated to include LinkedInAutomation
└── .env.local                     # Your local config (add NEXT_PUBLIC_BACKEND_URL)
```

---

## 🐛 Troubleshooting

### **"LinkedIn Session not active"**
- Click **🔐 Login to LinkedIn** button
- Browser automation may require you to complete verification steps
- Check browser console for errors

### **"Failed to fetch posts"**
- Ensure backend is running on the configured URL
- Check network tab in browser DevTools
- Verify `NEXT_PUBLIC_BACKEND_URL` environment variable

### **"No comments generated"**
- Ensure OpenAI API key is set in backend
- Check that posts were successfully scraped
- Verify tone selection is correct

### **CORS Errors**
- Backend should have `@csrf_exempt` on endpoints
- Check backend allows requests from your frontend URL
- For local development, both should be accessible

---

## 💡 Tips

1. **Always Review** - Always review AI-generated comments before approval
2. **Experiment with Tones** - Try different tones to match your brand voice
3. **Use Refinement** - Use the refinement feature if comments don't match your style
4. **Check Filters** - Review post scores and filter results to ensure quality
5. **Batch Operations** - Generate comments for multiple posts at once for efficiency

---

## 📞 Support

For issues:
1. Check browser console (F12 → Console tab)
2. Check backend logs: `python manage.py runserver`
3. Verify environment variables are set correctly
4. Ensure both frontend and backend are running on correct ports

---

**Happy automating! 🚀**
