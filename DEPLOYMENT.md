# 🚀 ברשותי - מדריך Deployment מלא

## סקירה כללית

מדריך זה מכסה את כל השלבים הנדרשים להפעלת הפלטפורמה בסביבת production על Render.

---

## שלב 1: הכנת Supabase

### 1.1 יצירת פרויקט

1. היכנס ל-https://supabase.com והתחבר
2. לחץ "New Project"
3. מלא פרטים:
   ```
   Name: birshuti
   Database Password: [סיסמה חזקה - שמור!]
   Region: Frankfurt (מומלץ לישראל)
   ```
4. המתן ל-provisioning (כ-2 דקות)

### 1.2 הרצת Database Schema

1. בפאנל Supabase, לחץ על "SQL Editor" (בתפריט צד)
2. לחץ "New Query"
3. העתק את **כל** התוכן של `database/schema.sql`
4. לחץ "Run" (או Ctrl+Enter)
5. ודא הודעת הצלחה: "Success. No rows returned"

### 1.3 הפעלת RLS Policies

1. באותו SQL Editor
2. New Query
3. העתק את **כל** התוכן של `database/rls-policies.sql`
4. Run
5. ודא הצלחה

### 1.4 קבלת API Keys

1. לחץ Settings → API
2. שמור את הערכים הבאים (תצטרך אותם בהמשך):
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (⚠️ סודי מאוד!)
   ```

---

## שלב 2: הכנת הקוד

### 2.1 Clone Repository

```bash
git clone [your-repo-url]
cd Birshuti
```

### 2.2 בדיקה מקומית (אופציונלי)

```bash
npm install
copy .env.example .env
# ערוך .env עם המפתחות מ-Supabase
npm start
# גש ל-http://localhost:3000
```

### 2.3 הכנה ל-Git

ודא שיש `.gitignore` ושהוא כולל:
```
node_modules/
.env
.env.local
*.log
```

Commit:
```bash
git add .
git commit -m "Production ready - Birshuti platform"
git push origin main
```

---

## שלב 3: יצירת Web Service ב-Render

### 3.1 חיבור Repository

1. היכנס ל-https://dashboard.render.com
2. לחץ "New +" → "Web Service"
3. חבר את GitHub account שלך
4. בחר את repository של Birshuti

### 3.2 הגדרות Service

מלא את השדות:

```
Name: birshuti
Region: Frankfurt (או קרוב לישראל)
Branch: main
Root Directory: (השאר ריק)
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free (לבדיקות) או Starter (לפרודקשן)
```

### 3.3 הוספת Environment Variables

לחץ "Advanced" → "Add Environment Variable"

הוסף את המשתנים הבאים:

| Key | Value | הסבר |
|-----|-------|------|
| `NODE_ENV` | `production` | סביבת ריצה |
| `PORT` | `3000` | (Render מגדיר אוטומטית) |
| `SUPABASE_URL` | `https://xxxxx.supabase.co` | מ-Supabase Settings → API |
| `SUPABASE_ANON_KEY` | `eyJhbG...` | anon key מ-Supabase |
| `SUPABASE_SERVICE_KEY` | `eyJhbG...` | service_role key (סודי!) |
| `SESSION_SECRET` | `[random-string]` | צור string אקראי חזק |
| `BASE_URL` | `https://your-app.onrender.com` | יתעדכן אחרי יצירת השירות |

**איך ליצור SESSION_SECRET חזק:**
```bash
# באמצעות Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Health Check

```
Health Check Path: /health
```

לחץ "Create Web Service"

---

## שלב 4: המתנה ל-Deploy

### 4.1 מעקב אחרי Build

- Render יתחיל ב-build אוטומטית
- תראה logs בזמן אמת
- Build לוקח בדרך כלל 2-3 דקות
- חפש "Build successful" ו-"Server running on port 3000"

### 4.2 קבלת URL

לאחר deploy מוצלח:
- URL יהיה זמין למעלה: `https://birshuti.onrender.com` (או שם שבחרת)
- עדכן את `BASE_URL` ב-Environment Variables ל-URL זה
- Render יעשה deploy אוטומטי נוסף

---

## שלב 5: יצירת משתמש מנהל ראשון

### אופציה 1: דרך האתר (מומלץ)

1. גש ל-`https://your-app.onrender.com/register`
2. הירשם:
   ```
   שם מלא: מנהל ראשי
   אימייל: admin@birshuti.local
   סיסמה: 240397Sm!
   מרחב: דן
   ✅ סמן "מתנדב פעיל במד״א"
   ```
3. לאחר הרשמה, גש ל-Supabase → SQL Editor
4. הרץ:
   ```sql
   UPDATE profiles 
   SET role = 'admin'
   WHERE email = 'admin@birshuti.local';
   ```
5. התנתק והתחבר שוב
6. עכשיו תראה "פאנל ניהול" בתפריט

### אופציה 2: SQL ישיר

ראה הוראות מפורטות ב-`database/create-admin.sql`

---

