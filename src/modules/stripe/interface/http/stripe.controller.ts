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
  ApiQuery,
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
import { CreateTopupDto } from '../../application/dto/create-topup.dto';
import { CreateTransferDto } from '../../application/dto/create-transfer.dto';
import { PaymentIntentResponseDto } from '../../application/dto/payment-intent-response.dto';
import { RefundPaymentDto } from '../../application/dto/refund-payment.dto';
import { StripeConnectService } from '../../application/services/stripe-connect.service';
import { StripePaymentService } from '../../application/services/stripe-payment.service';
import { StripeConnectServicePort } from '../../domain/ports/stripe.service.port';
import { STRIPE_API_DESCRIPTIONS } from './stripe.api-descriptions';

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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_PAYMENT_INTENT)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CONFIRM_PAYMENT_INTENT)
  @ApiParam({ 
    name: 'id', 
    description: 'Payment intent ID',
    example: 'pi_1234567890',
    type: String
  })
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CAPTURE_PAYMENT_INTENT)
  @ApiParam({ 
    name: 'id', 
    description: 'Payment intent ID',
    example: 'pi_1234567890',
    type: String
  })
  async capturePayment(@Param('id') paymentIntentId: string) {
    return this.stripePaymentService.capturePayment(paymentIntentId);
  }

  @Post('payment-intent/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CANCEL_PAYMENT_INTENT)
  @ApiParam({ 
    name: 'id', 
    description: 'Payment intent ID',
    example: 'pi_1234567890',
    type: String
  })
  async cancelPayment(@Param('id') paymentIntentId: string) {
    return this.stripePaymentService.cancelPayment(paymentIntentId);
  }

  @Post('payment-intent/:id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.REFUND_PAYMENT)
  @ApiParam({ 
    name: 'id', 
    description: 'Payment intent ID',
    example: 'pi_1234567890',
    type: String
  })
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.BULK_REFUND)
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

  @Post('topup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_TOPUP)
  @ApiBody({ type: CreateTopupDto })
  async createTopup(@Body() dto: CreateTopupDto) {
    return this.stripePaymentService.createTopup({
      amount: dto.amount,
      currency: dto.currency,
      source: dto.source,
      description: dto.description,
      metadata: dto.metadata,
    });
  }

  @Get('create-card-save-intent')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_SETUP_INTENT)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.SAVE_PAYMENT_METHOD)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_PAYMENT_INTENT_STATUS)
  @ApiParam({ 
    name: 'id', 
    description: 'Payment intent ID',
    example: 'pi_1234567890',
    type: String
  })
  async getPaymentIntentStatus(@Param('id') paymentIntentId: string) {
    return this.stripePaymentService.getPaymentIntentStatus(paymentIntentId);
  }

  @Post('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_CUSTOMER)
  @ApiBody({ type: CreateCustomerDto })
  async createCustomer(@Body() dto: CreateCustomerDto) {
    const customerId = await this.stripePaymentService.createCustomer(dto);
    return { customerId };
  }

  @Get('customer/:email')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_CUSTOMER_BY_EMAIL)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_DEFAULT_PAYMENT_METHOD)
  @ApiParam({ 
    name: 'id', 
    description: 'Customer ID',
    example: 'cus_1234567890',
    type: String
  })
  async getDefaultPaymentMethod(@Param('id') customerId: string) {
    return this.stripePaymentService.getDefaultPaymentMethod(customerId);
  }

  @Post('setup-intent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_SETUP_INTENT)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_CONNECT_ACCOUNT)
  @ApiBody({ type: CreateConnectAccountDto })
  async createConnectAccount(@Body() dto: CreateConnectAccountDto) {
    return this.stripeConnectService.createConnectAccount(dto);
  }

  @Get('connect/account/:id')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_CONNECT_ACCOUNT)
  @ApiParam({ 
    name: 'id', 
    description: 'Connect account ID',
    example: 'acct_1234567890',
    type: String
  })
  @ApiQuery({
    name: 'refreshUrl',
    required: false,
    description: 'URL to redirect if onboarding link expires (required if account incomplete)',
    example: 'https://example.com/refresh',
  })
  @ApiQuery({
    name: 'returnUrl',
    required: false,
    description: 'URL to redirect after onboarding complete (required if account incomplete)',
    example: 'https://example.com/return',
  })
  async getConnectAccount(
    @Param('id') accountId: string,
    @Query('refreshUrl') refreshUrl?: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    return this.stripeConnectService.getConnectAccount(
      accountId,
      refreshUrl,
      returnUrl,
    );
  }

  @Post('connect/account/:id/link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_ACCOUNT_LINK)
  @ApiParam({ 
    name: 'id', 
    description: 'Connect account ID',
    example: 'acct_1234567890',
    type: String
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshUrl: {
          type: 'string',
          example: 'https://example.com/refresh',
          description: 'Optional if STRIPE_CONNECT_REFRESH_URL is set in .env',
        },
        returnUrl: {
          type: 'string',
          example: 'https://example.com/return',
          description: 'Optional if STRIPE_CONNECT_RETURN_URL is set in .env',
        },
      },
      required: [],
    },
  })
  async createAccountLink(
    @Param('id') accountId: string,
    @Body('refreshUrl') refreshUrl?: string,
    @Body('returnUrl') returnUrl?: string,
  ) {
    return this.stripeConnectService.createAccountLink(
      accountId,
      refreshUrl,
      returnUrl,
    );
  }

  @Get('connect/account/:id/external-accounts')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.LIST_EXTERNAL_ACCOUNTS)
  @ApiParam({ 
    name: 'id', 
    description: 'Connect account ID',
    example: 'acct_1234567890',
    type: String
  })
  async listExternalAccounts(@Param('id') connectAccountId: string) {
    return this.stripeConnectService.listExternalAccounts(connectAccountId);
  }

  @Post('connect/payout')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_PAYOUT)
  @ApiBody({ type: CreatePayoutDto })
  async createPayout(@Body() dto: CreatePayoutDto) {
    return this.stripeConnectService.createPayout(dto);
  }

  @Post('connect/transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CREATE_TRANSFER)
  @ApiBody({ type: CreateTransferDto })
  async createTransfer(@Body() dto: CreateTransferDto) {
    return this.stripeConnectService.createTransfer({
      amount: dto.amount,
      currency: dto.currency,
      destination: dto.connectAccountId,
      description: dto.description,
      metadata: dto.metadata,
    });
  }

  @Get('connect/payout/:id')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_PAYOUT_STATUS)
  @ApiParam({ 
    name: 'id', 
    description: 'Payout ID',
    example: 'po_1234567890',
    type: String
  })
  @ApiQuery({
    name: 'connectAccountId',
    description: 'Connect account ID that owns this payout',
    example: 'acct_1234567890',
    required: true,
    type: String
  })
  async getPayoutStatus(
    @Param('id') payoutId: string,
    @Query('connectAccountId') connectAccountId: string,
  ) {
    return this.stripeConnectService.getPayoutStatus(payoutId, connectAccountId);
  }

  @Get('payouts')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.LIST_PAYOUTS)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.CANCEL_PAYOUT)
  @ApiParam({ 
    name: 'id', 
    description: 'Payout ID',
    example: 'po_1234567890',
    type: String
  })
  async cancelPayout(@Param('id') payoutId: string) {
    return this.stripeConnectService.cancelPayout(payoutId);
  }

  @Get('payouts/balance')
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_CONNECT_BALANCE)
  async getPayoutBalance(@Query('connectAccountId') connectAccountId: string) {
    return this.stripeConnectService.getConnectBalance(connectAccountId);
  }

  @Post('payouts/add-bank-accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.ADD_BANK_ACCOUNT)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.UPDATE_BANK_ACCOUNT)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.DELETE_BANK_ACCOUNT)
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
  @ApiOperation(STRIPE_API_DESCRIPTIONS.GET_CONNECT_BALANCE)
  @ApiParam({ 
    name: 'id', 
    description: 'Connect account ID',
    example: 'acct_1234567890',
    type: String
  })
  async getConnectBalance(@Param('id') connectAccountId: string) {
    return this.stripeConnectService.getConnectBalance(connectAccountId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation(STRIPE_API_DESCRIPTIONS.HANDLE_WEBHOOK)
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
