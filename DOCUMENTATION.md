# 📚 ברשותי - תיעוד מלא של הפרויקט

## סקירה כללית

**ברשותי** היא פלטפורמה קהילתית למתנדבי מגן דוד אדום בישראל, המאפשרת שיתוף, החלפה, השאלה ומסירה של ציוד חירום ורפואי אישי בין מתנדבים.

### מאפיינים עיקריים

✅ **פלטפורמה קהילתית** - לא קשורה רשמית למד״א  
✅ **אימות מתנדבים** - תהליך אישור מבוסס שיקול דעת  
✅ **ניהול תפקידים** - RBAC מתקדם (User, Pending, Verified, Admin)  
✅ **Hebrew RTL-first** - עיצוב ייעודי לעברית, לא flip פשוט  
✅ **אבטחה מקסימלית** - RLS, JWT, Rate limiting, no document uploads  
✅ **Mobile-first** - responsive מלא  
✅ **Production-ready** - ניתן ל-deploy על Render מיד  

---

## ארכיטקטורה טכנית

### Stack טכנולוגי

```
Frontend:
- HTML5, CSS3 (RTL-first custom design)
- Vanilla JavaScript (no frameworks)
- Hebrew fonts: Assistant

Backend:
- Node.js 18+
- Express.js 4.x
- Security: Helmet, CORS, Rate Limiting

Database & Auth:
- Supabase (PostgreSQL + Auth)
- Row Level Security (RLS)
- JWT authentication

Deployment:
- Render (Web Service)
- Environment-based configuration
```

### מבנה הפרויקט

```
Birshuti/
├── database/               # SQL schemas and policies
│   ├── schema.sql         # Database structure
│   ├── rls-policies.sql   # Security policies
│   └── create-admin.sql   # Admin creation
│
├── server/                # Backend code
│   ├── index.js          # Express server
│   ├── supabase.js       # Supabase client
│   ├── middleware/       # Auth, RBAC, Validation
│   └── routes/           # API endpoints
│
├── public/               # Static assets
│   ├── css/
│   │   └── main.css     # RTL-first styles
│   └── js/
│       └── app.js       # API service & helpers
│
├── views/                # HTML pages
│   ├── home.html        # Homepage (NOT login!)
│   ├── register.html    # Registration
│   ├── login.html       # Login
│   ├── dashboard.html   # User dashboard
│   ├── listings.html    # Browse listings
│   ├── create-listing.html
│   └── admin.html       # Admin panel
│
├── .env.example         # Environment template
├── .gitignore          # Git exclusions
├── package.json        # Dependencies
├── render.yaml         # Render config
├── README.md           # Project overview
├── SETUP.md            # Setup instructions
├── DEPLOYMENT.md       # Deploy guide
└── SECURITY.md         # Security checklist
```

---

## מודל מסד הנתונים

### טבלאות עיקריות

#### `profiles`
```sql
- id (UUID, FK to auth.users)
- email (TEXT, UNIQUE)
- full_name (TEXT)
- phone (TEXT, optional)
- merhav (TEXT) - אזור: ירדן, גלבוע, אשר...
- role (ENUM) - user | pending_volunteer | verified_volunteer | admin
- volunteer_declaration (BOOLEAN)
- approved_at (TIMESTAMPTZ)
- approved_by (UUID, FK to profiles)
- created_at, updated_at
```

#### `listings`
```sql
- id (UUID)
- owner_id (UUID, FK to profiles)
- title (TEXT)
- description (TEXT)
- category (TEXT) - חולצות, מעילים, פליזים...
- transaction_type (ENUM) - מסירה | השאלה | החלפה
- merhav (TEXT)
- is_available (BOOLEAN)
- volunteer_only (BOOLEAN) - רק למתנדבים מאומתים
- created_at, updated_at
```

#### `equipment_categories`
```sql
- id (UUID)
- name_he (TEXT) - שם בעברית
- icon (TEXT)
- sort_order (INTEGER)
```

#### `audit_log`
```sql
- id (UUID)
- admin_id (UUID, FK to profiles)
- action (TEXT) - approve_volunteer, promote_admin...
- target_user_id (UUID)
- details (JSONB)
- created_at
```

### Row Level Security (RLS)

**profiles:**
- כולם יכולים לקרוא פרופילים ציבוריים
- משתמשים יכולים לערוך רק את עצמם (לא role)
- רק admins יכולים לשנות roles

**listings:**
- פרסומים ציבוריים - כולם רואים
- פרסומים למתנדבים - רק verified_volunteer ו-admin
- יצירה - רק verified_volunteer ו-admin
- עריכה/מחיקה - בעלים או admin

**audit_log:**
- קריאה - רק admins
- כתיבה - רק admins

---

## זרימות עבודה (Workflows)

### 1. רישום והרשמה

