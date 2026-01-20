import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { API_VERSIONS } from '../../../../common/http/version.constants';
import { STRIPE_CONNECT_SERVICE_PORT } from '../../application/di-tokens';
import { CreateConnectAccountDto } from '../../application/dto/create-connect-account.dto';
import { CreateCustomerDto } from '../../application/dto/create-customer.dto';
import { CreatePaymentIntentDto } from '../../application/dto/create-payment-intent.dto';
import { CreatePayoutDto } from '../../application/dto/create-payout.dto';
import { PaymentIntentResponseDto } from '../../application/dto/payment-intent-response.dto';
import { RefundPaymentDto } from '../../application/dto/refund-payment.dto';
import { StripeConnectService } from '../../application/services/stripe-connect.service';
import { StripePaymentService } from '../../application/services/stripe-payment.service';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';

/**
 * Stripe Payment Controller
 * HTTP interface for Stripe payment operations
 */
@ApiTags('stripe')
@Controller({
  path: 'stripe',
  version: [API_VERSIONS.V1, API_VERSIONS.V2]
})
export class StripeController {
  constructor(
    private readonly stripePaymentService: StripePaymentService,
    private readonly stripeConnectService: StripeConnectService,
    @Inject(STRIPE_CONNECT_SERVICE_PORT)
    private readonly stripeConnectServicePort: StripeConnectServicePort,
    private readonly configService: ConfigService,
  ) {}

