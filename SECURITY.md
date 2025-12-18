# ==========================================
# Security Checklist
# ==========================================

## ✅ Pre-Deployment Security Checklist

### Environment & Secrets
- [ ] All secrets are in `.env` file (not committed)
- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded credentials in any file
- [ ] `SESSION_SECRET` is a strong random string
- [ ] Production environment variables set in Render

### Database Security (Supabase)
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] RLS policies tested and working
- [ ] Service role key never exposed to frontend
- [ ] Only anon key used in client-side code
- [ ] Database passwords are strong and secure

### Authentication & Authorization
- [ ] JWT tokens used for authentication
- [ ] Tokens validated on every protected endpoint
- [ ] Role checks enforced server-side
- [ ] No role-based logic on client side only
- [ ] Admin actions logged in audit_log table
- [ ] Password requirements enforced (8+ chars, mixed case, numbers)

### API Security
- [ ] Rate limiting enabled on auth endpoints (5 req/15min)
- [ ] Rate limiting enabled on API endpoints (100 req/min)
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (using Supabase client)
- [ ] XSS protection (CSP headers via Helmet)
- [ ] CORS properly configured

### HTTPS & Headers
- [ ] HTTPS enforced (automatic on Render)
- [ ] Helmet.js security headers configured
- [ ] Content-Security-Policy set
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Strict-Transport-Security header

### Privacy & Data Protection
- [ ] No document upload functionality
- [ ] No storage of volunteer IDs or personal documents
- [ ] User data minimal (only necessary fields)
- [ ] Phone numbers optional
- [ ] No tracking or analytics without consent

### Frontend Security
- [ ] No sensitive data in localStorage (only JWT token)
- [ ] Auth token checked and validated on every request
- [ ] Role checks performed server-side
- [ ] Forms validate input client and server side
- [ ] Error messages don't leak sensitive info

### Legal & Compliance
- [ ] Disclaimers visible on homepage
- [ ] Disclaimers on registration page
- [ ] Clear statement: "Not affiliated with MDA"
- [ ] No medical advice given
- [ ] User responsibility clearly stated
- [ ] Hebrew language throughout

### Code Quality
- [ ] No `console.log` with sensitive data in production
- [ ] Error handling on all async operations
- [ ] Graceful shutdown handlers (SIGTERM, SIGINT)
- [ ] Health check endpoint available
- [ ] Production logs don't expose secrets

### Deployment (Render)
- [ ] Environment variables set correctly
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Health check path: `/health`
- [ ] Auto-deploy on push disabled (manual control)

### Testing Before Production
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Dashboard accessible for all roles
- [ ] Listings creation (verified volunteers only)
- [ ] Listings viewing respects volunteer_only flag
- [ ] Admin panel accessible only to admins
- [ ] Volunteer approval flow works
- [ ] Role promotion/demotion works
- [ ] Audit log records admin actions
- [ ] Mobile responsive on all pages
- [ ] RTL works correctly throughout

---

## 🔴 Critical Security Reminders

1. **NEVER commit `.env` file**
2. **NEVER expose service role key to frontend**
3. **ALWAYS validate user roles server-side**
4. **ALWAYS use prepared statements (Supabase client does this)**
5. **ALWAYS log admin actions**
6. **NEVER trust client-side validation alone**
7. **ALWAYS use HTTPS in production (Render does this)**
8. **NEVER store passwords in plain text (Supabase handles this)**

---

## Regular Security Maintenance

### Weekly
- [ ] Check audit log for suspicious activity
- [ ] Review new user registrations

### Monthly
- [ ] Update npm dependencies: `npm audit fix`
- [ ] Review and rotate secrets if needed
- [ ] Check Supabase security advisories

### Quarterly
- [ ] Full security audit
- [ ] Password policy review
- [ ] Access control review

---

## Incident Response Plan

If security breach detected:

1. **Immediate**: Disable affected accounts
2. **Rotate**: Change all secrets and tokens
3. **Investigate**: Check audit logs and database
4. **Notify**: Inform affected users
5. **Fix**: Patch vulnerability
6. **Document**: Record incident and response

---

## Contact

For security issues, contact the platform administrator immediately.
Do not publicly disclose security vulnerabilities.
