# IMPORTANT: Setup Instructions

## ⚠️ CORS Error Fix

If you're getting CORS errors when uploading images, you MUST use a local web server. Opening HTML files directly (file://) will cause CORS errors with Firebase Storage.

## Quick Setup Solutions:

### Option 1: VS Code Live Server (Easiest)
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html` or `admin.html`
3. Select "Open with Live Server"
4. The page will open at `http://localhost:5500`

### Option 2: Python HTTP Server
1. Open terminal/command prompt in the project folder
2. Run: `python -m http.server 8000`
3. Open browser: `http://localhost:8000/admin.html`

### Option 3: Node.js HTTP Server
1. Install Node.js if not installed
2. Open terminal in project folder
3. Run: `npx http-server`
4. Open the URL shown (usually `http://localhost:8080`)

### Option 4: Deploy to GitHub Pages
1. Push code to GitHub
2. Go to Settings → Pages
3. Select main branch
4. Access via: `https://yourusername.github.io/Premiume-Store/admin.html`

## Firebase Storage Rules

Make sure your Firebase Storage rules allow uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true; // For development
    }
  }
}
```

## Testing

After starting a local server:
1. Open `http://localhost:8000/admin.html` (or your server URL)
2. Try uploading slider images
3. Check browser console (F12) for any errors
4. Images should upload to Firebase Storage successfully




