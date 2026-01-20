import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a Stripe payment intent
 */
export class CreatePaymentIntentDto {
  @ApiProperty({
    example: 5000,
    description: 'Amount to charge in the smallest currency unit (e.g., cents for USD)',
  })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    example: 'usd',
    description: 'Currency in ISO format (e.g., usd, eur)',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address of the customer',
  })
  @IsEmail()
  @IsNotEmpty()
  customerEmail!: string;

  @ApiPropertyOptional({
    example: 'Test order payment',
    description: 'Optional description of the payment intent',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'pm_1S3CVQRuLZtJLmPoxoQLOtaU',
    description: 'Optional payment method ID for saved cards',
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    example: 'cus_Sz94jtLYuDIbPw',
    description: 'Optional Stripe customer ID for saved cards',
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({
    example: {
      orderId: '123456',
    },
    description: 'Optional metadata object for tracking purposes',
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    example: ['card'],
    description: 'Payment method types to accept. Defaults to ["card"]. Supported types: card, apple_pay, google_pay, link, us_bank_account, sepa_debit, ideal, paypal, klarna, afterpay_clearpay, and more. See Stripe docs for full list.',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  paymentMethodTypes?: string[];
}