  @Post('payment-intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
- Must call "Capture Payment" to actually charge the customer`
  })
  @ApiBody({ type: CreatePaymentIntentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment intent created successfully',
    type: PaymentIntentResponseDto,
  })
  async createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    return this.stripePaymentService.createPaymentIntent(dto);
  }

  @Post('payment-intent/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a payment intent' })
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: {
          type: 'string',
          example: 'pm_1234567890',
        },
      },
      required: ['paymentMethodId'],
    },
  })
  async confirmPaymentIntent(
    @Param('id') paymentIntentId: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.stripePaymentService.confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId,
    );
  }

  @Post('payment-intent/:id/capture')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
- Marketplace: Capture when transaction is complete`
  })
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async capturePayment(@Param('id') paymentIntentId: string) {
    return this.stripePaymentService.capturePayment(paymentIntentId);
  }

  @Post('payment-intent/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
- Fraud prevention`
  })
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async cancelPayment(@Param('id') paymentIntentId: string) {
    return this.stripePaymentService.cancelPayment(paymentIntentId);
  }

  @Post('payment-intent/:id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
  })
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  @ApiBody({ type: RefundPaymentDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Refund processed successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 're_1234567890' },
        amount: { type: 'number', example: 5000 },
        currency: { type: 'string', example: 'usd' },
        status: { type: 'string', example: 'succeeded' },
        reason: { type: 'string', nullable: true, example: 'requested_by_customer' },
        receiptNumber: { type: 'string', nullable: true, example: '1234-5678' },
        metadata: { type: 'object', example: { refundId: 'REF-12345' } },
      },
    },
  })
  async refundPayment(
    @Param('id') paymentIntentId: string,
    @Body() dto?: RefundPaymentDto,
  ) {
    return this.stripePaymentService.refundPayment(paymentIntentId, dto || {});
  }

  @Post('payment-intents/bulk-refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk refund payment intents' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentIntentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of payment intent IDs to refund',
          example: ['pi_123', 'pi_456'],
        },
      },
      required: ['paymentIntentIds'],
    },
  })
  async bulkRefund(@Body('paymentIntentIds') paymentIntentIds: string[]) {
    return this.stripePaymentService.bulkRefundPaymentIntents(
      paymentIntentIds,
    );
  }

  @Get('create-card-save-intent')
  @ApiOperation({ summary: 'Get setup intent for saving payment methods' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          example: 'cus_1234567890',
        },
      },
      required: ['customerId'],
    },
  })
  async createCardSaveIntent(@Query('customerId') customerId: string) {
    const clientSecret =
      await this.stripePaymentService.createSetupIntent(customerId);
    return { clientSecret };
  }

  @Post('save-payment-method')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
- Secure storage by Stripe`
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        paymentMethodId: {
          type: 'string',
          example: 'pm_1234567890',
        },
        customerId: {
          type: 'string',
          example: 'cus_1234567890',
        },
        setAsDefault: {
          type: 'boolean',
          description: 'Whether to set this as the default payment method',
          example: true,
        },
      },
      required: ['paymentMethodId', 'customerId'],
    },
  })
  async savePaymentMethod(
    @Body('paymentMethodId') paymentMethodId: string,
    @Body('customerId') customerId: string,
    @Body('setAsDefault') setAsDefault?: boolean,
  ) {
    return this.stripePaymentService.savePaymentMethod(
      paymentMethodId,
      customerId,
      setAsDefault !== false,
    );
  }

  @Get('payment-intent/:id/status')
  @ApiOperation({ summary: 'Get payment intent status' })
  @ApiParam({ name: 'id', description: 'Payment intent ID' })
  async getPaymentIntentStatus(@Param('id') paymentIntentId: string) {
    return this.stripePaymentService.getPaymentIntentStatus(paymentIntentId);
  }

  @Post('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
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
- Create subscriptions for recurring billing`
  })
  @ApiBody({ type: CreateCustomerDto })
  async createCustomer(@Body() dto: CreateCustomerDto) {
    const customerId = await this.stripePaymentService.createCustomer(dto);
    return { customerId };
  }

  @Get('customer/:email')
  @ApiOperation({
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
- Use this to retrieve customerId for returning users`
  })
  @ApiParam({ name: 'email', description: 'Customer email address' })
  async getCustomerIdByEmail(@Param('email') email: string) {
    const customerId =
      await this.stripePaymentService.getCustomerIdByEmail(email);
    if (!customerId) {
      return { customerId: null };
    }
    return { customerId };
  }

  @Get('customer/:id/payment-method')
  @ApiOperation({ summary: 'Get default payment method for a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  async getDefaultPaymentMethod(@Param('id') customerId: string) {
    return this.stripePaymentService.getDefaultPaymentMethod(customerId);
  }

  @Post('setup-intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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
- Use in "Create Payment Intent" with customerId`
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerId: {
          type: 'string',
          example: 'cus_1234567890',
        },
      },
      required: ['customerId'],
    },
  })
  async createSetupIntent(@Body('customerId') customerId: string) {
    const clientSecret =
      await this.stripePaymentService.createSetupIntent(customerId);
    return { clientSecret };
  }

  // Stripe Connect endpoints

  @Post('connect/account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
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
- Account ready for payouts`
  })
  @ApiBody({ type: CreateConnectAccountDto })
  async createConnectAccount(@Body() dto: CreateConnectAccountDto) {
    return this.stripeConnectService.createConnectAccount(dto);
  }

  @Get('connect/account/:id')
  @ApiOperation({ summary: 'Get Connect account details' })
  @ApiParam({ name: 'id', description: 'Connect account ID' })
  async getConnectAccount(@Param('id') accountId: string) {
    return this.stripeConnectService.getConnectAccount(accountId);
  }

  @Post('connect/account/:id/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
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

**Request Parameters:**
- refreshUrl: Where to redirect if link expires
- returnUrl: Where to redirect after onboarding complete

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
- Bank account changes`
  })
  @ApiParam({ name: 'id', description: 'Connect account ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshUrl: {
          type: 'string',
          example: 'https://example.com/refresh',
        },
        returnUrl: {
          type: 'string',
          example: 'https://example.com/return',
        },
      },
      required: ['refreshUrl', 'returnUrl'],
    },
  })
  async createAccountLink(
    @Param('id') accountId: string,
    @Body('refreshUrl') refreshUrl: string,
    @Body('returnUrl') returnUrl: string,
  ) {
    return this.stripeConnectService.createAccountLink(
      accountId,
      refreshUrl,
      returnUrl,
    );
  }

  @Get('connect/account/:id/external-accounts')
  @ApiOperation({ summary: 'List external accounts for Connect account' })
  @ApiParam({ name: 'id', description: 'Connect account ID' })
  async listExternalAccounts(@Param('id') connectAccountId: string) {
    return this.stripeConnectService.listExternalAccounts(connectAccountId);
  }

  @Post('connect/payout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
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
- Seller earnings withdrawal`
  })
  @ApiBody({ type: CreatePayoutDto })
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.stripeConnectService.createPayout(dto);
  }

  @Get('connect/payout/:id')
  @ApiOperation({ summary: 'Get payout status' })
  @ApiParam({ name: 'id', description: 'Payout ID' })
  async getPayoutStatus(@Param('id') payoutId: string) {
    return this.stripeConnectService.getPayoutStatus(payoutId);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'List payouts for Connect account' })
  async listPayouts(
    @Query('connectAccountId') connectAccountId: string,
    @Query('limit') limit?: number,
  ) {
    return this.stripeConnectService.listPayouts(
      connectAccountId,
      limit ? parseInt(limit.toString()) : undefined,
    );
  }

  @Post('payouts/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a payout' })
  @ApiParam({ name: 'id', description: 'Payout ID' })
  async cancelPayout(@Param('id') payoutId: string) {
    return this.stripeConnectService.cancelPayout(payoutId);
  }

  @Get('payouts/balance')
  @ApiOperation({ summary: 'Get Connect account balance' })
  async getPayoutBalance(@Query('connectAccountId') connectAccountId: string) {
    return this.stripeConnectService.getConnectBalance(connectAccountId);
  }

  @Post('payouts/add-bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add external bank account to Connect account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        connectAccountId: { type: 'string', example: 'acct_123' },
        bankAccountNumber: { type: 'string', example: '000123456789' },
        routingNumber: { type: 'string', example: '110000000' },
        accountHolderName: { type: 'string', example: 'John Doe' },
        country: { type: 'string', example: 'US' },
        currency: { type: 'string', example: 'usd' },
        metadata: { type: 'object' },
      },
      required: [
        'connectAccountId',
        'bankAccountNumber',
        'routingNumber',
        'accountHolderName',
        'country',
      ],
    },
  })
  async addBankAccount(@Body() body: any) {
    return this.stripeConnectService.createExternalBankAccount({
      connectAccountId: body.connectAccountId,
      bankAccountNumber: body.bankAccountNumber,
      routingNumber: body.routingNumber,
      accountHolderName: body.accountHolderName,
      country: body.country,
      currency: body.currency,
      metadata: body.metadata,
    });
  }

  @Patch('payouts/add-bank-accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update external bank account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        connectAccountId: { type: 'string', example: 'acct_123' },
        externalAccountId: { type: 'string', example: 'ba_123' },
        bankAccountNumber: { type: 'string', example: '000123456789' },
        routingNumber: { type: 'string', example: '110000000' },
        accountHolderName: { type: 'string', example: 'John Doe' },
        country: { type: 'string', example: 'US' },
        currency: { type: 'string', example: 'usd' },
        metadata: { type: 'object' },
      },
      required: [
        'connectAccountId',
        'externalAccountId',
        'bankAccountNumber',
        'routingNumber',
        'accountHolderName',
        'country',
      ],
    },
  })
  async updateBankAccount(@Body() body: any) {
    return this.stripeConnectService.updateExternalBankAccount({
      connectAccountId: body.connectAccountId,
      externalAccountId: body.externalAccountId,
      bankAccountNumber: body.bankAccountNumber,
      routingNumber: body.routingNumber,
      accountHolderName: body.accountHolderName,
      country: body.country,
      currency: body.currency,
      metadata: body.metadata,
    });
  }

  @Delete('payouts/delete-bank-accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete external bank account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        connectAccountId: { type: 'string', example: 'acct_123' },
        externalAccountId: { type: 'string', example: 'ba_123' },
      },
      required: ['connectAccountId', 'externalAccountId'],
    },
  })
  async deleteBankAccount(@Body() body: any) {
    await this.stripeConnectService.deleteExternalAccount(
      body.connectAccountId,
      body.externalAccountId,
    );
    return { success: true };
  }

  @Get('connect/account/:id/balance')
  @ApiOperation({ summary: 'Get Connect account balance' })
  @ApiParam({ name: 'id', description: 'Connect account ID' })
  async getConnectBalance(@Param('id') connectAccountId: string) {
    return this.stripeConnectService.getConnectBalance(connectAccountId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req['rawBody'] as string | Uint8Array;

    if (!rawBody) {
      throw new Error('Raw body is required for webhook verification');
    }

    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required');
    }

    const event = await this.stripeConnectService.verifyWebhookSignature(
      rawBody,
      signature,
      webhookSecret,
    );

    // Handle different webhook event types
    // This is a boilerplate - implement your specific webhook handling logic
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle payment intent succeeded
        break;
      case 'payment_intent.payment_failed':
        // Handle payment intent failed
        break;
      case 'payout.paid':
        // Handle payout paid
        break;
      case 'payout.failed':
        // Handle payout failed
        break;
      default:
        // Handle other event types
        break;
    }

    return { received: true, type: event.type };
  }
}
