import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Refund reason enum
 */
export enum RefundReason {
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
}

/**
 * DTO for refunding a payment
 */
export class RefundPaymentDto {
  @ApiPropertyOptional({
    example: 50.00,
    description: 'Refund amount in dollars. If not provided, full refund will be issued.',
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    enum: RefundReason,
    example: RefundReason.REQUESTED_BY_CUSTOMER,
    description: 'Reason for the refund',
  })
  @IsEnum(RefundReason)
  @IsOptional()
  reason?: RefundReason;

  @ApiPropertyOptional({
    example: {
      refundId: 'REF-12345',
      orderId: 'ORD-67890',
      note: 'Customer requested refund',
    },
    description: 'Optional metadata object for tracking purposes',
    type: Object,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;

  @ApiPropertyOptional({
    example: false,
    description: 'For Connect accounts: Whether to reverse the transfer made to the connected account',
  })
  @IsOptional()
  reverseTransfer?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'For Connect accounts: Whether to refund the application fee',
  })
  @IsOptional()
  refundApplicationFee?: boolean;
}
