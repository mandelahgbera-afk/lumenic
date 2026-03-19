# LumenicData Application Form - Deployment Guide

## Overview

This application is a multi-step job application form that submits all form data, photos, and documents to your Telegram group via a bot.

**Key Architecture:**
- Frontend: HTML/CSS/JavaScript (static files)
- Backend: API endpoint that handles Telegram submissions
- Telegram Integration: Uses Telegram Bot API for receiving applications

---

## Table of Contents

1. [Hosting on Vercel (Recommended)](#hosting-on-vercel-recommended)
2. [Hosting on Cloudflare](#hosting-on-cloudflare)
3. [Environment Variables](#environment-variables)
4. [Testing the Submission Flow](#testing-the-submission-flow)
5. [Troubleshooting](#troubleshooting)

---

## Hosting on Vercel (Recommended)

### Why Vercel?
- Serverless functions built-in (no separate backend needed)
- Zero configuration required
- Automatic scaling
- Works seamlessly with Cloudflare proxy
- Free tier available

### Step 1: Prepare Your Repository

1. Initialize git in your project:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a GitHub repository and push your code:
```bash
git remote add origin https://github.com/yourusername/lumenic-data.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a static site + serverless functions
5. Click "Deploy"

### Step 3: Set Environment Variables in Vercel

1. In Vercel dashboard, go to Settings → Environment Variables
2. Add these variables:
   - `TG_BOT_TOKEN`: `8747195961:AAGIsJkItURdfd2zxI61kbw2CTLlHjLpMV8`
   - `TG_CHAT_ID`: `-5117669543`
3. Click "Save"
4. Click "Redeploy" to apply changes

### Step 4: How It Works on Vercel

**Frontend Flow:**
```
User fills form in browser
           ↓
Clicks "Submit Application"
           ↓
apply.js validates form & collects data
           ↓
Converts files to base64
           ↓
Sends JSON to /api/submit-application
           ↓
```

**Backend Flow (Vercel Serverless):**
```
/api/submit-application.js receives request
           ↓
Reads TG_BOT_TOKEN and TG_CHAT_ID from environment
           ↓
Formats message with all form data
           ↓
Converts base64 files back to binary
           ↓
Makes server-to-server calls to Telegram API (no CORS issues!)
           ↓
Sends text message + all files
           ↓
Returns success/error to frontend
           ↓
Shows success state to user
```

### Step 5: Test Your Deployment

1. Visit your Vercel URL (e.g., https://your-app.vercel.app)
2. Fill out the form completely
3. Upload photos and CV
4. Submit the form
5. Check your Telegram group - application should appear within 2-3 seconds

### File Structure on Vercel

```
your-project/
├── api/
│   └── submit-application.js    ← Serverless function (auto-deployed)
├── index.html
├── about.html
├── apply.html
├── styles.css
├── config.js
├── main.js
└── apply.js
```

Vercel automatically:
- Serves static files (HTML, CSS, JS)
- Runs serverless functions from `/api` folder
- Handles environment variables

---

## Hosting on Cloudflare

### Architecture Overview

When hosting on Cloudflare, you have two options:

**Option A: Use Vercel for backend only + Cloudflare for frontend**
- Cloudflare Workers (CDN) for static files
- Vercel for the `/api/submit-application` endpoint
- Cloudflare routes requests appropriately

**Option B: Self-hosted backend + Cloudflare for frontend**
- Cloudflare Workers for static files
- Node.js/Express backend on your own server
- More complex setup

**Recommended: Option A (hybrid approach)**

### Step 1: Deploy Static Files to Cloudflare

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click "Workers" → "Create a Worker"
3. Create a new service (e.g., "lumenic-app")
4. Replace default code with:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // API requests go to Vercel backend
    if (url.pathname.startsWith('/api/')) {
      return fetch('https://your-vercel-app.vercel.app' + url.pathname, {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
    }
    
    // Static file requests
    const filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    
    // Simple static file serving (for demo)
    // In production, use Cloudflare Pages instead
    return new Response('File not found', { status: 404 });
  }
};
```

**BETTER APPROACH: Use Cloudflare Pages**

1. Push your code to GitHub
2. In Cloudflare dashboard, go to Pages
3. Click "Create a project" → Connect to GitHub
4. Select your repository
5. Set build command: (leave blank - it's static)
6. Set output directory: `/` (root)
7. Under Environment variables, add:
   - `API_ENDPOINT`: `https://your-vercel-app.vercel.app`

### Step 2: Update Your Frontend to Use Correct API Endpoint

In `apply.js`, update the API call:

```javascript
async function sendToBackend(textData, files) {
  console.log('[v0-SUBMISSION] Converting files to base64...');
  
  const convertedFiles = {};
  for (const [key, file] of Object.entries(files)) {
    const base64 = await fileToBase64(file);
    convertedFiles[key] = {
      name: file.name,
      type: file.type,
      data: base64
    };
  }
  
  // Use the correct API endpoint
  const apiEndpoint = process.env.API_ENDPOINT || '/api/submit-application';
  
  console.log('[v0-SUBMISSION] Calling API...');
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formData: textData,
      files: convertedFiles
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
}
```

### Step 3: Deploy Backend to Vercel

Follow the Vercel section above - your backend will live on Vercel while frontend lives on Cloudflare.

### Step 4: Configure Custom Domain

1. In Cloudflare Pages settings, add your custom domain
2. Cloudflare automatically sets up HTTPS
3. Your form is now available at your domain

### Step 5: Test Submission Flow (Cloudflare Setup)

1. Visit your Cloudflare domain
2. Fill out form completely
3. Submit
4. Request flow:
   - Browser → Cloudflare (serves HTML/CSS/JS)
   - apply.js sends JSON → Vercel API
   - Vercel calls Telegram API
   - Response returns to browser
   - Success state shows

---

## Environment Variables

### Required Variables

**Telegram Bot Credentials:**
```
TG_BOT_TOKEN=8747195961:AAGIsJkItURdfd2zxI61kbw2CTLlHjLpMV8
TG_CHAT_ID=-5117669543
```

### How to Get These Values

1. **Bot Token:**
   - Message @BotFather on Telegram
   - Create new bot: `/newbot`
   - Get your token

2. **Chat ID:**
   - Add your bot to a Telegram group
   - Send a message to the group
   - Visit: `https://api.telegram.org/bot{TOKEN}/getUpdates`
   - Find the `chat` → `id` field (it's negative for groups)

### Where to Set Variables

**Vercel:**
Dashboard → Project → Settings → Environment Variables

**Cloudflare:**
Dashboard → Pages → Project → Settings → Environment Variables

**Local Development:**
Create `.env.local` file (don't commit to git):
```
TG_BOT_TOKEN=your_token_here
TG_CHAT_ID=your_chat_id_here
```

---

## Testing the Submission Flow

### Step 1: Verify Credentials

Open browser console (F12) and run:
```javascript
console.log(window.TG_BOT_TOKEN); // Should show your token
console.log(window.TG_CHAT_ID);   // Should show your chat ID
```

### Step 2: Test Form Submission

1. Fill all 4 steps of the form
2. Upload at least selfie photo
3. Click "Submit Application"
4. Watch console for logs starting with `[v0-SUBMISSION]`
5. You should see:
   - "Starting submission..."
   - "Form data collected: X fields"
   - "Sending to backend API..."
   - "✅ SUBMISSION COMPLETE"

### Step 3: Verify in Telegram

1. Check your Telegram group
2. You should see:
   - Message with all form fields formatted nicely
   - 3 photo uploads (selfie, ID front, ID back)
   - 1 document (CV/Resume)

### Console Output Examples

**Success:**
```
[v0-SUBMISSION] Starting submission...
[v0-SUBMISSION] Form data collected: 20 fields
[v0-SUBMISSION] Sending to backend API...
[v0-SUBMISSION] ✅ SUBMISSION COMPLETE
```

**Error Examples:**
```
[v0-SUBMISSION] ❌ FAILED: Telegram bot token not configured
[v0-SUBMISSION] ❌ FAILED: HTTP 400 - Bot token invalid
[v0-SUBMISSION] ❌ FAILED: API request failed
```

---

## Troubleshooting

### Issue: Form submits but nothing appears in Telegram

**Cause:** Bot token or chat ID is wrong

**Fix:**
1. Verify `TG_BOT_TOKEN` in environment variables
2. Verify `TG_CHAT_ID` in environment variables
3. Test bot token: `https://api.telegram.org/bot{TOKEN}/getMe`
   - Should return bot info
4. If 404 error, token is invalid

### Issue: Photos don't upload

**Cause:** File size too large or wrong format

**Fix:**
1. Check browser console for specific error
2. Limit file size: Max 10MB per file (Telegram limit)
3. Use standard formats: JPG, PNG for photos; PDF for documents

### Issue: "API endpoint not found"

**Cause:** Wrong domain or API path

**Fix:**
1. Verify `/api/submit-application` exists on your server
2. Check CORS headers are correct
3. Test endpoint directly: `https://your-domain.com/api/submit-application`

### Issue: Form says "Submitting..." but never completes

**Cause:** Telegram API timeout or network error

**Fix:**
1. Check internet connection
2. Check browser console for detailed error
3. Verify bot has permission to send messages in group
4. Try again after 30 seconds

### Issue: Files convert to base64 but API rejects them

**Cause:** Base64 encoding issue or file corruption

**Fix:**
1. Try smaller files first (test with 1MB files)
2. Make sure files are valid (can open them locally)
3. Check API logs for specific error message
4. Try uploading just 1 file instead of multiple

---

## API Endpoint Details

### Request Format

```json
POST /api/submit-application
Content-Type: application/json

{
  "formData": {
    "a-fullname": "John Doe",
    "a-email": "john@example.com",
    "a-phone": "+1234567890",
    ...
  },
  "files": {
    "a-selfie": {
      "name": "selfie.jpg",
      "type": "image/jpeg",
      "data": "base64_encoded_string..."
    },
    ...
  }
}
```

### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Application submitted successfully"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Telegram chat ID not configured"
}
```

### Form Fields Sent

Text fields:
- Full Name, Email, Phone, Location
- LinkedIn URL, GitHub URL
- Position, High School, Education Status
- Disability Status, Productive Time
- Coding Knowledge, Excel/Database Skills
- Years Experience, Portfolio URL
- Cover Note, Consent

File fields:
- Selfie photo
- ID front photo
- ID back photo
- CV/Resume document

---

## Security Considerations

### What NOT to Do

- Don't commit `TG_BOT_TOKEN` to GitHub (use environment variables)
- Don't expose token in client-side code
- Don't log token in console in production

### What This Setup Does Right

- Token is stored server-side only (in environment variables)
- API endpoint validates all data before sending to Telegram
- Files are converted to base64 on client, sent as JSON (safe)
- Server converts back and sends to Telegram (secure)

---

## Summary

### Vercel (Easiest)
1. Push code to GitHub
2. Deploy to Vercel
3. Set environment variables
4. Done - works immediately

### Cloudflare (More Complex)
1. Deploy frontend to Cloudflare Pages
2. Deploy backend to Vercel
3. Route API calls from Cloudflare to Vercel
4. Set environment variables in both places
5. Test submission flow

Both approaches are production-ready and support unlimited scale.
