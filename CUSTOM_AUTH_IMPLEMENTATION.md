# ✅ Custom Authentication Implementation

## מה השתנה?

המערכת **לא משתמשת יותר ב-Supabase Auth**. כעת יש לנו אימות מותאם אישית עם:

### ✅ סיסמאות מוצפנות במסד נתונים
- סיסמאות מאוחסנות עם **bcrypt hash** (10 rounds)
- אף פעם לא נשמרות בטקסט פשוט
- השוואה מאובטחת בעת התחברות

### ✅ JWT Tokens מותאמים אישית
- נוצרים בעת רישום/התחברות
- תוקף: 7 ימים
- חתומים עם SESSION_SECRET

### ✅ טבלה חדשה: `users`
במקום `profiles` שהיה מקושר ל-`auth.users`:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT NOT NULL, -- 🔒 bcrypt hash
    full_name TEXT,
    phone TEXT,
    merhav TEXT,
    role user_role,
    ...
);
```

## שינויים בקוד

### 1. Database Schema
- ✅ טבלת `users` עם `password_hash`
- ✅ טבלת `sessions` (אופציונלי - לניהול tokens)
- ✅ View של `profiles` לתאימות לאחור
- ✅ הסרת triggers של Supabase Auth

### 2. Backend Dependencies
```json
{
  "bcrypt": "^5.1.1",      // Password hashing
  "jsonwebtoken": "^9.0.2" // JWT generation
}
```

### 3. Auth Routes (`server/routes/auth.js`)
**Registration:**
```javascript
- Supabase Auth signup ❌
+ bcrypt.hash(password) ✅
+ INSERT INTO users ✅
+ jwt.sign(...) ✅
```

**Login:**
```javascript
- Supabase signInWithPassword ❌
+ SELECT FROM users WHERE username ✅
+ bcrypt.compare(password, hash) ✅
+ jwt.sign(...) ✅
```

### 4. Auth Middleware (`server/middleware/auth.js`)
```javascript
- supabase.auth.getUser(token) ❌
+ jwt.verify(token, JWT_SECRET) ✅
+ SELECT FROM users WHERE id ✅
```

## איך להשתמש

### התקנה חדשה:
```bash
# 1. Install dependencies
npm install

# 2. Run SQL in Supabase
database/drop-all.sql       # Clean slate
database/schema.sql          # Create users table with password_hash
database/rls-policies.sql   # Security policies

# 3. Start server
npm start

# 4. Register first user (becomes admin)
# Visit http://localhost:3000/register
# Username: admin
# Password: 240397Sm!

# 5. Promote to admin
# Run in Supabase SQL Editor:
UPDATE users SET role = 'admin' WHERE username = 'admin';
```

### Flow דוגמה:

**1. משתמש נרשם:**
```javascript
POST /api/auth/register
{
  "username": "yoni_cohen",
  "password": "MyPass123",
  "email": "yoni@example.com",
  "full_name": "יוני כהן",
  "merhav": "דן"
}

↓
Server: bcrypt.hash("MyPass123") → "$2b$10$abc..."
Server: INSERT INTO users (..., password_hash)
Server: jwt.sign({ userId, username, role })
↓
Response: { session: { access_token: "eyJ..." }, user: {...} }
```

**2. משתמש מתחבר:**
```javascript
POST /api/auth/login
{
  "username": "yoni_cohen",
  "password": "MyPass123"
}

↓
Server: SELECT * FROM users WHERE username = 'yoni_cohen'
Server: bcrypt.compare("MyPass123", stored_hash) → true ✅
Server: jwt.sign({ userId, username, role })
↓
Response: { session: { access_token: "eyJ..." }, user: {...} }
```

**3. בקשה מאומתת:**
```javascript
GET /api/listings
Headers: Authorization: Bearer eyJ...

↓
Middleware: jwt.verify(token) → { userId: "uuid..." }
Middleware: SELECT * FROM users WHERE id = 'uuid'
Middleware: req.user = user, req.profile = user
↓
Route: Access granted based on role
```

## אבטחה

### ✅ מה בסדר:
- סיסמאות מוצפנות עם bcrypt (10 rounds)
- JWT חתום עם secret חזק
- Password hash לעולם לא נחשף ב-API
- Middleware מוודא תוקף token
- RLS policies מאובטחות

### ⚠️ חשוב:
- **SESSION_SECRET** חייב להיות חזק בייצור
- החלף את הערך ב-.env
- אל תשתף את ה-SECRET
- JWT tokens תקפים ל-7 ימים (ניתן לשנות)

## מה לא השתנה?

- ✅ Frontend זהה (app.js, HTML forms)
- ✅ RLS policies (רק שם טבלה users במקום profiles)
- ✅ Role-based access control
- ✅ Admin panel
- ✅ All API endpoints

## Supabase עדיין משמש ל:

- ✅ PostgreSQL database
- ✅ RLS (Row Level Security)
- ✅ Real-time (אם נשתמש בעתיד)
- ❌ **לא Auth** - עכשיו מותאם אישית!

---

**סיכום:** המערכת כעת מנהלת אימות בעצמה, סיסמאות מוצפנות נשמרות במסד הנתונים, ואין תלות ב-Supabase Auth. 🔒✅
