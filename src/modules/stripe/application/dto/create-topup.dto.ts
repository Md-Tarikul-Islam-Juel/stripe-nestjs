import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for creating a Stripe Top-up to add funds directly to available balance
 */
export class CreateTopupDto {
  @ApiProperty({
    example: 100.0,
    description: 'Amount to add to available balance in dollars (e.g., 100.0)',
  })
  @IsNumber()
  @Min(1) // Minimum top-up amount is usually $1
  amount!: number;

  @ApiProperty({
    example: 'usd',
    description: 'Three-letter ISO currency code (e.g., usd, eur)',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiPropertyOptional({
    example: 'pm_1234567890',
    description: 'Payment method ID or source ID to use for the top-up. If not provided, Stripe will use default source or require one.',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({
    example: 'Adding funds to available balance',
    description: 'Optional description for the top-up',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: { reason: 'test_balance', orderId: '123' },
    description: 'Optional metadata for tracking purposes',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}
