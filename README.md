# ברשותי (Birshuti)

פלטפורמה למתנדבי מגן דוד אדום לשיתוף ציוד חירום ורפואי אישי.

## ⚠️ הצהרה חשובה

פלטפורמה זו **אינה קשורה רשמית** למגן דוד אדום. כל העברת ציוד היא בהסכמה פרטית בין משתמשים. המשתמשים אחראים באופן בלעדי לעמידה בתקנות וכללי מד״א.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Frontend**: HTML5, CSS3 (RTL), Vanilla JavaScript
- **Deployment**: Render

## Setup Instructions

### 1. Clone the repository

```bash
git clone [repository-url]
cd Birshuti
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project details.

### 4. Set up Supabase

1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Run the RLS policies from `database/rls-policies.sql`
4. Create the first admin user using `database/create-admin.sql`

### 5. Run the application

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
Birshuti/
├── public/          # Static files (CSS, JS, images)
├── views/           # HTML pages
├── server/          # Backend code
│   ├── routes/      # API routes
│   └── middleware/  # Authentication & authorization
├── database/        # SQL schemas and migrations
└── .env            # Environment variables (not in git)
```

## Deployment on Render

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy using the build command: `npm install`
4. Start command: `npm start`

## Security

- All secrets are stored in environment variables
- Row Level Security (RLS) enabled on all tables
- Role-based access control (RBAC) enforced server-side
- No document uploads (privacy by design)
- HTTPS enforced in production

## License

This is a volunteer-driven community project.
