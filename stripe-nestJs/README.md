# Stripe NestJS API

A production-ready NestJS application with comprehensive Stripe payment integration and authentication system, built following Clean Architecture principles.

## 🚀 Features

### Authentication & Authorization
- **User Registration** with email verification (OTP-based)
- **JWT-based Authentication** (Access & Refresh tokens)
- **OTP Verification** for email verification and password reset
- **Password Management** (forgot password, change password)
- **OAuth Integration** (Google, Facebook)
- **Token Refresh** mechanism
- **Multi-device Logout** support
- **Rate Limiting** for authentication endpoints
- **Activity Tracking** for user sessions

### Stripe Payment Integration
- **Payment Intents** - Create, confirm, capture, and cancel payments
- **Manual Capture Mode** - Authorize now, capture later
- **Multiple Payment Methods** - Card, Apple Pay, Google Pay, Link, etc.
- **Customer Management** - Create and manage Stripe customers
- **Payment Methods** - Save and manage customer payment methods
- **Refunds** - Full and partial refunds with metadata support
- **Bulk Refunds** - Process multiple refunds in a single operation
- **Webhooks** - Handle Stripe webhook events securely

### Stripe Connect (Marketplace)
- **Connect Accounts** - Create and manage Stripe Connect accounts
- **Account Onboarding** - KYC verification and account links
- **Bank Accounts** - Add, update, and delete external bank accounts
- **Payouts** - Transfer funds to connected accounts
- **Balance Management** - Check Connect account balances

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Stripe Features](#stripe-features)
- [Authentication Features](#authentication-features)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## 🛠 Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (ioredis)
- **Queue**: BullMQ
- **Authentication**: JWT, Passport (Google OAuth, Facebook OAuth)
- **Payment**: Stripe SDK
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator, class-transformer
- **Logging**: Winston
- **Testing**: Jest
- **Containerization**: Docker

## 🏗 Architecture

This project follows **Clean Architecture** principles with strict layer separation:

```
┌─────────────────────────────────────────────────────────┐
│                    Interface Layer                      │
│  (HTTP Controllers, GraphQL Resolvers, Validators)      │
└──────────────────────┬──────────────────────────────────┘
                        │
┌──────────────────────▼──────────────────────────────────┐
│                 Application Layer                       │
│  (Use Cases, Services, DTOs, Commands)                 │
└──────────────────────┬──────────────────────────────────┘
                        │
┌──────────────────────▼──────────────────────────────────┐
│                   Domain Layer                          │
│  (Entities, Value Objects, Ports, Domain Events)        │
└──────────────────────┬──────────────────────────────────┘
                        │
┌──────────────────────▼──────────────────────────────────┐
│              Infrastructure Layer                        │
│  (Adapters: Prisma, Redis, Stripe, Email, JWT)         │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

- **Dependency Inversion**: High-level modules depend on abstractions (ports), not concrete implementations
- **Ports & Adapters**: All external dependencies are abstracted through ports
- **Use Cases**: Business logic is organized into use cases
- **Domain-Driven Design**: Business logic lives in the domain layer

## 📦 Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Redis 6+
- Stripe account (for payment features)
- Docker & Docker Compose (optional, for local development)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stripe-nestJs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Start PostgreSQL (using Docker)
   npm run db:dev:up

   # Run migrations
   npx prisma migrate deploy
   # or
   npm run prisma:dev:deploy
   ```

5. **Start Redis** (if not using Docker)
   ```bash
   redis-server
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stripe_nestjs

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGIN=http://localhost:3000
```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

The application will be available at `http://localhost:3000`

### API Documentation
Swagger UI is available at: `http://localhost:3000/api`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/v1
```

All endpoints support API versioning (`v1`, `v2`).

### Authentication

Most endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <accessToken>
```

### API Endpoints

#### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/auth/signup` | Register a new user |
| POST | `/v1/auth/signin` | Sign in and get tokens |
| POST | `/v1/auth/verify` | Verify OTP code |
| POST | `/v1/auth/resend` | Resend OTP code |
| POST | `/v1/auth/forget-password` | Request password reset |
| POST | `/v1/auth/change-password` | Change password |
| POST | `/v1/auth/refresh-token` | Refresh access token |
| POST | `/v1/auth/logout-all` | Logout from all devices |
| GET | `/v1/auth/google` | Google OAuth login |
| GET | `/v1/auth/facebook` | Facebook OAuth login |

#### Stripe - Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/stripe/customer` | Create Stripe customer |
| GET | `/v1/stripe/customer/:email` | Get customer by email |
| GET | `/v1/stripe/customer/:id/payment-method` | Get default payment method |

#### Stripe - Payment Intents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/stripe/payment-intent` | Create payment intent |
| POST | `/v1/stripe/payment-intent/:id/confirm` | Confirm payment intent |
| POST | `/v1/stripe/payment-intent/:id/capture` | Capture payment |
| POST | `/v1/stripe/payment-intent/:id/cancel` | Cancel payment intent |
| POST | `/v1/stripe/payment-intent/:id/refund` | Refund payment |
| POST | `/v1/stripe/payment-intents/bulk-refund` | Bulk refund payments |
| GET | `/v1/stripe/payment-intent/:id/status` | Get payment intent status |

#### Stripe - Payment Methods

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/stripe/setup-intent` | Create setup intent |
| GET | `/v1/stripe/create-card-save-intent` | Get setup intent (query) |
| POST | `/v1/stripe/save-payment-method` | Save payment method |

#### Stripe Connect - Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/stripe/connect/account` | Create Connect account |
| GET | `/v1/stripe/connect/account/:id` | Get Connect account |
| POST | `/v1/stripe/connect/account/:id/link` | Create account link |
| GET | `/v1/stripe/connect/account/:id/balance` | Get account balance |

#### Stripe Connect - Bank Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/stripe/connect/account/:id/external-accounts` | List bank accounts |
| POST | `/v1/stripe/payouts/add-bank-accounts` | Add bank account |
| PATCH | `/v1/stripe/payouts/add-bank-accounts` | Update bank account |
| DELETE | `/v1/stripe/payouts/delete-bank-accounts` | Delete bank account |

#### Stripe Connect - Payouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/stripe/connect/payout` | Create payout |
| GET | `/v1/stripe/connect/payout/:id` | Get payout status |
| GET | `/v1/stripe/payouts` | List payouts |
| POST | `/v1/stripe/payouts/:id/cancel` | Cancel payout |
| GET | `/v1/stripe/payouts/balance` | Get payout balance |

#### Stripe - Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/stripe/webhook` | Handle Stripe webhook events |

## 💳 Stripe Features

### Payment Flow

1. **Create Payment Intent**
   ```json
   POST /v1/stripe/payment-intent
   {
     "amount": 100.00,
     "currency": "usd",
     "customerEmail": "customer@example.com",
     "description": "Order #12345",
     "paymentMethodTypes": ["card"],
     "metadata": {
       "orderId": "12345"
     }
   }
   ```
   Returns `clientSecret` for frontend integration.

2. **Frontend Integration** (using Stripe.js)
   ```javascript
   const stripe = Stripe('pk_test_...');
   const { error } = await stripe.confirmCardPayment(clientSecret, {
     payment_method: {
       card: cardElement,
     }
   });
   ```

3. **Confirm Payment Intent** (if not using Stripe.js)
   ```json
   POST /v1/stripe/payment-intent/:id/confirm
   {
     "paymentMethodId": "pm_..."
   }
   ```

4. **Capture Payment** (manual capture mode)
   ```json
   POST /v1/stripe/payment-intent/:id/capture
   ```

### Refunds

**Full Refund**
```json
POST /v1/stripe/payment-intent/:id/refund
{
  "reason": "requested_by_customer"
}
```

**Partial Refund**
```json
POST /v1/stripe/payment-intent/:id/refund
{
  "amount": 50.00,
  "reason": "requested_by_customer",
  "metadata": {
    "refundId": "REF-12345",
    "orderId": "ORD-67890"
  }
}
```

**Bulk Refund**
```json
POST /v1/stripe/payment-intents/bulk-refund
{
  "paymentIntentIds": [
    "pi_1234567890",
    "pi_0987654321"
  ]
}
```

### Stripe Connect (Marketplace)

**Create Connect Account**
```json
POST /v1/stripe/connect/account
{
  "country": "US",
  "email": "merchant@example.com",
  "businessName": "My Business"
}
```

**Create Account Link** (for onboarding)
```json
POST /v1/stripe/connect/account/:id/link
{
  "refreshUrl": "https://example.com/refresh",
  "returnUrl": "https://example.com/return"
}
```

**Create Payout**
```json
POST /v1/stripe/connect/payout
{
  "connectAccountId": "acct_...",
  "amount": 100.50,
  "currency": "usd",
  "externalAccountId": "ba_...",
  "description": "Revenue payout"
}
```

## 🔐 Authentication Features

### User Registration Flow

1. **Sign Up**
   ```json
   POST /v1/auth/signup
   {
     "email": "user@example.com",
     "password": "SecurePass123!",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```
   - Creates user account (unverified)
   - Sends OTP to email automatically

2. **Verify OTP**
   ```json
   POST /v1/auth/verify
   {
     "email": "user@example.com",
     "otp": "123456"
   }
   ```
   - Verifies email address
   - Returns access and refresh tokens

3. **Sign In**
   ```json
   POST /v1/auth/signin
   {
     "email": "user@example.com",
     "password": "SecurePass123!"
   }
   ```
   - Returns access and refresh tokens

### Password Reset Flow

1. **Forget Password**
   ```json
   POST /v1/auth/forget-password
   {
     "email": "user@example.com"
   }
   ```
   - Sends OTP to email

2. **Verify OTP** (same endpoint as registration)
   ```json
   POST /v1/auth/verify
   {
     "email": "user@example.com",
     "otp": "123456"
   }
   ```

3. **Change Password**
   ```json
   POST /v1/auth/change-password
   {
     "newPassword": "NewSecurePass123!"
   }
   ```
   - Only `newPassword` required (OTP already verified)

### Token Management

**Refresh Token**
```json
POST /v1/auth/refresh-token
Authorization: Bearer <refreshToken>
```
Returns new access and refresh tokens.

**Logout All Devices**
```json
POST /v1/auth/logout-all
Authorization: Bearer <accessToken>
```
Invalidates all active sessions.

### OAuth Integration

**Google OAuth**
```
GET /v1/auth/google
```
Redirects to Google OAuth consent screen.

**Facebook OAuth**
```
GET /v1/auth/facebook
```
Redirects to Facebook OAuth consent screen.

## 📁 Project Structure

```
src/
├── app.module.ts              # Root module
├── app-http.module.ts         # HTTP composition root
├── app-graphql.module.ts      # GraphQL composition root
├── main.ts                    # Application bootstrap
│
├── config/                    # Configuration
│   ├── config.module.ts
│   ├── env.schema.ts
│   └── tokens.ts
│
├── common/                    # Cross-cutting concerns
│   ├── auth/                 # Auth strategies & guards
│   ├── errors/               # Error handling
│   ├── guards/               # HTTP guards
│   ├── http/                 # HTTP utilities
│   ├── observability/        # Logging, monitoring
│   ├── persistence/          # Persistence utilities
│   └── security/             # Security middleware
│
├── modules/
│   ├── auth/                 # Authentication module
│   │   ├── domain/           # Domain layer
│   │   ├── application/      # Application layer
│   │   ├── infrastructure/   # Infrastructure adapters
│   │   └── interface/        # HTTP/GraphQL interfaces
│   │
│   └── stripe/               # Stripe module
│       ├── domain/           # Domain layer
│       ├── application/      # Application layer (use cases)
│       ├── infrastructure/   # Stripe adapters
│       └── interface/        # HTTP controllers
│
├── platform/                 # Infrastructure wiring
│   ├── prisma/               # Prisma client
│   ├── jwt/                  # JWT service
│   ├── redis/                # Redis client
│   └── queue/                # BullMQ setup
│
└── health/                   # Health checks
```

For detailed structure, see [PROJECT_STRUCTURE.md](./guideline/PROJECT_STRUCTURE.md)

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🚢 Deployment

### Docker

**Development**
```bash
docker-compose -f docker-compose-dev.yml up
```

**Production**
```bash
docker-compose -f docker-compose-prod.yml up -d
```

### Environment Variables

Ensure all required environment variables are set in production:
- Database connection string
- Redis connection
- Stripe API keys (use live keys in production)
- JWT secrets
- OAuth credentials
- Email SMTP settings

### Database Migrations

```bash
# Run migrations
npx prisma migrate deploy
```

## 🔒 Security

- **JWT Authentication** with access and refresh tokens
- **Rate Limiting** on authentication endpoints
- **CORS** configuration
- **Helmet** security headers
- **Input Validation** using class-validator
- **Password Hashing** with bcrypt
- **OTP Expiration** and rate limiting
- **Webhook Signature Verification** for Stripe events
- **PII Masking** for sensitive data in logs

See [SECURITY.md](./docs/SECURITY.md) for more details.

## 📖 Postman Collection

A comprehensive Postman collection is available at:
```
postman/Stripe NestJS API Collection.postman_collection.json
```

**Setup Postman Environment:**
```bash
./setup-postman-env.sh
```

**Collection Variables:**
- `baseUrl`: http://localhost:3000
- `apiVersion`: v1
- `accessToken`: Auto-saved from signin/verify
- `refreshToken`: Auto-saved from signin/verify
- `customerId`: Stripe customer ID
- `paymentIntentId`: Payment intent ID
- `connectAccountId`: Connect account ID

## 📝 Development Guidelines

- [Architecture Principles](./guideline/ARCHITECTURE_PRINCIPLES.md)
- [Naming Conventions](./guideline/NAMING_CONVENTIONS.md)
- [Error Handling](./guideline/ERROR_HANDLING.md)
- [REST API Standards](./guideline/REST_API_STANDARDS.md)
- [Database Standards](./guideline/DATABASE_STANDARDS.md)
- [Testing](./guideline/TESTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the UNLICENSED License.

## 🆘 Support

For issues and questions:
- Check the [documentation](./guideline/)
- Review [API documentation](http://localhost:3000/api) (Swagger)
- Open an issue on GitHub

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Stripe](https://stripe.com/) - Payment processing platform
- [Prisma](https://www.prisma.io/) - Next-generation ORM

---

**Built with ❤️ using NestJS and Clean Architecture**
