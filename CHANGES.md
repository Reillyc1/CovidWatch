# CovidWatch - Changes and Improvements

This document explains all the changes made to polish the CovidWatch application in simple, non-technical terms.

---

## Summary

CovidWatch is a COVID-19 contact tracing web application that allows users to check into venues, and venue managers to generate unique check-in codes. The application was improved to fix bugs, add security features, and polish the user interface.

---

## What Was Fixed

### 1. Broken Features That Now Work

**Venue Code Generator (Manager Dashboard)**
- *Before:* The code that generates unique venue codes was broken and wouldn't run.
- *After:* Venue managers can now click a button to generate a random 6-character code (like "AbC123") to display at their venue entrance.

**Venue Capacity Calculator (Manager Dashboard)**
- *Before:* The calculator existed but didn't actually calculate anything.
- *After:* Managers can enter their venue's floor space (in square meters), and the app calculates how many people can safely fit based on COVID guidelines (4 square meters per person).

**Logout Button**
- *Before:* Sometimes clicking "Logout" wouldn't actually log you out because the app tried to redirect you before finishing the logout process.
- *After:* The app now waits until you're properly logged out before redirecting you home.

**Check-in History**
- *Before:* The history page would show everyone's check-ins, not just yours.
- *After:* You now only see your own check-in history (privacy fix).

**Map Markers**
- *Before:* There was a typo in the code that prevented map markers from loading.
- *After:* The code now works correctly and can display COVID hotspot markers on the map.

---

## Security Improvements

These changes protect user data and prevent common hacking attempts:

### 2. Password & Login Security

**What we did:**
- Passwords are hashed using bcrypt with salt (industry standard) before being stored, so even if someone accessed the database, they couldn't read your actual password.
- Strong password requirements: minimum 8 characters with at least one uppercase letter, lowercase letter, and number.
- The app uses "parameterized queries" which is a technique that prevents hackers from injecting malicious code through login forms (called "SQL injection").
- Login error messages are generic ("Invalid username or password") so hackers can't figure out which part was wrong.
- Automatic password hash upgrade: legacy passwords are automatically upgraded to bcrypt when users log in.

**Why it matters:** These are industry-standard practices that protect your account from being compromised.

### 3. Rate Limiting

**What we did:**
- Added rate limiting to prevent brute-force attacks:
  - Authentication endpoints (login/signup): 5 attempts per 15 minutes
  - General API endpoints: 100 requests per 15 minutes
  - Write operations (check-ins, adding markers): 30 requests per 15 minutes
- Rate limits are tracked by IP address and user ID for comprehensive protection.
- Graceful 429 (Too Many Requests) responses with retry information.

**Why it matters:** This prevents attackers from rapidly guessing passwords or overwhelming the server with requests.

### 4. Session Security

**What we did:**
- Added session expiration (24 hours) so if you forget to log out, you're automatically logged out after a day.
- Made session cookies "HTTP-only" which means hackers can't steal your login session using malicious JavaScript code.
- Added strict SameSite cookie policy for strong CSRF protection.
- Changed the default session cookie name to prevent fingerprinting.
- Secure cookies are enforced in production (HTTPS only).

**Why it matters:** These features prevent common attacks that could let someone else access your account.

### 5. Input Validation & Sanitization

**What we did:**
- Schema-based input validation using express-validator for all user inputs.
- Type checking ensures inputs are the correct data type.
- Length limits prevent overly long inputs that could cause issues.
- Unexpected fields are rejected (parameter pollution prevention).
- Input sanitization removes potentially dangerous characters.
- The app checks that:
  - Usernames: 3-30 characters, letters, numbers, and underscores only
  - Email addresses: valid format, max 254 characters
  - Passwords: minimum 8 characters with complexity requirements
  - Check-in codes: 4-10 alphanumeric characters
  - Coordinates: valid longitude (-180 to 180) and latitude (-90 to 90)
  - Dates: valid format, not in the future, not more than 30 days old

**Why it matters:** This prevents users from accidentally or intentionally entering bad data that could break the system or exploit security vulnerabilities.

### 6. Role-Based Access Control

**What we did:**
- Only managers and admins can add map markers (hotspots).
- Different user types are directed to appropriate dashboards.
- Server-side role verification on all protected endpoints.

**Why it matters:** This ensures users can only access features appropriate to their role.

### 7. Sensitive Data Protection

**What we did:**
- Created a comprehensive configuration file (`.env.example`) that shows what settings are needed without revealing actual passwords or secret keys.
- Session secret is required and validated at startup (fails in production if not set).
- Mapbox API token is fetched from server-side and delivered only to authenticated users.
- Added a `.gitignore` file that ensures sensitive configuration files aren't accidentally shared when the code is uploaded to GitHub.
- Moved database passwords and secret keys out of the code itself into environment variables.

**Why it matters:** This prevents sensitive information like database passwords and API keys from being accidentally exposed.

### 8. Security Headers (Helmet & CSP)

**What we did:**
- Implemented comprehensive security headers using Helmet.js:
  - Content Security Policy (CSP): Controls which resources can be loaded
  - X-Content-Type-Options: Prevents MIME type sniffing
  - X-Frame-Options: Prevents clickjacking attacks
  - X-XSS-Protection: Enables browser's XSS filter
  - Strict-Transport-Security: Enforces HTTPS in production
  - Referrer-Policy: Controls referrer information
- CSP is configured to allow Mapbox and Font Awesome CDN resources while blocking everything else.

