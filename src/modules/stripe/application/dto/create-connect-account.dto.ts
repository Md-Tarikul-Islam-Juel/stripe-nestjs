import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a Stripe Connect account
 */
export class CreateConnectAccountDto {
  @ApiProperty({
    example: 'US',
    description: 'Two-letter ISO country code',
  })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({
    example: 'merchant@example.com',
    description: 'Email address for the Connect account',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    example: 'Acme Corp',
    description: 'Business name',
  })
  @IsString()
  @IsOptional()
  businessName?: string;

  @ApiPropertyOptional({
    example: {
      accountId: '123',
    },
    description: 'Optional metadata for tracking purposes',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
}
