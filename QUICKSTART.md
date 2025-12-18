# 🚀 ברשותי - Quick Start Guide

## התחלה מהירה ב-5 דקות

### 1️⃣ הכנת Supabase (2 דקות)

```bash
1. גש ל-https://supabase.com והתחבר
2. לחץ "New Project"
3. שם: birshuti | סיסמה: [חזקה] | Region: Frankfurt
4. המתן ל-provisioning
```

### 2️⃣ הרצת SQL (1 דקה)

```bash
1. Supabase → SQL Editor → New Query
2. העתק את database/schema.sql → Run
3. New Query
4. העתק את database/rls-policies.sql → Run
```

### 3️⃣ קבלת API Keys (30 שניות)

```bash
Supabase → Settings → API

שמור:
✅ Project URL: https://xxxxx.supabase.co
✅ anon public: eyJhbGc...
✅ service_role: eyJhbGc... (סודי!)
```

### 4️⃣ התקנה מקומית (1 דקה)

```bash
cd Birshuti
npm install
copy .env.example .env
# ערוך .env עם המפתחות מלמעלה
npm start
```

### 5️⃣ יצירת מנהל (30 שניות)

```bash
1. גש ל-http://localhost:3000/register
2. הירשם: admin@birshuti.local / 240397Sm!
3. Supabase → SQL Editor:

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@birshuti.local';

4. התחבר שוב → פאנל ניהול זמין!
```

---

## ✅ הכל עובד!

עכשיו יש לך:
- ✅ פלטפורמה פעילה על `http://localhost:3000`
- ✅ משתמש מנהל: admin@birshuti.local / 240397Sm!
- ✅ גישה לפאנל ניהול
- ✅ מוכן ל-production!

---

## 🚀 Deploy ל-Production (10 דקות)

### אופציה א': Render (מומלץ)

```bash
1. Push ל-GitHub:
   git add .
   git commit -m "Ready for production"
   git push

2. Render.com → New Web Service → Connect GitHub

3. הגדרות:
   Build: npm install
   Start: npm start

4. Environment Variables:
   NODE_ENV=production
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_KEY=...
   SESSION_SECRET=[random]
   BASE_URL=https://your-app.onrender.com

5. Deploy!
```

קרא עוד ב-[DEPLOYMENT.md](DEPLOYMENT.md)

---

## 📚 מסמכים נוספים

| מה? | איפה? |
|-----|-------|
| סקירה כללית | [README.md](README.md) |
| הוראות התקנה מלאות | [SETUP.md](SETUP.md) |
| מדריך deployment מפורט | [DEPLOYMENT.md](DEPLOYMENT.md) |
| checklist אבטחה | [SECURITY.md](SECURITY.md) |
| תיעוד מלא | [DOCUMENTATION.md](DOCUMENTATION.md) |

---

## 🆘 בעיות נפוצות

### "Cannot find module"
```bash
rm -rf node_modules
npm install
```

### "Supabase connection failed"
בדוק ש-SUPABASE_URL ו-Keys נכונים ב-`.env`

### "Permission denied"
בדוק שהרצת את `database/rls-policies.sql`

### "Cannot create listing"
המשתמש צריך להיות `verified_volunteer` או `admin`

---

## 📞 תמיכה

בעיות? בדוק את [DOCUMENTATION.md](DOCUMENTATION.md) או פתח issue.

---

**מזל טוב! הפלטפורמה שלך מוכנה! 🎉**