## שלב 6: בדיקת הפלטפורמה

### 6.1 בדיקות פונקציונליות

- [ ] דף הבית נטען (עברית, RTL)
- [ ] הרשמה עובדת
- [ ] התחברות עובדת
- [ ] Dashboard נטען
- [ ] יצירת פרסום (למתנדבים מאומתים)
- [ ] צפייה בפרסומים
- [ ] פאנל ניהול (למנהלים)
- [ ] אישור מתנדבים
- [ ] יומן פעולות

### 6.2 בדיקות אבטחה

- [ ] לא ניתן לגשת לדפים מוגנים ללא התחברות
- [ ] משתמש רגיל לא רואה פרסומים למתנדבים בלבד
- [ ] משתמש רגיל לא יכול ליצור פרסומים
- [ ] לא-מנהל לא יכול לגשת לפאנל ניהול
- [ ] HTTPS עובד (מנעול ירוק בדפדפן)

### 6.3 בדיקות מובייל

- [ ] האתר responsive
- [ ] RTL עובד במובייל
- [ ] טפסים ניתנים למילוי
- [ ] ניווט נוח

---

## שלב 7: הגדרות נוספות (אופציונלי)

### 7.1 Custom Domain

1. ב-Render Dashboard → Settings → Custom Domain
2. לחץ "Add Custom Domain"
3. הזן את הדומיין שלך
4. עדכן DNS records אצל רשם הדומיינים
5. עדכן `BASE_URL` ב-Environment Variables

### 7.2 Auto-Deploy

ב-Render Settings:
- Auto-Deploy: Yes (deploy אוטומטי על כל push)
- או: No (deploy ידני בלבד)

### 7.3 Notifications

הגדר התראות ב-Render:
- Deploy success/failure
- Error alerts
- Downtime notifications

---

## שלב 8: Monitoring & Maintenance

### 8.1 Logs

ב-Render Dashboard → Logs:
- ראה logs בזמן אמת
- חפש שגיאות
- עקוב אחרי ביצועים

### 8.2 Metrics

ב-Render Dashboard → Metrics:
- CPU usage
- Memory usage
- Request count
- Response times

### 8.3 Backups

**Supabase:**
- Backups אוטומטיים (תלוי בתוכנית)
- ניתן לייצא database manually:
  - Settings → Database → Connection string
  - השתמש ב-pg_dump

---

## פתרון בעיות נפוצות

### "Application failed to respond"

**גורם:** השרת לא עולה
**פתרון:**
1. בדוק Logs ב-Render
2. ודא ש-Environment Variables מוגדרים נכון
3. בדוק ש-PORT לא hardcoded (Render מגדיר אוטומטית)

### "CORS error"

**גורם:** BASE_URL לא מעודכן
**פתרון:**
1. עדכן BASE_URL ב-Environment Variables
2. Redeploy

### "Database connection failed"

**גורם:** Supabase credentials שגויים
**פתרון:**
1. בדוק SUPABASE_URL ו-Keys
2. ודא שאין רווחים או תווים מיותרים
3. בדוק ש-RLS policies הופעלו

### "Cannot create listing"

**גורם:** משתמש לא verified_volunteer
**פתרון:**
1. בדוק role ב-Supabase → Table Editor → profiles
2. עדכן ל-verified_volunteer או admin

---

## שדרוג לפלאן בתשלום

### מתי לשדרג?

- יותר מ-50 משתמשים פעילים
- זמן תגובה איטי
- צריך custom domain
- צריך backups אוטומטיים

### Render Starter Plan ($7/month)

- 512MB RAM
- No sleep (Free plan ישן אחרי 15 דקות חוסר פעילות)
- Custom domains
- Auto-scaling

### Supabase Pro ($25/month)

- 8GB database
- 50GB bandwidth
- Daily backups
- Priority support

---

## Checklist סופי לפני Production

- [ ] כל הבדיקות עברו בהצלחה
- [ ] משתמש מנהל נוצר
- [ ] `.env` לא ב-Git
- [ ] HTTPS פעיל
- [ ] Rate limiting עובד
- [ ] הצהרות מופיעות בכל המקומות
- [ ] תרגום מלא לעברית
- [ ] RTL תקין
- [ ] Monitoring מוגדר
- [ ] יש תוכנית recovery במקרה של בעיה

---

## תמיכה

לבעיות טכניות:
1. בדוק Logs ב-Render
2. בדוק Tables ב-Supabase
3. עיין ב-SECURITY.md
4. צור issue ב-GitHub (אם רלוונטי)

**זכור:** הפלטפורמה אינה קשורה רשמית למגן דוד אדום.

---

## מזל טוב! 🎉

הפלטפורמה שלך פעילה ב-production!

URL: https://your-app.onrender.com
משתמש מנהל: admin@birshuti.local / 240397Sm!

**צעדים הבאים:**
1. שנה את סיסמת המנהל
2. הזמן משתמשים להירשם
3. אשר מתנדבים ראשונים
4. עקוב אחרי שימוש ופידבקים
