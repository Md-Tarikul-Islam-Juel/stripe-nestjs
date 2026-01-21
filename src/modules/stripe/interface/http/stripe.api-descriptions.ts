/**
 * Stripe API Operation Descriptions
 * 
 * This file contains all API operation descriptions for Swagger documentation.
 * Keeping descriptions separate from the controller improves maintainability
 * and makes the controller code cleaner and easier to read.
 */

export const STRIPE_API_DESCRIPTIONS = {
  // Payment Intent Operations
  CREATE_PAYMENT_INTENT: {
    summary: 'Create Stripe payment intent',
    description: `**Purpose:** Create a payment intent to process a payment. This is the first step in Stripe's payment flow.

**Why Use This API:**
- Required before processing any payment
- Supports multiple payment methods (card, Apple Pay, Google Pay, etc.)
- Uses manual capture mode (authorize now, capture later)
- Returns clientSecret for frontend integration

**Real-Life Scenarios:**
1. **E-commerce Checkout:** Customer adds items to cart, clicks "Pay Now", payment intent created
2. **Subscription Setup:** User selects plan, payment intent created for first payment
3. **Marketplace:** Buyer purchases product, payment intent created for seller payout
4. **Event Booking:** Attendee books ticket, payment intent created for ticket purchase

**Payment Flow:**
Step 1: Create Payment Intent (this endpoint) → Returns clientSecret
Step 2: Frontend uses clientSecret with Stripe.js to collect payment
Step 3: Confirm Payment Intent → Authorizes payment
Step 4: Capture Payment → Actually charges the card (manual capture)

**Key Features:**
- **Manual Capture:** Payment authorized but not captured immediately
- **Multiple Payment Methods:** Supports card, apple_pay, google_pay, link, etc.
- **Metadata:** Store orderId, userId, or any custom data
- **Customer Linking:** Optional customerId for saved cards

**Request Parameters:**
- amount: Payment amount in dollars (e.g., 100.00)
- currency: Currency code (usd, eur, gbp, etc.)
- customerEmail: Email for receipt
- paymentMethodTypes: Array of accepted methods (default: ['card'])
- customerId: Optional, for saved payment methods
- paymentMethodId: Optional, pre-attached payment method
- metadata: Custom tracking data (orderId, etc.)

**Response:**
- clientSecret: Used by frontend Stripe.js to complete payment
- paymentIntentId: Automatically extracted and saved to {{paymentIntentId}}

**Next Steps:**
- Use clientSecret with Stripe.js on frontend
- Or use "Confirm Payment Intent" endpoint with paymentMethodId
- Then "Capture Payment" to actually charge the card

**Important:**
- Amount is in dollars (converted to cents internally)
- Payment is authorized but NOT captured (manual capture mode)
- Must call "Capture Payment" to actually charge the customer`,
  },

  CONFIRM_PAYMENT_INTENT: {
    summary: 'Confirm a payment intent',
  },

  CAPTURE_PAYMENT_INTENT: {
    summary: 'Capture a payment intent',
    description: `**Purpose:** Actually charge the customer after payment has been authorized.

**Why Use This API:**
- Completes the payment process (manual capture mode)
- Charges the authorized amount to customer's card
- Required after confirming payment intent
- Final step in payment flow

**Real-Life Scenarios:**
1. **Order Fulfillment:** Item shipped, now capture the authorized payment
2. **Service Delivery:** Service completed, capture the payment
3. **Event Confirmation:** Event confirmed, capture ticket payment
4. **Manual Review:** After fraud check, capture approved payment

**When to Use:**
- After payment intent is confirmed
- When order/service is ready to fulfill
- After manual review/approval
- When you're ready to actually charge the customer

**Payment Flow:**
1. Create Payment Intent → Authorize payment
2. Confirm Payment Intent → Payment authorized
3. Capture Payment (this endpoint) → Payment charged ✅

**Important:**
- Payment must be in 'requires_capture' status
- Can only capture once per payment intent
- Amount cannot exceed authorized amount
- Payment is final after capture

**Use Cases:**
- E-commerce: Capture when order ships
- Services: Capture when service is delivered
- Events: Capture when event is confirmed
- Marketplace: Capture when transaction is complete`,
  },

  CANCEL_PAYMENT_INTENT: {
    summary: 'Cancel a payment intent',
    description: `**Purpose:** Cancel an authorized payment that hasn't been captured yet.

**Why Use This API:**
- Release authorization hold on customer's card
- Cancel payment before capture
- Refund authorization without charging
- Part of order cancellation process

**Real-Life Scenarios:**
1. **Order Cancellation:** Customer cancels order before shipping
2. **Out of Stock:** Item unavailable, cancel authorized payment
3. **Customer Request:** Customer changes mind, cancel payment
4. **Fraud Prevention:** Suspicious activity detected, cancel payment

**When to Use:**
- Payment intent is in 'requires_capture' status
- Before capturing the payment
- When order/service is cancelled
- When you want to release the authorization

**What Happens:**
- Payment intent status changes to 'canceled'
- Authorization hold released
- Customer's card is NOT charged
- Funds immediately available to customer

**Cannot Cancel:**
- Already captured payments (use Refund instead)
- Completed payments
- Failed payments

**Use Cases:**
- Order cancellation before fulfillment
- Inventory issues
- Customer service requests
- Fraud prevention`,
  },

  REFUND_PAYMENT: {
    summary: 'Refund a payment',
    description: `**Purpose:** Refund a captured payment - full or partial refund with detailed options.

**Why Use This API:**
- Process customer refunds
- Handle returns and cancellations
- Support multiple refund reasons
- Track refunds with metadata

**Real-Life Scenarios:**
1. **Product Return:** Customer returns item, full refund processed
2. **Partial Refund:** Item damaged, partial refund for discount
3. **Service Cancellation:** Service cancelled mid-term, prorated refund
4. **Customer Complaint:** Customer not satisfied, refund issued

**Refund Options:**
- **Full Refund:** Omit amount parameter or set to full payment amount
- **Partial Refund:** Specify amount less than payment amount
- **Refund Reason:** duplicate, fraudulent, requested_by_customer
- **Metadata:** Track refundId, orderId, reason, etc.
- **Connect Accounts:** reverseTransfer, refundApplicationFee options

**Request Examples:**
- Full refund: \`{}\` or \`{"reason": "requested_by_customer"}\`
- Partial refund: \`{"amount": 50.00}\`
- With reason: \`{"amount": 50.00, "reason": "requested_by_customer"}\`
- Complete: \`{"amount": 50.00, "reason": "requested_by_customer", "metadata": {"refundId": "REF-123"}}\`

**Response Includes:**
- refundId: Stripe refund ID
- amount: Refunded amount
- status: succeeded, pending, failed
- reason: Refund reason
- receiptNumber: Receipt for customer
- metadata: Custom tracking data

**When to Use:**
- After payment is captured
- Customer requests refund
- Product/service issue
- Order cancellation after fulfillment

**Note:** Refunds can take 5-10 business days to appear in customer's account depending on bank.`,
  },

  BULK_REFUND: {
    summary: 'Bulk refund payment intents',
  },

  CREATE_TOPUP: {
    summary: 'Create top-up to add funds directly to available balance',
    description: `**Purpose:** Add funds directly to your Stripe **available balance**, bypassing the normal payment settlement period.

**Why Use This API:**
- Add funds directly to available balance (not pending/incoming)
- Test your application with available funds
- Top up your account balance programmatically
- Add funds faster than waiting for payment settlement

**Real-Life Scenarios:**
1. **Testing:** Add test funds to available balance for development
2. **Account Top-up:** Manually add funds to your Stripe balance
3. **Balance Management:** Ensure sufficient available balance for transfers/payouts
4. **Quick Funding:** Add funds when you need immediate availability

**How It Works:**
- Creates a Stripe Top-up object
- Funds are added to your available balance
- Can use a payment method (card) or bank transfer
- Faster than regular payments (may still have some settlement time depending on source)

**Request Parameters:**
- amount: Amount to add in dollars (e.g., 100.0)
- currency: Currency code (e.g., usd, eur)
- source: (Optional) Payment method ID or source ID to use
- description: (Optional) Description for the top-up
- metadata: (Optional) Custom tracking data

**Response:**
- id: Top-up ID (starts with tu_)
- amount: Amount in cents
- currency: Currency code
- status: pending, succeeded, failed, canceled
- availableOn: Timestamp when funds become available (may be immediate)

**Important Notes:**
- Top-ups may still have settlement time depending on the payment method
- In test mode, top-ups can be available immediately
- Requires a valid payment method or source
- Minimum top-up amount is typically $1.00

**Use Cases:**
- Testing with available funds
- Account balance management
- Quick funding for transfers/payouts
- Development and testing workflows`,
  },

  GET_PAYMENT_INTENT_STATUS: {
    summary: 'Get payment intent status',
  },

  // Customer Operations
  CREATE_CUSTOMER: {
    summary: 'Create a Stripe customer',
    description: `**Purpose:** Create a Stripe customer record to store payment methods and transaction history.

**Why Use This API:**
- Required before processing payments for a customer
- Enables saving payment methods for future use
- Tracks customer payment history in Stripe
- Required for subscription billing

**Real-Life Scenarios:**
1. **E-commerce Checkout:** Customer creates account, system creates Stripe customer
2. **Subscription Service:** User signs up, customer created for recurring billing
3. **Marketplace:** Seller registers, customer created to receive payouts
4. **SaaS Platform:** New user onboarding, customer created for billing

**When to Use:**
- Before first payment from a user
- When user wants to save payment methods
- For subscription-based services
- Before creating payment intents with saved cards

**Workflow:**
1. User provides email address
2. System creates Stripe customer with email
3. Returns customerId (starts with 'cus_')
4. CustomerId saved automatically to {{customerId}} variable
5. Use customerId in future payment operations

**Benefits:**
- Store multiple payment methods per customer
- Track payment history
- Enable saved cards for faster checkout
- Support subscriptions and recurring payments

**Next Steps:**
- Use customerId in "Create Payment Intent" for saved cards
- Attach payment methods to customer
- Create subscriptions for recurring billing`,
  },

  GET_CUSTOMER_BY_EMAIL: {
    summary: 'Get customer ID by email',
    description: `**Purpose:** Retrieve existing Stripe customer ID using email address.

**Why Use This API:**
- Check if customer already exists before creating new one
- Retrieve customerId for existing users
- Link user account to Stripe customer
- Avoid duplicate customer creation

**Real-Life Scenarios:**
1. **Returning Customer:** User logs in, system checks if Stripe customer exists
2. **Account Linking:** Link existing user account to Stripe customer
3. **Payment History:** Retrieve customer to view past transactions
4. **Duplicate Prevention:** Check before creating new customer

**When to Use:**
- Before creating payment intent for existing user
- When user logs in and wants to use saved cards
- To check if customer record exists
- Before creating duplicate customer

**Response:**
- Returns customerId if found (starts with 'cus_')
- Returns null if customer doesn't exist
- CustomerId automatically saved to {{customerId}} variable

**Workflow:**
1. User provides email
2. System searches Stripe for customer with that email
3. Returns customerId if found
4. Use customerId in payment operations

**Best Practice:**
- Check for existing customer before creating new one
- Use this to retrieve customerId for returning users`,
  },

  GET_DEFAULT_PAYMENT_METHOD: {
    summary: 'Get default payment method for a customer',
  },

  // Payment Method Operations
  CREATE_SETUP_INTENT: {
    summary: 'Create setup intent for saving payment methods',
    description: `**Purpose:** Create a setup intent to securely save payment methods for future use.

**Why Use This API:**
- Save customer payment methods securely
- Enable one-click checkout
- Store cards for subscriptions
- Improve user experience

**Real-Life Scenarios:**
1. **Save Card:** Customer wants to save card for faster checkout
2. **Subscription Setup:** Save payment method for recurring billing
3. **Account Settings:** User adds payment method to account
4. **Marketplace:** Seller adds payout method

**How It Works:**
1. Create setup intent with customerId
2. Returns clientSecret
3. Frontend uses Stripe.js to collect payment method
4. Payment method saved to customer
5. Can be used for future payments

**Workflow:**
- Step 1: Create Setup Intent (this endpoint) → Get clientSecret
- Step 2: Frontend uses clientSecret with Stripe.js
- Step 3: Customer enters card details
- Step 4: Payment method saved to customer
- Step 5: Use saved payment method in future payments

**Benefits:**
- Secure payment method storage
- PCI compliance handled by Stripe
- Faster checkout for returning customers
- Support for multiple payment methods

**Next Steps:**
- Use clientSecret with Stripe.js Elements
- Payment method automatically saved to customer
- Use in "Create Payment Intent" with customerId`,
  },

  GET_SETUP_INTENT: {
    summary: 'Get setup intent for saving payment methods',
  },

  SAVE_PAYMENT_METHOD: {
    summary: 'Save payment method to customer',
    description: `**Purpose:** Attach a payment method to a customer and optionally set as default.

**Why Use This API:**
- Link payment method to customer account
- Set default payment method
- Enable saved cards for checkout
- Manage customer payment methods

**Real-Life Scenarios:**
1. **Add Card:** Customer adds new card to account
2. **Update Default:** Customer changes default payment method
3. **Multiple Cards:** Customer adds backup payment method
4. **Subscription:** Set payment method for recurring billing

**Request Parameters:**
- paymentMethodId: Payment method to attach (from setup intent or payment)
- customerId: Stripe customer ID
- setAsDefault: Whether to set as default payment method

**What Happens:**
- Payment method attached to customer
- If setAsDefault=true, becomes default payment method
- Can be used in future payment intents
- Appears in customer's saved payment methods

**Use Cases:**
- After setup intent completion
- When customer adds new card
- Updating default payment method
- Managing customer payment methods

**Benefits:**
- Faster checkout (no need to re-enter card)
- Better user experience
- Support for multiple payment methods
- Secure storage by Stripe`,
  },

  // Stripe Connect Operations
  CREATE_CONNECT_ACCOUNT: {
    summary: 'Create a Stripe Connect account',
    description: `**Purpose:** Create a Stripe Connect account for marketplace sellers or platform users.

**Why Use This API:**
- Enable marketplace payments (platform takes fee, seller gets paid)
- Onboard sellers/merchants to your platform
- Support multi-party transactions
- Handle payouts to connected accounts

**Real-Life Scenarios:**
1. **Marketplace:** Seller registers to sell products, Connect account created
2. **Platform:** Service provider joins platform, account created for payouts
3. **Gig Economy:** Freelancer signs up, account created to receive payments
4. **Event Platform:** Organizer creates account to receive ticket sales

**How Stripe Connect Works:**
- Platform (you) creates Connect account for seller
- Customer pays platform
- Platform takes application fee
- Remaining amount transferred to seller's Connect account
- Seller receives payout to their bank account

**Account Types:**
- Express: Quick onboarding, Stripe handles KYC
- Standard: Full control, you handle KYC
- Custom: Maximum control, requires additional setup

**Workflow:**
1. Create Connect Account (this endpoint) → Get accountId
2. Create Account Link → Onboard seller (KYC, bank details)
3. Seller completes onboarding
4. Account ready to receive payments
5. Create payouts to seller's bank account

**Response:**
- accountId: Stripe Connect account ID (starts with 'acct_')
- Saved to {{connectAccountId}} variable
- Account in 'pending' status until onboarding complete

**Next Steps:**
- Create account link for onboarding
- Seller completes KYC and adds bank account
- Account ready for payouts`,
  },

  GET_CONNECT_ACCOUNT: {
    summary: 'Get Connect account details',
    description: `**Purpose:** Retrieve details and status of a Stripe Connect account.

**Why Use This API:**
- Check account status and capabilities
- Verify if account is ready to receive payments
- Check if onboarding is complete
- Monitor account verification status
- Get account metadata and business profile

**Real-Life Scenarios:**
1. **Account Status Check:** Verify if seller account is ready before processing payments
2. **Onboarding Verification:** Check if seller completed KYC and added bank account
3. **Payment Eligibility:** Verify chargesEnabled and payoutsEnabled before transfers
4. **Account Monitoring:** Regular status checks for account health

**Response Fields:**
- **id:** Stripe Connect account ID (starts with 'acct_')
- **country:** Account country code (US, GB, etc.)
- **type:** Account type (express, standard, custom)
- **chargesEnabled:** Can this account receive payments? (true/false)
- **payoutsEnabled:** Can this account receive payouts? (true/false)
- **detailsSubmitted:** Has seller completed onboarding? (true/false)
- **businessProfile:** Business information (name, website, etc.)
- **metadata:** Custom tracking data

**Account Status Guide:**
- **chargesEnabled: false** → Account cannot receive payments yet
- **payoutsEnabled: false** → Account cannot receive payouts yet
- **detailsSubmitted: false** → Onboarding incomplete, seller needs to complete setup
- **All true** → Account fully active and ready ✅

**Use Cases:**
- Before creating transfers: Check if payoutsEnabled is true
- Before processing payments: Verify chargesEnabled is true
- Onboarding flow: Check detailsSubmitted to see if seller completed setup
- Account health monitoring: Regular status checks

**Example Response:**
\`\`\`json
{
  "id": "acct_1234567890",
  "country": "US",
  "type": "express",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "businessProfile": {
    "name": "tarikul's store",
    "url": "https://example.com"
  },
  "metadata": {
    "userId": "123"
  }
}
\`\`\`

**Automatic Onboarding Link:**
If account is incomplete, provide refreshUrl and returnUrl query parameters:
\`\`\`http
GET /v1/stripe/connect/account/acct_1234567890?refreshUrl=https://example.com/refresh&returnUrl=https://example.com/return
\`\`\`

**Response (if incomplete):**
\`\`\`json
{
  "id": "acct_1234567890",
  "chargesEnabled": false,
  "payoutsEnabled": false,
  "detailsSubmitted": false,
  "needsOnboarding": true,
  "onboardingUrl": "https://connect.stripe.com/setup/...",
  "onboardingExpiresAt": 1234567890
}
\`\`\`

**Response (if complete):**
\`\`\`json
{
  "id": "acct_1234567890",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "needsOnboarding": false
}
\`\`\`

**Next Steps:**
- If needsOnboarding is true, redirect seller to onboardingUrl
- If needsOnboarding is false, account is ready for use`,
  },

  CREATE_ACCOUNT_LINK: {
    summary: 'Create account link for onboarding',
    description: `**Purpose:** Generate onboarding link for Stripe Connect account (KYC, bank details).

**Why Use This API:**
- Required for seller to complete account setup
- Handles KYC (Know Your Customer) verification
- Seller adds bank account for payouts
- Completes Connect account activation

**Real-Life Scenarios:**
1. **Seller Onboarding:** New seller needs to complete account setup
2. **KYC Verification:** Seller must verify identity and business
3. **Bank Account:** Seller adds bank account to receive payouts
4. **Account Update:** Seller needs to update account information

**How It Works:**
- Creates secure onboarding link
- Seller redirected to Stripe-hosted page
- Completes identity verification
- Adds bank account details
- Returns to your platform via returnUrl

**Request Body Example:**
\`\`\`json
{
  "refreshUrl": "https://example.com/refresh",
  "returnUrl": "https://example.com/return"
}
\`\`\`

**Real Request Example:**
\`\`\`http
POST /v1/stripe/connect/account/acct_1234567890/link
Content-Type: application/json
Authorization: Bearer YOUR_ACCESS_TOKEN

{
  "refreshUrl": "https://example.com/refresh",
  "returnUrl": "https://example.com/return"
}
\`\`\`

**Request Parameters:**
- refreshUrl (required): Where to redirect if link expires - must be a valid HTTPS URL
- returnUrl (required): Where to redirect after onboarding complete - must be a valid HTTPS URL

**Onboarding Process:**
1. Seller clicks account link
2. Completes identity verification (KYC)
3. Adds business information
4. Adds bank account for payouts
5. Returns to your platform

**Response:**
- url: Onboarding link for seller
- expires_at: Link expiration time

**Use Cases:**
- New seller onboarding
- Account information updates
- Re-verification required
- Bank account changes`,
  },

  LIST_EXTERNAL_ACCOUNTS: {
    summary: 'List external accounts for Connect account',
  },

  CREATE_PAYOUT: {
    summary: 'Create a payout',
    description: `**Purpose:** Transfer funds from Connect account to seller's bank account.

**Why Use This API:**
- Pay sellers their earnings
- Transfer marketplace revenue to sellers
- Process seller payouts
- Complete the payment flow

**Real-Life Scenarios:**
1. **Marketplace Payout:** Seller's earnings transferred to bank account
2. **Weekly Payout:** Scheduled payout of accumulated revenue
3. **Manual Payout:** Admin-initiated payout to seller
4. **Revenue Distribution:** Platform distributes funds to sellers

**How It Works:**
- Transfers funds from Connect account balance
- Sends to seller's external bank account
- Takes 2-7 business days to arrive
- Can be instant in some regions (Stripe Instant Payouts)

**Request Parameters:**
- connectAccountId: Seller's Connect account ID
- amount: Payout amount in dollars
- currency: Currency code (usd, eur, etc.)
- externalAccountId: Bank account ID to receive payout
- description: Optional payout description

**Payout Flow:**
1. Customer pays platform
2. Platform takes application fee
3. Remaining amount in Connect account balance
4. Create Payout (this endpoint) → Transfer to seller's bank
5. Seller receives funds in 2-7 business days

**Response:**
- payoutId: Stripe payout ID
- status: pending, in_transit, paid, failed
- amount: Payout amount
- arrival_date: When funds will arrive

**Use Cases:**
- Weekly/monthly seller payouts
- On-demand payouts
- Revenue distribution
- Seller earnings withdrawal`,
  },

  CREATE_TRANSFER: {
    summary: 'Create a transfer (platform → connected account)',
    description: `**Purpose:** Move funds from your **platform Stripe balance** to a **connected account**.

**This is NOT a payout:**
- **Transfer** = platform → connected account (Stripe balance movement)
- **Payout** = connected account → bank account

**Common Flow (marketplace):**
1. Customer pays platform
2. Platform keeps application fee
3. Platform transfers seller amount to connected account (this endpoint)
4. (Optional) Connected account later creates payout to bank

**Request Body Example:**
\`\`\`json
{
  "connectAccountId": "acct_1234567890",
  "amount": 25.5,
  "currency": "usd",
  "description": "Seller earnings for order #123",
  "metadata": {
    "orderId": "123"
  }
}
\`\`\`

**Response:**
- id: Transfer ID (starts with tr_)
- amount: Amount in cents
- currency: Currency code
- destination: Connected account ID`,
  },

  GET_PAYOUT_STATUS: {
    summary: 'Get payout status',
    description: `**Purpose:** Retrieve the status and details of a payout for a connected account.

**Why Use This API:**
- Check payout status (pending, in_transit, paid, failed)
- Get payout details (amount, arrival date, description)
- Monitor payout progress
- Track payout history

**Real-Life Scenarios:**
1. **Status Check:** Check if payout has been processed
2. **Customer Support:** Verify payout status for customer inquiry
3. **Reconciliation:** Match payouts with accounting records
4. **Monitoring:** Track payout success/failure rates

**How It Works:**
- Retrieves payout from the specified connected account
- Returns current status and all payout details
- Requires connectAccountId because payouts belong to connected accounts

**Request Parameters:**
- id: Payout ID (starts with po_)
- connectAccountId: (Query param) Connect account ID that owns this payout

**Response:**
- id: Payout ID
- amount: Payout amount in cents
- currency: Currency code
- status: pending, in_transit, paid, failed, canceled
- arrivalDate: Timestamp when funds will arrive
- description: Optional payout description
- metadata: Custom tracking data

**Important:**
- connectAccountId is required because payouts belong to connected accounts
- Payout must exist in the specified connected account
- Use the same connectAccountId that was used when creating the payout`,
  },

  LIST_PAYOUTS: {
    summary: 'List payouts for Connect account',
  },

  CANCEL_PAYOUT: {
    summary: 'Cancel a payout',
  },

  GET_CONNECT_BALANCE: {
    summary: 'Get Connect account balance',
  },

  ADD_BANK_ACCOUNT: {
    summary: 'Add external bank account to Connect account',
    description: `**Purpose:** Programmatically add a bank account to a Stripe Connect account.

⚠️ **IMPORTANT - Account Type Restriction:**
- ❌ **NOT for Express accounts** - Will return 403 Forbidden
- ✅ **Only for Custom accounts** - Requires Custom account type
- ✅ **Express accounts** must use account links for onboarding instead

**Why This Restriction Exists:**
- Express accounts use Stripe-hosted onboarding (more secure, faster)
- Stripe handles KYC and bank account verification
- Platform cannot programmatically add bank accounts to Express accounts

**If You Get 403 Forbidden:**
\`\`\`json
{
  "status": 403,
  "detail": "This application does not have the required permissions..."
}
\`\`\`

**This means:** Your account is Express type. Use account links instead:
1. Create account link: \`POST /stripe/connect/account/:id/link\`
2. Seller completes onboarding (adds bank account via Stripe UI)
3. Check account status: \`GET /stripe/connect/account/:id\`

**When to Use This Endpoint:**
- ✅ You have a **Custom** Connect account (not Express)
- ✅ You need programmatic bank account management
- ✅ You handle KYC verification yourself

**Request Parameters:**
- connectAccountId: Stripe Connect account ID (must be Custom type)
- bankAccountNumber: Bank account number
- routingNumber: Bank routing number
- accountHolderName: Name on the bank account
- country: Two-letter country code (US, GB, etc.)
- currency: Currency code (usd, gbp, etc.)

**Response:**
- id: External account ID
- last4: Last 4 digits of account
- status: Account status (new, verified, etc.)
- country: Country code
- currency: Currency code

**Alternative for Express Accounts:**
Use account links for onboarding - sellers add bank accounts through Stripe's secure UI.`,
  },

  UPDATE_BANK_ACCOUNT: {
    summary: 'Update external bank account',
  },

  DELETE_BANK_ACCOUNT: {
    summary: 'Delete external bank account',
  },

  HANDLE_WEBHOOK: {
    summary: 'Handle Stripe webhook events',
  },
} as const;
