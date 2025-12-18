# ✅ המרה להתחברות עם שם משתמש

## שינויים שבוצעו

### 1. Database Schema
✅ הוספת עמודת `username` לטבלת profiles  
✅ אילוץ ייחודיות על username  
✅ בדיקת פורמט: 3-20 תווים (אותיות אנגליות, מספרים, קו תחתון)  
✅ עדכון trigger handle_new_user()

### 2. Backend Updates
✅ `server/middleware/validation.js` - ולידציה לשם משתמש  
✅ `server/routes/auth.js`:
  - בדיקת זמינות שם משתמש ברישום
  - חיפוש email לפי username בהתחברות
  - אימות עם Supabase באמצעות email פנימי

### 3. Frontend Updates  
✅ `views/register.html`:
  - שדה שם משתמש חדש (מעל שם מלא)
  - הסבר: "אותיות אנגליות, מספרים וקו תחתון בלבד"
  - ולידציה client-side

✅ `views/login.html`:
  - שינוי משדה email לשדה username
  - הסבר ברור למשתמש

✅ `public/js/app.js`:
  - פונקציית login מקבלת username במקום email

### 4. Migration File
✅ `database/add-username-migration.sql` - לעדכון מסדי נתונים קיימים

## איך להשתמש

### התקנה חדשה (אין DB קיים):
1. הפעל `database/schema.sql` (כבר כולל username)
2. זהו! המערכת מוכנה

### עדכון DB קיים:
1. הפעל `database/add-username-migration.sql`
2. עדכן ידנית את שמות המשתמש הקיימים:
   ```sql
   UPDATE profiles SET username = 'desired_username' WHERE email = 'user@email.com';
   ```

## דוגמאות

### רישום משתמש חדש:
- שם משתמש: `yoni_cohen` ✅
- שם מלא: `יוני כהן`
- אימייל: `yoni@example.com` (רק לאימות)

### התחברות:
- שם משתמש: `yoni_cohen`
- סיסמה: `********`

## כללים לשם משתמש
- ✅ אורך: 3-20 תווים
- ✅ אותיות אנגליות: a-z, A-Z
- ✅ מספרים: 0-9
- ✅ קו תחתון: _
- ❌ אותיות עבריות
- ❌ רווחים
- ❌ תווים מיוחדים אחרים

## מה קורה מאחורי הקלעים?

1. המשתמש מזין username + password
2. השרת מחפש את ה-email המקושר ל-username
3. Supabase מאמת עם email + password
4. מוחזר token ופרופיל משתמש

זה נדרש כי Supabase Auth דורש email לאימות, אבל אנחנו רוצים username למשתמשים.

## בדיקות

הפעל את השרת:
```bash
npm start
```

נסה:
1. הרשמה עם שם משתמש חדש
2. התחברות עם שם המשתמש
3. וודא שהפרופיל נטען נכון

---

✅ **המערכת כעת משתמשת בשמות משתמש במקום אימיילים!**
