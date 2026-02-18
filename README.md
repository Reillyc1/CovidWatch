# CovidWatch

A contact tracing web app built with Node.js and Express. Users can check into venues using unique codes, and venue managers can generate those codes and track capacity.

## Features

- User registration and login
- Venue check-in with unique codes
- Check-in history tracking
- Interactive COVID hotspot map (Mapbox)
- Venue manager dashboard with code generator and capacity calculator
- Role-based access (users, managers, admins)

## Tech Stack

- **Backend:** Node.js, Express.js, MySQL
- **Frontend:** Vanilla JS, HTML5, CSS3
- **Security:** bcrypt, Helmet, rate limiting, input validation

## Quick Start

```bash
# Install dependencies
npm install

# Set up your environment
cp .env.example .env
# Edit .env with your database credentials, session secret, and Mapbox token

# Import the database
mysql -u root -p < covidwatch.sql

# Run the app
npm start
```

Then open http://localhost:3000

## Environment Variables

Check `.env.example` for all required configuration. You'll need:
- MySQL database credentials
- A session secret (use `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` to generate one)
- A Mapbox public token (free at mapbox.com)

## Project Structure

```
├── app.js              # Express app setup
├── routes/
│   ├── index.js        # Main routes (map, account)
│   └── users.js        # Auth routes (login, signup, check-in)
├── middleware/
│   ├── security.js     # Rate limiting
│   └── validation.js   # Input validation
├── public/             # Frontend files
└── covidwatch.sql      # Database schema
```

## License

MIT
