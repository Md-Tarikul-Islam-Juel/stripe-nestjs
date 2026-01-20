import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a payout
 */
export class CreatePayoutDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  connectAccountId!: string;

  @ApiProperty({
    description: 'Amount to payout (in dollars, will be converted to cents)',
    example: 100.50,
  })
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    default: 'usd',
  })
  @IsString()
  currency!: string;

  @ApiProperty({
    description: 'External account ID (bank account) to receive the payout',
    example: 'ba_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  externalAccountId!: string;

  @ApiPropertyOptional({
    description: 'Optional description for the payout',
    example: 'Revenue payout',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
