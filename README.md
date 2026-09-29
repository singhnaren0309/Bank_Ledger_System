# Bank_Ledger_System

A simple banking web application backend built with Node.js, Express, and MongoDB. It handles user authentication, basic banking transactions (deposits, transfers), and sends out email notifications using Nodemailer. It also uses EJS for server-side rendered views.

## Features
- User registration & login (JWT auth)
- View account balance and transaction history
- Fund transfers between accounts
- Email notifications for logins, registrations, and transactions (success/failure)
- Cookie-based session management

## Tech Stack
- **Node.js & Express.js** - Server and routing
- **MongoDB & Mongoose** - Database and ODM
- **JWT & bcryptjs** - Authentication and password hashing
- **Nodemailer** - Email service configured with Google OAuth2
- **EJS** - Templating engine

## Local Setup

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd Bankify
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory based on the following template:

   ```env
   MONGO_URI="mongodb://localhost:27017/bank_backend"
   JWT_SECRET=your_super_secret_jwt_key
   PORT=3000

   # Nodemailer Google OAuth2 setup
   CLIENT_ID=your_google_client_id
   CLIENT_SECRET=your_google_client_secret
   REFRESH_TOKEN=your_google_refresh_token
   EMAIL_USER=your_email@gmail.com
   ```
   *(Note: You need to set up OAuth2 in the Google Cloud Console to get the client ID, secret, and refresh token for the email service to work.)*

4. **Run the server:**
   Make sure MongoDB is running locally (or update the URI to a cloud instance).
   
   For development (uses nodemon):
   ```bash
   npm run dev
   ```
   For production:
   ```bash
   npm start
   ```

   The app should now be running on `http://localhost:3000`.

## License
ISC
