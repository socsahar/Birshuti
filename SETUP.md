# ==========================================
# ברשותי - הוראות התקנה והפעלה
# ==========================================

## דרישות מקדימות

1. **Node.js** גרסה 18 ומעלה
2. חשבון **Supabase** (חינם)
3. **Git** (אופציונלי, לניהול גרסאות)

---

## שלב 1: הגדרת Supabase

### 1.1 יצירת פרויקט Supabase

1. היכנס ל-https://supabase.com
2. לחץ על "New Project"
3. מלא את פרטי הפרויקט:
   - שם הפרויקט: `birshuti`
   - סיסמת Database (שמור אותה!)
   - בחר Region (רצוי Frankfurt/London לישראל)

### 1.2 הרצת SQL Schema

1. בפאנל של Supabase, לחץ על "SQL Editor"
2. העתק והרץ את התוכן של `database/schema.sql`
3. ודא שההרצה הסתיימה בהצלחה (ללא שגיאות)

### 1.3 הפעלת RLS Policies

1. באותו SQL Editor
2. העתק והרץ את התוכן של `database/rls-policies.sql`
3. ודא הצלחה

### 1.4 הגדרת Authentication

1. לחץ על "Authentication" בתפריט
2. לחץ על "Providers"
3. ודא ש-Email Provider מופעל
4. לחץ על "Email Templates" ותרגם את התבניות לעברית (אופציונלי)

---

## שלב 2: התקנה מקומית

### 2.1 התקנת תלות

```bash
cd Birshuti
npm install
```

### 2.2 הגדרת משתני סביבה

1. העתק את `.env.example` ל-`.env`:
```bash
copy .env.example .env
```

2. פתח את `.env` וערוך:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

PORT=3000
NODE_ENV=development
SESSION_SECRET=your-random-secret-string-here
BASE_URL=http://localhost:3000
```

**איפה למצוא את המפתחות:**
- לחץ על Settings → API בפאנל של Supabase
- העתק את:
  - Project URL → `SUPABASE_URL`
  - anon/public key → `SUPABASE_ANON_KEY`
  - service_role key → `SUPABASE_SERVICE_KEY` (⚠️ שמור בסוד!)

### 2.3 הפעלת השרת

```bash
npm start
```

השרת יעלה ב-`http://localhost:3000`

---

## שלב 3: יצירת משתמש מנהל ראשון

### אופציה 1: דרך האתר (מומלץ)

1. גש ל-`http://localhost:3000/register`
2. הירשם עם:
   - אימייל: `admin@birshuti.local`
   - סיסמה: `240397Sm!`
   - מלא שאר הפרטים
   - **סמן** "מתנדב פעיל במד״א"
3. לאחר ההרשמה, גש ל-Supabase SQL Editor
4. הרץ:

```sql
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@birshuti.local';
```

### אופציה 2: SQL ישיר

ראה הוראות ב-`database/create-admin.sql`

---

## שלב 4: בדיקת הפלטפורמה

1. התחבר עם המנהל שיצרת
2. גש לפאנל הניהול: `http://localhost:3000/admin`
3. בדוק שכל הפונקציות עובדות:
   - צפייה בסטטיסטיקות
   - אישור/דחיית מתנדבים
   - ניהול משתמשים
   - יומן פעולות

---

## שלב 5: Deployment ל-Render

### 5.1 הכנה

1. ודא ש-`.env` ב-`.gitignore`
2. Commit הקוד ל-Git:

```bash
git init
git add .
git commit -m "Initial commit - Birshuti platform"
```

3. העלה ל-GitHub (צור repository חדש)

```bash
git remote add origin https://github.com/your-username/birshuti.git
git push -u origin main
```

### 5.2 יצירת Web Service ב-Render

1. היכנס ל-https://render.com
2. לחץ "New +" → "Web Service"
3. חבר את GitHub repository
4. הגדרות:
   - Name: `birshuti`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free (או Starter לפרודקשן)

### 5.3 הגדרת Environment Variables

ב-Render Dashboard, לחץ "Environment" והוסף:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SESSION_SECRET=generate-random-string-here
NODE_ENV=production
BASE_URL=https://your-app.onrender.com
```

**⚠️ חשוב:** השתמש במפתחות אמיתיים מ-Supabase!

### 5.4 Deploy

1. לחץ "Create Web Service"
2. Render יתחיל ב-build אוטומטי
3. המתן לסיום (כ-2-3 דקות)
4. האתר יהיה זמין ב-`https://your-app.onrender.com`

---

## בדיקת אבטחה

### ✅ Checklist לפני פרסום:

- [ ] `.env` ב-`.gitignore`
- [ ] אין מפתחות hardcoded בקוד
- [ ] RLS policies מופעלות ב-Supabase
- [ ] משתמש מנהל נוצר
- [ ] HTTPS אכוף (אוטומטי ב-Render)
- [ ] Rate limiting פעיל
- [ ] כל ההצהרות מופיעות באתר
- [ ] תרגום מלא לעברית
- [ ] RTL עובד בכל העמודים

---

## פתרון בעיות נפוצות

### שגיאה: "Missing Supabase environment variables"
- ודא שהעתקת נכון את המפתחות מ-Supabase
- בדוק שאין רווחים מיותרים ב-`.env`

### שגיאה: "Authentication failed"
- ודא שה-RLS policies הורצו
- בדוק ש-Email Provider מופעל ב-Supabase

### לא יכול ליצור פרסומים
- ודא שהמשתמש בסטטוס `verified_volunteer` או `admin`
- בדוק את ה-role בטבלת `profiles`

### שגיאת CORS ב-production
- ודא ש-`BASE_URL` ב-`.env` תואם ל-URL האמיתי
- בדוק את הגדרות CORS ב-`server/index.js`

---

## תמיכה ועדכונים

לשאלות ובעיות טכניות, פנה למפתח הפלטפורמה.

**זכור:** הפלטפורמה אינה קשורה רשמית למגן דוד אדום.
