import { Inject, Injectable } from '@nestjs/common';
import { StripePaymentServicePort } from '../../domain/ports/stripe.service.port';
import { BulkRefundPaymentCommand } from '../commands/bulk-refund-payment.command';
import { ConfirmPaymentIntentCommand } from '../commands/confirm-payment-intent.command';
import { CreateCustomerCommand } from '../commands/create-customer.command';
import { CreatePaymentIntentCommand } from '../commands/create-payment-intent.command';
import { RefundPaymentCommand } from '../commands/refund-payment.command';
import { SavePaymentMethodCommand } from '../commands/save-payment-method.command';
import { STRIPE_PAYMENT_SERVICE_PORT } from '../di-tokens';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CreatePaymentIntentDto } from '../dto/create-payment-intent.dto';
import { PaymentIntentResponseDto } from '../dto/payment-intent-response.dto';
import { BulkRefundPaymentUseCase } from '../use-cases/bulk-refund-payment.use-case';
import { CancelPaymentUseCase } from '../use-cases/cancel-payment.use-case';
import { CapturePaymentUseCase } from '../use-cases/capture-payment.use-case';
import { ConfirmPaymentIntentUseCase } from '../use-cases/confirm-payment-intent.use-case';
import { CreateCustomerUseCase } from '../use-cases/create-customer.use-case';
import { CreatePaymentIntentUseCase } from '../use-cases/create-payment-intent.use-case';
import { CreateSetupIntentUseCase } from '../use-cases/create-setup-intent.use-case';
import { GetPaymentIntentStatusUseCase } from '../use-cases/get-payment-intent-status.use-case';
import { RefundPaymentUseCase } from '../use-cases/refund-payment.use-case';
import { SavePaymentMethodUseCase } from '../use-cases/save-payment-method.use-case';

/**
 * Stripe Payment Application Service
 * Facade service that orchestrates payment operations by calling use-cases
 * Similar to AuthService pattern - acts as a facade between controller and use-cases
 */
@Injectable()
export class StripePaymentService {
  constructor(
    private readonly createPaymentIntentUseCase: CreatePaymentIntentUseCase,
    private readonly confirmPaymentIntentUseCase: ConfirmPaymentIntentUseCase,
    private readonly capturePaymentUseCase: CapturePaymentUseCase,
    private readonly cancelPaymentUseCase: CancelPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
    private readonly bulkRefundPaymentUseCase: BulkRefundPaymentUseCase,
    private readonly getPaymentIntentStatusUseCase: GetPaymentIntentStatusUseCase,
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly createSetupIntentUseCase: CreateSetupIntentUseCase,
    private readonly savePaymentMethodUseCase: SavePaymentMethodUseCase,
    @Inject(STRIPE_PAYMENT_SERVICE_PORT)
    private readonly stripePaymentService: StripePaymentServicePort,
  ) {}

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponseDto> {
    const command = CreatePaymentIntentCommand.fromDto(dto);
    return this.createPaymentIntentUseCase.execute(command);
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ) {
    const command = new ConfirmPaymentIntentCommand(
      paymentIntentId,
      paymentMethodId,
    );
    return this.confirmPaymentIntentUseCase.execute(command);
  }

  async capturePayment(paymentIntentId: string) {
    return this.capturePaymentUseCase.execute(paymentIntentId);
  }

  async cancelPayment(paymentIntentId: string) {
    return this.cancelPaymentUseCase.execute(paymentIntentId);
  }

  async refundPayment(
    paymentIntentId: string,
    dto: {
      amount?: number;
      reason?: string;
      metadata?: Record<string, string>;
      reverseTransfer?: boolean;
      refundApplicationFee?: boolean;
    },
  ) {
    const command = RefundPaymentCommand.fromDto(paymentIntentId, dto as any);
    return this.refundPaymentUseCase.execute(command);
  }

  async bulkRefundPaymentIntents(paymentIntentIds: string[]) {
    const command = new BulkRefundPaymentCommand(paymentIntentIds);
    return this.bulkRefundPaymentUseCase.execute(command);
  }

  async getPaymentIntentStatus(paymentIntentId: string) {
    return this.getPaymentIntentStatusUseCase.execute(paymentIntentId);
  }

  async createSetupIntent(customerId: string): Promise<string> {
    const result = await this.createSetupIntentUseCase.execute(customerId);
    return result.clientSecret;
  }

  async createCustomer(email: string): Promise<string>;
  async createCustomer(dto: CreateCustomerDto): Promise<string>;
  async createCustomer(
    emailOrDto: string | CreateCustomerDto,
  ): Promise<string> {
    let command: CreateCustomerCommand;
    if (typeof emailOrDto === 'string') {
      command = new CreateCustomerCommand(emailOrDto);
    } else {
      command = CreateCustomerCommand.fromDto(emailOrDto);
    }
    const result = await this.createCustomerUseCase.execute(command);
    return result.customerId;
  }

  async getCustomerIdByEmail(email: string): Promise<string | null> {
    // Read operation - using repository directly
    return this.stripePaymentService.getCustomerIdByEmail(email);
  }

  async getDefaultPaymentMethod(customerId: string) {
    // Read operation - using repository directly
    return this.stripePaymentService.getDefaultPaymentMethod(customerId);
  }

  async attachPaymentMethod(paymentMethodId: string, customerId: string) {
    // Using repository directly - could be converted to use-case if needed
    return this.stripePaymentService.attachPaymentMethod(
      paymentMethodId,
      customerId,
    );
  }

  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    // Using repository directly - could be converted to use-case if needed
    return this.stripePaymentService.setDefaultPaymentMethod(
      customerId,
      paymentMethodId,
    );
  }

  async savePaymentMethod(
    paymentMethodId: string,
    customerId: string,
    setAsDefault: boolean = true,
  ) {
    const command = new SavePaymentMethodCommand(
      paymentMethodId,
      customerId,
      setAsDefault,
    );
    return this.savePaymentMethodUseCase.execute(command);
  }
}
