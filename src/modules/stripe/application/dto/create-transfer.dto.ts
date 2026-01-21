import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

/**
 * DTO for creating a Stripe transfer (platform → connected account)
 */
export class CreateTransferDto {
  @ApiProperty({
    example: 'acct_1234567890',
    description: 'Destination Stripe Connect account ID (starts with acct_)',
  })
  @IsString()
  @IsNotEmpty()
  connectAccountId!: string;

  @ApiProperty({
    example: 25.5,
    description: 'Amount in major currency unit (e.g., dollars). Converted to cents internally.',
  })
  @IsNumber()
  @Min(0.5)
  amount!: number;

  @ApiProperty({
    example: 'usd',
    description: 'Currency code (e.g., usd, eur)',
  })
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @ApiPropertyOptional({
    example: 'Transfer for order #123',
    description: 'Optional description for the transfer',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: { orderId: '123' },
    description: 'Optional metadata for tracking',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}

