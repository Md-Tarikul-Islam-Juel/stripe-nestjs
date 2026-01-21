# Stripe NestJS API

A production-ready NestJS application with comprehensive Stripe payment integration and authentication system, built following Clean Architecture principles.

---

## 🎯 What is This?

This is a full-featured backend API that provides:

- **Stripe Payment Processing** - Complete payment flow with intents, captures, refunds, and webhooks
- **Stripe Connect** - Marketplace functionality for multi-party transactions

Perfect for building e-commerce platforms, marketplaces, SaaS applications, or any service that needs payment processing.

---

## 🚀 Quick Start

**Get up and running in 5 minutes:**

```bash
# 1. Clone and install
git clone <repository-url>
cd stripe-nestjs
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Set up environment (copy the example and fill in your values)
cp .env.example .env

# 4. Start database with Docker
docker-compose -f docker-compose-dev.yml up -d

# 5. Run migrations
npm run prisma:dev:deploy

# 6. Start the application
npm run start:dev
```

**That's it!** Your API is now running at `http://localhost:3000` 🎉

Visit `http://localhost:3000/api` for interactive API documentation (Swagger).

---

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Configuration](#️-configuration)
- [Docker Setup](#-docker-setup)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
  - [Payment Flows Documentation](#-payment-flows-documentation)
  - [Stripe Connect Guide](#-stripe-connect-guide)
- [Postman Collection](#-postman-collection)
- [Development Commands](#-development-commands)
- [License](#-license)

---

## ✨ Features

### 💳 Stripe Payment Integration

- **Payment Intents** - Create, confirm, capture, and cancel payments
- **Manual Capture Mode** - Authorize payments now, capture later (great for order fulfillment workflows)
- **Multiple Payment Methods** - Support for cards, Apple Pay, Google Pay, Link, and more
- **Customer Management** - Create and manage Stripe customers
- **Saved Payment Methods** - Let customers save cards for faster checkout
- **Refunds** - Full and partial refunds with detailed metadata
- **Bulk Refunds** - Process multiple refunds efficiently
- **Webhooks** - Secure webhook handling for payment events

### 🏪 Stripe Connect (Marketplace)

- **Connect Accounts** - Create accounts for sellers/merchants
- **Account Onboarding** - KYC verification and account links
- **Bank Account Management** - Add, update, and delete external bank accounts
- **Payouts** - Transfer funds to connected accounts
- **Balance Management** - Check account balances and transaction history

---

## 📦 Prerequisites

Before you begin, make sure you have the following installed:

| Requirement | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **npm** or **yarn** | Latest | Package manager |
| **PostgreSQL** | 14+ | Database |
| **Redis** | 6+ | Caching and sessions |
| **Docker** (optional) | Latest | Containerized services |
| **Stripe Account** | - | Payment processing |

> 💡 **Tip**: If you don't have PostgreSQL or Redis installed, Docker Compose can set them up for you automatically!

---

## 🔧 Installation Guide

Follow these steps to set up the project on your local machine:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd stripe-nestjs
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
```

This will install all required packages including NestJS, Prisma, Stripe SDK, and other dependencies.

### Step 3: Generate Prisma Client

Prisma needs to generate the database client based on your schema:

```bash
npx prisma generate
```

> ⚠️ **Important**: Run this command after installing dependencies and whenever you update the Prisma schema.

### Step 4: Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env` with your configuration. See the [Configuration](#️-configuration) section below for details.

---

## ⚙️ Configuration

The application uses environment variables for configuration. Here's what you need to set up:

### Complete Configuration

For a full list of all available configuration options, see the example below. Most have sensible defaults, so you only need to configure what's specific to your setup.

<details>
<summary><b>Click to expand full configuration example</b></summary>

```env
# ============================================================================
# Application Settings
# ============================================================================
NODE_ENV=development  # Options: development, production, test
PORT=3000
LOG_LEVEL=debug       # Options: error, warn, info, debug

# ============================================================================
# Database Configuration
# ============================================================================
DATABASE_HOST=localhost
DATABASE_USER=juel
DATABASE_PASSWORD=your_password
DATABASE_PORT=5432
DATABASE_NAME=nest
DATABASE_SCHEMA=public
DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public
CONTAINER_NAME=stripe-nestjs-postgres

# ============================================================================
# Redis Configuration
# ============================================================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_CACHE_EXPIRATION=3600  # Cache expiration in seconds
REDIS_CONTAINER_NAME=stripe-nestjs-redis

# ============================================================================
# OTP Email Configuration
# ============================================================================
OTP_EXPIRE_TIME=5                    # OTP expiration in minutes
OTP_MAX_FAILED_ATTEMPTS=5           # Max failed attempts before lockout
OTP_LOCKOUT_TIME=5                   # Lockout duration in minutes
OTP_SENDER_MAIL_HOST=smtp.office365.com
OTP_SENDER_MAIL_PORT=587
OTP_SENDER_MAIL="verification@yourdomain.com"
OTP_SENDER_MAIL_PASSWORD="your_email_password"

# ============================================================================
# OAuth Configuration
# ============================================================================
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# ============================================================================
# JWT/JWE Security Keys
# ============================================================================
# ⚠️ IMPORTANT: Generate strong, random 32-character keys for production!
USE_JWE=true
JWE_ACCESS_TOKEN_SECRET=your-32-char-secret-key-here
JWT_ACCESS_TOKEN_SECRET=your-32-char-secret-key-here
JWE_REFRESH_TOKEN_SECRET=your-32-char-secret-key-here
JWT_REFRESH_TOKEN_SECRET=your-32-char-secret-key-here

# Token Expiration
JWE_JWT_ACCESS_TOKEN_EXPIRATION=86400s  # 24 hours
JWE_JWT_REFRESH_TOKEN_EXPIRATION=30d   # 30 days

# Session Management
REFRESH_JTI_STRATEGY=uuid
SESSION_ID_PREFIX=sid_
AUTH_REDIS_PREFIX=auth:
REFRESH_REUSE_POLICY=revoke_session

# ============================================================================
# Password Policy
# ============================================================================
BCRYPT_SALT_ROUNDS=14
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=20
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARACTERS=true

# ============================================================================
# CORS Configuration
# ============================================================================
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOWED_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Authorization,Content-Type,X-Requested-With

# ============================================================================
# Rate Limiting
# ============================================================================
THROTTLE_TTL=60000      # Time window in milliseconds (60 seconds)
THROTTLE_LIMIT=100      # Max requests per window

# ============================================================================
# Stripe Configuration
# ============================================================================
STRIPE_SECRET_KEY=sk_test_...
STRIPE_ACCOUNT_ID=acct_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_DEFAULT_BUSINESS_NAME=tarikul's store
STRIPE_CONNECT_ACCOUNT_TYPE=custom
STRIPE_CONNECT_REFRESH_URL=https://example.com/refresh
STRIPE_CONNECT_RETURN_URL=https://example.com/return

# ============================================================================
# API Versioning
# ============================================================================
API_VERSIONING_ENABLED=true
API_VERSIONING_TYPE=uri
API_DEFAULT_VERSION=1
```

</details>

> 🔒 **Security Note**: Never commit your `.env` file to version control! The `.env.example` file is a template without sensitive values.

---

## 🐳 Docker Setup

Docker makes it easy to run PostgreSQL and Redis without installing them locally.

### Development Environment

Start all services (PostgreSQL, Redis) in the background:

```bash
docker-compose -f docker-compose-dev.yml up -d
```

This will:
- Start PostgreSQL on port `5432`
- Start Redis on port `6379`
- Create volumes for data persistence

---

## 🗄️ Database Setup

### Step 1: Generate Prisma Client

Always generate the Prisma client before running migrations:

```bash
npx prisma generate
```

### Step 2: Run Migrations

Apply database migrations to create/update your schema:

```bash
# Option 1: Using Prisma directly
npx prisma migrate deploy

# Option 2: Using npm script (recommended)
npm run prisma:dev:deploy
```

This will:
- Create all necessary tables
- Set up relationships
- Apply any pending migrations

### View Database in Prisma Studio

To visually inspect your database:

```bash
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can browse and edit data.

---

## 🚀 Running the Application

### Development Mode (Recommended)

Start the application in watch mode (auto-reloads on file changes):

```bash
npm run start:dev
```

The application will be available at:
- **API**: `http://localhost:3000`
- **Swagger Docs**: `http://localhost:3000/api`

### Production Mode

Build and run the optimized production version:

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod
```
---

## 📚 API Documentation

### 📖 Payment Flows Documentation

For detailed step-by-step guides on how to implement different payment flows, see:

**[📘 Stripe Payment Flows Guide](./docs/STRIPE_FLOWS.md)**

This comprehensive guide includes:
- 💳 **Save Card Flow** - How to save customer payment methods
- 💰 **Complete Payment Flow** - Full payment processing (create → confirm → capture)
- 🔄 **Refund Flow** - Process full and partial refunds

### 🏪 Stripe Connect Guide

For complete guide on working with Stripe Connect accounts (marketplace functionality), see:

**[📗 Stripe Connect Account Guide](./docs/STRIPE_CONNECT_GUIDE.md)**

This guide covers:
- 🚀 **Quick Start** - Get started in 3 steps
- 📊 **Account Management** - Understanding account status and flow
- ⚠️ **Common Issues & Solutions** - Fix "fennec" name, permission errors, etc.
- 📚 **API Endpoints Reference** - Complete endpoint documentation
- ✅ **Best Practices** - Production-ready patterns
- 👤 **Customer Management Flow** - Create and manage customers
- 🏪 **Stripe Connect Marketplace Flow** - Multi-party payment processing

Each flow includes:
- Step-by-step instructions
- Code examples (frontend + backend)
- Request/response examples
- Flow diagrams
- Use cases

---

### Base URL

All API endpoints are versioned:

```
http://localhost:3000/v1
```

The API supports versioning via URI path (`/v1/`, `/v2/`, etc.).

### Authentication

Most endpoints require authentication. Include your access token in the request header:

```http
Authorization: Bearer <your-access-token>
```

You get access tokens by:
1. Signing up and verifying your email
2. Signing in with your credentials
3. Using OAuth (Google/Facebook)

### Available Endpoints

#### 💳 Stripe - Customers

Manage Stripe customer records:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/stripe/customer` | Create a new Stripe customer | ✅ |
| GET | `/v1/stripe/customer/:email` | Get customer by email address | ✅ |
| GET | `/v1/stripe/customer/:id/payment-method` | Get customer's default payment method | ✅ |

#### 💰 Stripe - Payment Intents

Handle payment processing:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/stripe/payment-intent` | Create a payment intent | ✅ |
| POST | `/v1/stripe/payment-intent/:id/confirm` | Confirm a payment intent | ✅ |
| POST | `/v1/stripe/payment-intent/:id/capture` | Capture an authorized payment | ✅ |
| POST | `/v1/stripe/payment-intent/:id/cancel` | Cancel a payment intent | ✅ |
| POST | `/v1/stripe/payment-intent/:id/refund` | Refund a payment (full or partial) | ✅ |
| POST | `/v1/stripe/payment-intents/bulk-refund` | Refund multiple payments | ✅ |
| GET | `/v1/stripe/payment-intent/:id/status` | Get payment intent status | ✅ |

#### 💳 Stripe - Payment Methods

Manage saved payment methods:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/stripe/setup-intent` | Create setup intent for saving cards | ✅ |
| GET | `/v1/stripe/create-card-save-intent` | Get setup intent via query | ✅ |
| POST | `/v1/stripe/save-payment-method` | Save a payment method to customer | ✅ |

#### 🏪 Stripe Connect - Accounts

Manage marketplace seller accounts:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/stripe/connect/account` | Create a Connect account | ✅ |
| GET | `/v1/stripe/connect/account/:id` | Get Connect account details | ✅ |
| POST | `/v1/stripe/connect/account/:id/link` | Create onboarding link | ✅ |
| GET | `/v1/stripe/connect/account/:id/balance` | Get account balance | ✅ |

#### 🏦 Stripe Connect - Bank Accounts

Manage bank accounts for payouts:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/v1/stripe/connect/account/:id/external-accounts` | List bank accounts | ✅ |
| POST | `/v1/stripe/payouts/add-bank-accounts` | Add a bank account | ✅ |
| PATCH | `/v1/stripe/payouts/add-bank-accounts` | Update a bank account | ✅ |
| DELETE | `/v1/stripe/payouts/delete-bank-accounts` | Delete a bank account | ✅ |

#### 💸 Stripe Connect - Payouts

Handle payouts to sellers:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/stripe/connect/payout` | Create a payout | ✅ |
| GET | `/v1/stripe/connect/payout/:id` | Get payout status | ✅ |
| GET | `/v1/stripe/payouts` | List payouts | ✅ |
| POST | `/v1/stripe/payouts/:id/cancel` | Cancel a payout | ✅ |
| GET | `/v1/stripe/payouts/balance` | Get payout balance | ✅ |

#### 🔔 Stripe - Webhooks

Handle Stripe webhook events:

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/stripe/webhook` | Handle Stripe webhook events | 🔐 Signature verified |

> 📖 **Interactive Documentation**: Visit `http://localhost:3000/api` for Swagger UI where you can test all endpoints interactively!

---

## 📖 Postman Collection

We provide a comprehensive Postman collection with all API endpoints pre-configured.

### Import the Collection

1. Open Postman
2. Click **Import**
3. Select the file: `postman/Stripe NestJS API Collection.postman_collection.json`
4. The collection will be imported with all endpoints organized

### Collection Variables

The collection uses variables that are automatically set when you use the requests:

| Variable | Description | Auto-set by |
|----------|-------------|------------|
| `baseUrl` | API base URL | Manual |
| `apiVersion` | API version (v1) | Manual |
| `accessToken` | JWT access token | Sign in/Verify endpoints |
| `refreshToken` | JWT refresh token | Sign in/Verify endpoints |
| `customerId` | Stripe customer ID | Create Customer endpoint |
| `paymentIntentId` | Payment intent ID | Create Payment Intent endpoint |
| `connectAccountId` | Connect account ID | Create Connect Account endpoint |
| `paymentMethodId` | Payment method ID | Save Payment Method endpoint |

### Using the Collection

1. **Set up environment variables**:
   - `baseUrl`: `http://localhost:3000`
   - `apiVersion`: `v1`

2. **Start with authentication**:
   - Use "Sign Up" or "Sign In" request
   - Tokens will be automatically saved

3. **Use other endpoints**:
   - All endpoints will use the saved tokens automatically
   - Variables like `customerId` are set automatically as you use the API

---

## 🛠 Development Commands

Here are the most useful commands for development:

### Application Commands

```bash
# Start development server (watch mode)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

### Database Commands

```bash
# Start PostgreSQL container
npm run db:dev:up

# Stop and remove PostgreSQL container
npm run db:dev:rm

# Restart database and run migrations
npm run db:dev:restart

# Deploy database migrations
npm run prisma:dev:deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```
---

## 📄 License

This project is licensed under the **MIT License**.

See the [LICENSE](./LICENSE) file for full details.

---

## 🆘 Need Help?

- 📖 **API Documentation**: Visit `http://localhost:3000/api` for interactive Swagger docs
- 📝 **Postman Collection**: Import the collection from `postman/` folder
- 🐛 **Issues**: Check existing issues or create a new one on GitHub
- 💬 **Questions**: Review the code comments and inline documentation

---

**Built with ❤️ using NestJS and Clean Architecture**