**Why it matters:** These headers significantly reduce the risk of common web attacks like XSS and clickjacking.

### 9. Request Size Limits

**What we did:**
- Limited JSON and URL-encoded body sizes to 10KB.

**Why it matters:** This prevents denial-of-service attacks using oversized requests.

---

## User Interface Improvements

### 10. Consistent Design

**What we did:**
- All pages now use the same colors, fonts, and button styles.
- Created a unified color scheme (dark blue headers, light gray backgrounds, blue accent color).
- All forms have the same layout and feel.
- Error messages and success messages are now clear and helpful.

**Why it matters:** A consistent design looks more professional and makes the app easier to use.

### 11. Better Forms

**What we did:**
- Login and signup forms now have clear labels with icons.
- Form fields show helpful placeholder text explaining what to enter.
- Password confirmation field added to signup to prevent typos.
- Account type selection (User vs Venue Manager) now uses clear visual cards.

**Why it matters:** Users can now easily understand what information they need to enter.

### 12. Improved Dashboard Pages

**What we did:**
- User and Manager dashboards now have organized sections with clear headings.
- Check-in history is displayed in a proper table format.
- The venue code generator has a prominent display for the generated code.
- The capacity calculator shows results clearly.

**Why it matters:** Users can find and use features more easily.

### 13. Mobile-Friendly Design

**What we did:**
- Added "responsive" CSS that adjusts the layout for smaller screens.
- Forms stack vertically on mobile phones instead of being side-by-side.
- Buttons and input fields are sized appropriately for touch screens.

**Why it matters:** The app works well on phones and tablets, not just desktop computers.

---

## Code Quality Improvements

### 14. Documentation

**What we did:**
- Added comments throughout the code explaining what each section does.
- Security-related code has explanations of why certain choices were made.
- Created this changes document.

**Why it matters:** Future developers (or you, reviewing later) can understand the code and the reasoning behind decisions.

### 15. Error Handling

**What we did:**
- The app now properly handles errors instead of crashing.
- Users see friendly error messages instead of technical jargon.
- In production mode, detailed error information is hidden from users (security best practice).
- Rate limit exceeded returns helpful retry information.

**Why it matters:** The app is more stable and doesn't expose sensitive information when something goes wrong.

### 16. Database Improvements

**What we did:**
- Upgraded from mysql to mysql2 package for better MySQL 8+ compatibility.
- Added indexes to the check_ins table for better query performance.
- Added mapmarkers table for COVID hotspot tracking.

**Why it matters:** Better database compatibility and performance.

---

## Files Changed

| File | What Changed |
|------|--------------|
| `app.js` | Added Helmet, rate limiting, security middleware, body size limits |
| `middleware/security.js` | New file - rate limiting and input sanitization |
| `middleware/validation.js` | New file - schema-based input validation |
| `routes/index.js` | Added role-based auth, secure Mapbox token endpoint, validation |
| `routes/users.js` | bcrypt password hashing, rate limiting, validation, removed debug route |
| `public/javascripts/manager.js` | Completely rewritten - now works properly |
| `public/javascripts/home.js` | Fixed bugs, added XSS protection |
| `public/javascripts/login.js` | Fixed logout race condition |
| `public/javascripts/signup.js` | Added strong password validation |
| `public/index.html` | Secure Mapbox token loading |
| `public/login.html` | Redesigned form layout |
| `public/signup.html` | Redesigned form with better account type selection |
| `public/user.html` | New dashboard layout |
| `public/manager.html` | New dashboard layout with working features |
| `public/stylesheets/*.css` | All stylesheets updated with consistent design |
| `package.json` | Added security dependencies (helmet, bcrypt, express-rate-limit, express-validator) |
| `.env.example` | Comprehensive configuration template |
| `.gitignore` | Prevents sensitive files from being shared |
| `covidwatch.sql` | Added mapmarkers table, fixed check_in_code column size |

---

## How to Run the Application

1. Copy `.env.example` to `.env` and fill in your configuration:
   - Database credentials
   - Session secret (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - Mapbox token (get from https://mapbox.com)
2. Run `npm install` to install dependencies
3. Make sure MySQL is running with the `covidwatch` database (import `covidwatch.sql`)
4. Run `npm start` to start the server
5. Open `http://localhost:3000` in your browser

---

## Technologies Demonstrated

This project demonstrates knowledge of:

- **Node.js** - Server-side JavaScript runtime
- **Express.js** - Web application framework
- **MySQL** - Relational database management
- **bcrypt** - Industry-standard password hashing
- **Helmet.js** - Security headers middleware
- **express-rate-limit** - Rate limiting for API protection
- **express-validator** - Schema-based input validation
- **HTML5/CSS3** - Modern web standards and responsive design
- **OWASP Best Practices** - Secure coding guidelines
- **AJAX** - Asynchronous data loading

---

## Security Checklist (OWASP Compliance)

| Vulnerability | Protection Implemented |
|--------------|----------------------|
| SQL Injection | Parameterized queries |
| XSS (Cross-Site Scripting) | CSP headers, output escaping, input validation |
| CSRF (Cross-Site Request Forgery) | SameSite cookies |
| Broken Authentication | bcrypt hashing, rate limiting, session management |
| Sensitive Data Exposure | Environment variables, secure cookies, HTTPS enforcement |
| Security Misconfiguration | Helmet headers, production error hiding |
| Insufficient Logging | Console error logging |
| Brute Force Attacks | Rate limiting on auth endpoints |

---

*This document was created to explain technical changes in plain language for portfolio/resume purposes.*