```
User → Homepage (קורא disclaimers)
  ↓
User → Registration page
  ↓
מלא פרטים:
  - שם, אימייל, סיסמה
  - מרחב
  - ☐ מתנדב פעיל במד״א (אופציונלי)
  ↓
אם לא סימן מתנדב:
  → role = 'user'
  → יכול לצפות בפרסומים ציבוריים
  → לא יכול ליצור פרסומים

אם סימן מתנדב:
  → role = 'pending_volunteer'
  → רואה הנחיות ליצירת קשר עם מנהל
  → לא יכול ליצור פרסומים עד אישור
```

### 2. אימות מתנדב (Volunteer Approval)

```
Pending Volunteer → מקבל הנחיות לפנות למנהל
  ↓
(קשר פרטי מחוץ למערכת - WhatsApp/טלפון)
  ↓
Admin → פאנל ניהול → ממתינים לאישור
  ↓
Admin מחליט:
  - אישור → role = 'verified_volunteer'
  - דחייה → role = 'user', volunteer_declaration = false
  ↓
Verified Volunteer:
  - יכול ליצור פרסומים
  - רואה פרסומים למתנדבים בלבד
  - גישה מלאה לפלטפורמה
```

### 3. יצירת פרסום

```
Verified Volunteer → Dashboard → "פרסם ציוד חדש"
  ↓
מלא פרטים:
  - כותרת
  - קטגוריה
  - סוג עסקה (מסירה/השאלה/החלפה)
  - מרחב
  - תיאור
  - ☐ למתנדבים בלבד (אופציונלי)
  ↓
שמירה → הפרסום מופיע ברשימת הפרסומים
  ↓
אם volunteer_only = true:
  - רק verified_volunteer ו-admin רואים
אחרת:
  - כל משתמש מחובר רואה
```

### 4. ניהול (Admin)

```
Admin → פאנל ניהול
  ↓
סטטיסטיקות:
  - סה״כ משתמשים
  - ממתינים לאישור
  - מתנדבים מאומתים
  - פרסומים פעילים
  ↓
ניהול משתמשים:
  - אישור/דחיית מתנדבים
  - קידום למנהל
  - הורדה מניהול
  ↓
יומן פעולות:
  - כל פעולות המנהלים נרשמות
  - audit trail מלא
```

---

## API Endpoints

### Authentication (`/api/auth`)

```
POST   /api/auth/register        - הרשמה
POST   /api/auth/login           - התחברות
POST   /api/auth/logout          - התנתקות
GET    /api/auth/me              - פרופיל נוכחי
PATCH  /api/auth/profile         - עדכון פרופיל
```

### Listings (`/api/listings`)

```
GET    /api/listings             - כל הפרסומים (עם סינון)
GET    /api/listings/:id         - פרסום ספציפי
POST   /api/listings             - יצירת פרסום (verified only)
PATCH  /api/listings/:id         - עדכון פרסום (owner/admin)
DELETE /api/listings/:id         - מחיקת פרסום (owner/admin)
GET    /api/listings/my/listings - הפרסומים שלי
```

### Admin (`/api/admin`)

```
GET    /api/admin/stats                    - סטטיסטיקות
GET    /api/admin/pending-volunteers       - ממתינים לאישור
GET    /api/admin/users                    - כל המשתמשים
POST   /api/admin/approve-volunteer/:id    - אישור מתנדב
POST   /api/admin/reject-volunteer/:id     - דחיית מתנדב
POST   /api/admin/promote-admin/:id        - קידום למנהל
POST   /api/admin/demote-admin/:id         - הורדה מניהול
GET    /api/admin/audit-log                - יומן פעולות
```

---

## אבטחה (Security)

### שכבות הגנה

1. **Environment Variables** - כל הסודות ב-`.env`, לא בקוד
2. **JWT Authentication** - אימות על כל בקשה
3. **Role-Based Access Control** - בדיקת תפקיד server-side
4. **Row Level Security** - אכיפה ברמת ה-DB
5. **Rate Limiting** - הגבלת בקשות
6. **Input Validation** - ולידציה server + client
7. **Security Headers** - Helmet.js
8. **HTTPS Only** - אכיפה ב-production
9. **No Document Uploads** - אין אפשרות להעלות קבצים (privacy by design)
10. **Audit Logging** - תיעוד כל פעולות מנהלים

### Threat Mitigation

| איום | הגנה |
|------|------|
| SQL Injection | Supabase prepared statements + RLS |
| XSS | CSP headers, input sanitization |
| CSRF | Token validation |
| Brute Force | Rate limiting (5 attempts/15min) |
| Unauthorized Access | JWT + server-side role checks |
| Data Leaks | No sensitive data storage, RLS |
| Session Hijacking | HTTPS, secure tokens, short expiry |

---

## RTL Design Guidelines

### עקרונות עיצוב

1. **Not Just `direction: rtl`** - עיצוב ייעודי, לא flip
2. **Hebrew Fonts** - Assistant, Rubik, Heebo
3. **Logical Properties** - margin-inline-start במקום margin-left
4. **Component-specific RTL** - כל component מתוכנן ל-RTL
5. **Icons & Buttons** - מיקום מותאם (סגירה בצד שמאל)
6. **Forms** - labels מימין, alignment נכון
7. **Tables** - text-align: right
8. **Navigation** - מימין לשמאל

