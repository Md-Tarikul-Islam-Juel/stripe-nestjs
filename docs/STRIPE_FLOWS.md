# Stripe Payment Flows - Simple Guide

Easy-to-follow guides for implementing Stripe payments in your application.

## 🚀 Quick Navigation

- [💳 Save Card Flow](#-save-card-flow) - Let customers save cards for faster checkout
- [💰 Complete Payment Flow](#-complete-payment-flow) - Process payments from start to finish
- [🔄 Refund Flow](#-refund-flow) - Give money back to customers
- [👤 Customer Management](#-customer-management) - Create and find customers
- [🏪 Marketplace Flow](#-marketplace-flow) - Multi-seller payment processing

---

## 💳 Save Card Flow

**What it does:** Save a customer's card securely so they don't have to enter it again.

**In simple terms:** Like saving a card in your phone's wallet - you enter it once, use it many times.

### ⚡ Quick Start (3 Steps)

1. **Create customer** → Get `customerId`
2. **Get setup secret** → Get `clientSecret` 
3. **Save card** → Frontend collects card, backend saves it

### 📋 Complete Step-by-Step

#### Step 1: Create Customer

**Call this API:**
```http
POST /v1/stripe/customer
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

**You get back:**
```json
{
  "customerId": "cus_1234567890"
}
```

💡 **Tip:** Check if customer exists first:
```http
GET /v1/stripe/customer/customer@example.com
```

---

#### Step 2: Get Setup Secret

**Call this API:**
```http
POST /v1/stripe/setup-intent
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "customerId": "cus_1234567890"
}
```

**You get back:**
```json
{
  "clientSecret": "seti_1234567890_secret_abcdefghijklmnop"
}
```

---

#### Step 3: Frontend - Collect Card (Copy & Paste Ready)

**Add this to your HTML page:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>Save Card</title>
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body>
  <div id="card-element"></div>
  <button id="save-card-btn">Save Card</button>
  <div id="result"></div>

  <script>
    // Replace with your publishable key
    const stripe = Stripe('pk_test_YOUR_KEY_HERE');
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');

    document.getElementById('save-card-btn').addEventListener('click', async () => {
      // Replace with clientSecret from Step 2
      const clientSecret = 'seti_1234567890_secret_abcdefghijklmnop';
      
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        document.getElementById('result').innerHTML = 'Error: ' + error.message;
      } else {
        // Card saved! Now save to your backend
        const paymentMethodId = setupIntent.payment_method;
        await saveToBackend(paymentMethodId);
      }
    });

    async function saveToBackend(paymentMethodId) {
      const response = await fetch('http://localhost:3000/v1/stripe/save-payment-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethodId,
          customerId: 'cus_1234567890', // From Step 1
          setAsDefault: true
        })
      });
      
      const result = await response.json();
      document.getElementById('result').innerHTML = 'Card saved! ' + JSON.stringify(result);
    }
  </script>
</body>
</html>
```

---

#### Step 4: Save to Backend

**Call this API:**
```http
POST /v1/stripe/save-payment-method
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890",
  "customerId": "cus_1234567890",
  "setAsDefault": true
}
```

**You get back:**
```json
{
  "success": true,
  "paymentMethodId": "pm_1234567890",
  "customerId": "cus_1234567890"
}
```

✅ **Done!** Card is now saved and can be used for future payments.

### 🎯 Real-World Example

**Scenario:** User wants to save card during checkout

```javascript
// 1. User clicks "Save card for next time"
// 2. Frontend calls your API to get setup intent
const response = await fetch('/v1/stripe/setup-intent', {
  method: 'POST',
  body: JSON.stringify({ customerId: 'cus_123' })
});
const { clientSecret } = await response.json();

// 3. User enters card in Stripe Elements
// 4. Card is saved securely by Stripe
// 5. You get paymentMethodId back
// 6. Save it to your backend
```

### ⚠️ Common Mistakes

- ❌ **Don't** send card numbers to your backend (use Stripe.js only)
- ❌ **Don't** forget to include `Authorization` header
- ✅ **Do** use `clientSecret` from setup intent (not payment intent)
- ✅ **Do** handle errors from Stripe.js

---

## 💰 Complete Payment Flow

**What it does:** Charge a customer's card for a purchase.

**In simple terms:** Like a credit card machine - authorize first, charge later when you ship the item.

### ⚡ Quick Start (4 Steps)

1. **Create payment** → Get `clientSecret`
2. **Customer enters card** → Frontend collects payment
3. **Payment authorized** → Money is held (not charged yet)
4. **Capture payment** → Actually charge the card (when you ship)

### 📋 Complete Step-by-Step

#### Step 1: Create Payment Intent

**Call this API:**
```http
POST /v1/stripe/payment-intent
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 100.00,
  "currency": "usd",
  "customerEmail": "customer@example.com",
  "description": "Order #12345"
}
```

**You get back:**
```json
{
  "clientSecret": "pi_1234567890_secret_abcdefghijklmnop",
  "paymentIntentId": "pi_1234567890"
}
```

💡 **Save the `paymentIntentId`** - you'll need it later!

---

#### Step 2: Frontend - Collect Payment (Copy & Paste Ready)

**Add this to your checkout page:**

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://js.stripe.com/v3/"></script>
</head>
<body>
  <div id="card-element"></div>
  <button id="pay-btn">Pay $100.00</button>
  <div id="result"></div>

  <script>
    const stripe = Stripe('pk_test_YOUR_KEY_HERE');
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');

    document.getElementById('pay-btn').addEventListener('click', async () => {
      // Replace with clientSecret from Step 1
      const clientSecret = 'pi_1234567890_secret_abcdefghijklmnop';
      
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        document.getElementById('result').innerHTML = 'Payment failed: ' + error.message;
      } else if (paymentIntent.status === 'requires_capture') {
        document.getElementById('result').innerHTML = 
          'Payment authorized! Order will be charged when shipped.';
        // Payment is authorized, ready to capture later
      }
    });
  </script>
</body>
</html>
```

---

#### Step 3: Capture Payment (When You Ship)

**When to capture:**
- ✅ Order shipped
- ✅ Service delivered  
- ✅ Event confirmed

**Call this API:**
```http
POST /v1/stripe/payment-intent/pi_1234567890/capture
Authorization: Bearer YOUR_TOKEN
```

**You get back:**
```json
{
  "id": "pi_1234567890",
  "status": "succeeded",
  "amount": 10000,
  "amount_received": 10000,
  "currency": "usd"
}
```

✅ **Done!** Customer has been charged.

### 📊 Payment States Explained

| Status | What It Means | What To Do |
|--------|---------------|------------|
| `requires_payment_method` | Waiting for card | Customer needs to enter card |
| `requires_confirmation` | Card entered, needs confirmation | Confirm the payment |
| `requires_capture` | ✅ **Authorized** - Money held | Capture when you ship |
| `succeeded` | ✅ **Charged** - Money received | All done! |
| `canceled` | Payment canceled | Nothing to do |

### 🎯 Real-World Example

**E-commerce checkout:**

```javascript
// 1. Customer adds items to cart ($100 total)
// 2. Click "Checkout"
const { clientSecret } = await createPaymentIntent(100.00);

// 3. Customer enters card and pays
// 4. Payment authorized (money held, not charged)

// 5. Order ships
await capturePayment(paymentIntentId);

// 6. Customer charged $100 ✅
```

### ⚠️ Important Notes

- 💰 **Amounts:** Send in dollars (`100.00`), Stripe converts to cents (`10000`)
- ⏰ **Capture timing:** Capture within 7 days or authorization expires
- 🔒 **Security:** Card details never touch your server (handled by Stripe.js)

---

## 🔄 Refund Flow

**What it does:** Give money back to a customer.

**In simple terms:** Like returning something to a store - you get your money back.

### ⚡ Quick Start

**Full refund:**
```http
POST /v1/stripe/payment-intent/pi_1234567890/refund
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{}
```

**Partial refund ($50 back from $100):**
```http
POST /v1/stripe/payment-intent/pi_1234567890/refund
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 50.00,
  "reason": "requested_by_customer"
}
```

### 📋 Step-by-Step

#### Full Refund

**Request:**
```json
{
  "reason": "requested_by_customer"
}
```

**Or just send empty object:**
```json
{}
```

**Response:**
```json
{
  "id": "re_1234567890",
  "amount": 10000,
  "status": "succeeded",
  "reason": "requested_by_customer"
}
```

#### Partial Refund

**Request:**
```json
{
  "amount": 50.00,
  "reason": "requested_by_customer",
  "metadata": {
    "orderId": "12345",
    "note": "Damaged item discount"
  }
}
```

**Response:**
```json
{
  "id": "re_1234567890",
  "amount": 5000,
  "status": "succeeded"
}
```

### 💡 Refund Reasons

- `requested_by_customer` - Customer asked for refund
- `duplicate` - Charged twice by mistake
- `fraudulent` - Fraud detected

### ⏰ Refund Timeline

- **Created:** Immediately
- **Customer gets money:** 5-10 business days (bank processing)

### 🎯 Real-World Example

**Customer returns item:**

```javascript
// Customer returns item worth $50 from $100 order
const refund = await refundPayment(paymentIntentId, {
  amount: 50.00,
  reason: 'requested_by_customer',
  metadata: { orderId: '12345', reason: 'Item returned' }
});

// Customer gets $50 back
// You keep $50
```

---

## 👤 Customer Management

**What it does:** Create and find customer records in Stripe.

**In simple terms:** Like a customer database - store customer info so you can charge them later.

### ⚡ Quick Start

**Create customer:**
```http
POST /v1/stripe/customer
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

**Find customer:**
```http
GET /v1/stripe/customer/customer@example.com
Authorization: Bearer YOUR_TOKEN
```

**Get saved card:**
```http
GET /v1/stripe/customer/cus_1234567890/payment-method
Authorization: Bearer YOUR_TOKEN
```

### 📋 Step-by-Step

#### Create Customer

**Request:**
```json
{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "customerId": "cus_1234567890"
}
```

#### Find Customer by Email

**Request:**
```http
GET /v1/stripe/customer/customer@example.com
```

**Response (found):**
```json
{
  "customerId": "cus_1234567890"
}
```

**Response (not found):**
```json
{
  "customerId": null
}
```

#### Get Saved Card

**Request:**
```http
GET /v1/stripe/customer/cus_1234567890/payment-method
```

**Response:**
```json
{
  "paymentMethodId": "pm_1234567890",
  "card": {
    "brand": "visa",
    "last4": "4242",
    "exp_month": 12,
    "exp_year": 2025
  }
}
```

### 🎯 Common Workflow

```javascript
// 1. User signs up
const customer = await createCustomer(user.email);
// Returns: { customerId: "cus_123" }

// 2. User saves card (see Save Card Flow)
// Card is now linked to customer

// 3. User makes purchase
// Use customerId when creating payment intent
const payment = await createPaymentIntent({
  amount: 100.00,
  customerId: "cus_123" // Use saved customer
});

// 4. Payment uses saved card automatically!
```

---

## 🏪 Marketplace Flow

**What it does:** Enable marketplace payments where you take a fee and sellers get paid.

**In simple terms:** Like Etsy or Airbnb - customer pays you, you keep a fee, seller gets the rest.

### ⚡ Quick Start (6 Steps)

1. **Create seller account** → Get `accountId`
2. **Get onboarding link** → Seller completes setup
3. **Add bank account** → Seller adds bank details
4. **Customer pays** → Money split (you get fee, seller gets rest)
5. **Create payout** → Send money to seller's bank
6. **Check status** → See if payout succeeded

### 📋 Step-by-Step

#### Step 1: Create Seller Account

**Call this API:**
```http
POST /v1/stripe/connect/account
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "country": "US",
  "email": "seller@example.com",
  "businessName": "Seller Shop"
}
```

**You get back:**
```json
{
  "accountId": "acct_1234567890",
  "status": "pending"
}
```

---

#### Step 2: Get Onboarding Link

**Call this API:**
```http
POST /v1/stripe/connect/account/acct_1234567890/link
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "refreshUrl": "https://yourapp.com/onboarding/refresh",
  "returnUrl": "https://yourapp.com/onboarding/complete"
}
```

**You get back:**
```json
{
  "url": "https://connect.stripe.com/setup/s/acct_xxx/xxx",
  "expires_at": 1234567890
}
```

**What seller does:**
1. Click the `url` link
2. Complete identity verification (KYC)
3. Add bank account details
4. Returns to your `returnUrl`
5. Account is now active ✅

---

#### Step 3: Add Bank Account (Alternative Method)

**Call this API:**
```http
POST /v1/stripe/payouts/add-bank-accounts
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "connectAccountId": "acct_1234567890",
  "bankAccountNumber": "000123456789",
  "routingNumber": "110000000",
  "accountHolderName": "John Doe",
  "country": "US",
  "currency": "usd"
}
```

**You get back:**
```json
{
  "id": "ba_1234567890",
  "status": "new"
}
```

💡 **Note:** Stripe will send 2 small deposits to verify the account (micro-deposits).

---

#### Step 4: Customer Pays (With Your Fee)

**When creating payment intent, add application fee:**

```javascript
// Customer pays $100
// You take $10 fee (10%)
// Seller gets $90

const paymentIntent = await createPaymentIntent({
  amount: 100.00,
  currency: 'usd',
  // Add these for marketplace:
  applicationFeeAmount: 10.00, // Your fee
  connectAccountId: 'acct_1234567890' // Seller's account
});
```

**What happens:**
- Customer pays $100
- $10 goes to your account (fee)
- $90 goes to seller's Connect account balance

---

#### Step 5: Pay Seller

**Call this API:**
```http
POST /v1/stripe/connect/payout
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "connectAccountId": "acct_1234567890",
  "amount": 90.00,
  "currency": "usd",
  "externalAccountId": "ba_1234567890",
  "description": "Payout for order #12345"
}
```

**You get back:**
```json
{
  "id": "po_1234567890",
  "status": "pending",
  "amount": 9000,
  "arrival_date": 1234567890
}
```

---

#### Step 6: Check Payout Status

**Call this API:**
```http
GET /v1/stripe/connect/payout/po_1234567890
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "id": "po_1234567890",
  "status": "paid",
  "amount": 9000,
  "arrival_date": 1234567890
}
```

### 📊 Payout Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Created, waiting to send |
| `in_transit` | Sent, on the way to bank |
| `paid` | ✅ Money arrived in seller's bank |
| `failed` | Failed (wrong account, etc.) |
| `canceled` | You canceled it |

### 🎯 Real-World Example

**Marketplace scenario:**

```
1. Seller signs up → Create Connect account
2. Seller completes onboarding → Adds bank account
3. Customer buys $100 product
4. You take $10 fee → Seller gets $90
5. Weekly payout → Send $90 to seller's bank
6. Seller receives money in 2-7 days ✅
```

---

## 📝 Important Notes

### 💰 Amount Format

- **Send to API:** Dollars (`100.00`)
- **Stripe uses:** Cents (`10000`)
- **Conversion:** API automatically converts for you

### 🔒 Security

- ✅ Card numbers **never** touch your server
- ✅ All handled by Stripe.js on frontend
- ✅ PCI compliant automatically
- ✅ Only `paymentMethodId` sent to backend

### ⏰ Timing

- **Authorization:** Holds money for 7 days max
- **Capture:** Must capture before authorization expires
- **Refunds:** Process immediately, customer gets money in 5-10 days
- **Payouts:** Take 2-7 business days to arrive

### 🐛 Common Issues

**Problem:** Payment fails
- ✅ Check card details are correct
- ✅ Check customer has enough funds
- ✅ Check Stripe dashboard for error details

**Problem:** Can't capture payment
- ✅ Make sure payment is in `requires_capture` status
- ✅ Check authorization hasn't expired (7 days)

**Problem:** Refund not working
- ✅ Payment must be captured first (can't refund authorization)
- ✅ Check payment intent ID is correct

---

## 🔗 Quick Links

- [Main README](../README.md) - Project overview
- [API Docs](http://localhost:3000/api) - Interactive Swagger documentation
- [Stripe Docs](https://stripe.com/docs) - Official Stripe documentation

---

## 💡 Need Help?

- Check the [API endpoints table](../README.md#-api-documentation) in main README
- Use [Postman Collection](../README.md#-postman-collection) for testing
- Review [Stripe Dashboard](https://dashboard.stripe.com) for transaction details
