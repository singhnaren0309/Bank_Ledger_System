# Bank_Ledger_System

A simple banking web application backend built with Node.js, Express, and MongoDB. It handles user authentication, basic banking transactions (deposits, transfers), and sends out email notifications asynchronously via a Redis-backed message queue (BullMQ) using Nodemailer.

## Features
- User registration & login (JWT auth)
- View account balance and transaction history
- Atomic fund transfers between accounts eliminating race conditions
- Asynchronous email notifications for logins, registrations, and transactions (success/failure)
- Containerized environment (Docker & Docker Compose)

## Tech Stack
- **Node.js & Express.js** - Server and routing
- **MongoDB & Mongoose** - Database and ODM
- **Redis & BullMQ** - Message broker for async job processing
- **JWT & bcryptjs** - Authentication and password hashing
- **Nodemailer** - Email service configured with Google OAuth2
- **Docker** - Containerization and local orchestration

## Local Setup

### Using Docker (Recommended)

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd Bankify
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory based on the following template:

   ```env
   # Database & Cache (Defaults are configured for Docker)
   MONGO_URI="mongodb://mongo:27017/bank_backend"
   REDIS_URL="redis://redis:6379"
   PORT=3000
   
   # Authentication
   JWT_SECRET=your_super_secret_jwt_key

   # Nodemailer Google OAuth2 setup
   CLIENT_ID=your_google_client_id
   CLIENT_SECRET=your_google_client_secret
   REFRESH_TOKEN=your_google_refresh_token
   EMAIL_USER=your_email@gmail.com
   ```
   *(Note: You need to set up OAuth2 in the Google Cloud Console to get the client ID, secret, and refresh token for the email service to work.)*

3. **Run the stack:**
   ```bash
   docker-compose up --build
   ```
   The app (along with MongoDB and Redis) will start automatically. The API will be available at `http://localhost:3000`.

### Manual Setup (Without Docker)

If you prefer to run the application without Docker, ensure you have **MongoDB** and **Redis** running locally. 

1. Install dependencies:
   ```bash
   npm install
   ```
2. Update the `.env` file to point to your local instances:
   ```env
   MONGO_URI="mongodb://localhost:27017/bank_backend"
   REDIS_URL="redis://127.0.0.1:6379"
   ```
3. Run the server:
   ```bash
   npm run dev
   ```

## License
ISC