### Color Palette (NO PURPLE!)

```
Primary:   #1e3a5f (Deep Blue) - אמון, רפואי
Secondary: #2d9687 (Teal) - רוגע, מקצועי
Accent:    #e8954a (Warm Orange) - action, דחיפות
Success:   #4caf50 (Green)
Warning:   #ff9800 (Amber)
Error:     #d32f2f (Red)
```

---

## הצהרות משפטיות (Disclaimers)

### מיקומים נדרשים

1. **Homepage** - בולט, בתיבה צהובה עם ⚠️
2. **Registration** - לפני הטופס
3. **Dashboard** - למשתמשים pending
4. **Footer** - בכל עמוד

### תוכן ההצהרות

```
⚠️ הצהרות חשובות:
• פלטפורמה זו אינה קשורה רשמית למגן דוד אדום
• כל העברת ציוד היא בהסכמה פרטית בין משתמשים
• הפלטפורמה אינה מאמתת תקינות או התאמה רפואית של ציוד
• המשתמשים אחראים באופן בלעדי לעמידה בתקנות וכללי מד״א
• לא ניתנת כל ייעוץ רפואי או מבצעי
```

---

## הוראות שימוש

### למשתמש חדש

1. גש לדף הבית וקרא על הפלטפורמה
2. לחץ "הרשמה"
3. מלא פרטים
4. אם מתנדב פעיל - סמן את התיבה
5. לאחר ההרשמה:
   - אם סימנת מתנדב: פנה למנהל לאימות
   - אחרת: גש לצפייה בפרסומים

### למתנדב מאומת

1. לאחר אישור, גש ל-Dashboard
2. לחץ "פרסם ציוד חדש"
3. מלא פרטי הציוד
4. בחר אם רק למתנדבים או לכולם
5. שמור
6. הפרסום יופיע ברשימה

### למנהל

1. גש לפאנל ניהול
2. **ממתינים לאישור:**
   - עבור על הרשימה
   - אשר/דחה לפי שיקול דעת
3. **ניהול משתמשים:**
   - חפש משתמשים
   - קדם למנהל במידת הצורך
4. **יומן פעולות:**
   - עקוב אחרי שינויים
   - ודא שאין פעולות חשודות

---

## תחזוקה שוטפת

### יומי

- בדיקת Logs ב-Render
- מעקב אחרי errors

### שבועי

- בדיקת הרשמות חדשות
- אישור מתנדבים ממתינים
- סקירת יומן פעולות

### חודשי

- `npm audit fix` - עדכון תלויות
- בדיקת ביצועים
- סקירת backups

### רבעוני

- ביקורת אבטחה מלאה
- סקירת permissions
- עדכון documentation

---

## טיפים לפיתוח עתידי

### תכונות מומלצות להוספה

1. **מערכת הודעות** - צ׳אט פנימי בין משתמשים
2. **התראות** - email/SMS על פרסומים חדשים
3. **תמונות** - העלאת תמונות לפרסומים (S3/Cloudinary)
4. **דירוגים** - משוב על עסקאות
5. **סינון מתקדם** - גודלים, מצב, וכו׳
6. **סטטיסטיקות** - dashboards למנהלים
7. **Export Data** - ייצוא דוחות
8. **Multi-language** - תמיכה באנגלית

### שיפורים טכניים

1. **Frontend Framework** - React/Vue לחוויה טובה יותר
2. **Real-time** - WebSockets להודעות
3. **Search** - Elasticsearch לחיפוש מתקדם
4. **CDN** - Cloudflare לביצועים
5. **Monitoring** - Sentry לזיהוי שגיאות
6. **Analytics** - Google Analytics / Plausible
7. **Testing** - Jest, Playwright לבדיקות אוטומטיות
8. **CI/CD** - GitHub Actions לאוטומציה

---

## קבצים חשובים לקריאה

| קובץ | מטרה |
|------|------|
| `README.md` | סקירה כללית ומבנה פרויקט |
| `SETUP.md` | הוראות התקנה והפעלה מקומית |
| `DEPLOYMENT.md` | מדריך deploy מפורט ל-Render |
| `SECURITY.md` | checklist אבטחה ובדיקות |
| `database/schema.sql` | מבנה הטבלאות |
| `database/rls-policies.sql` | מדיניות אבטחה |
| `database/create-admin.sql` | יצירת מנהל ראשון |

---

## תמיכה ויצירת קשר

לבעיות טכניות:
1. בדוק את ה-Logs
2. עיין ב-documentation
3. בדוק issues קיימים
4. פתח issue חדש

**זכור תמיד:**  
פלטפורמה זו אינה קשורה רשמית למגן דוד אדום.  
כל העברת ציוד היא באחריות המשתמשים בלבד.

---

## רישיון

פרויקט קהילתי למתנדבי מד״א.

---

**גרסה:** 1.0.0  
**תאריך:** דצמבר 2025  
**סטטוס:** Production Ready ✅
