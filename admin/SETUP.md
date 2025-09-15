# Quick Setup Guide - Admin Panel

## 🚀 Quick Start (5 minutes)

### 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database**
5. Enable **Storage**

### 2. Get Firebase Config
1. Project Settings → General → Your Apps
2. Copy the config object
3. Replace in `config.js`

### 3. Create Admin User
1. Authentication → Users → Add User
2. Enter admin email/password
3. Save credentials

### 4. Set Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Deploy
1. Upload all files to your server
2. Access via `yoursite.com/admin/`
3. Login with admin credentials

## ✅ Done!

Your admin panel is now ready to use!

---
**Need help?** Check the full README.md for detailed instructions.
