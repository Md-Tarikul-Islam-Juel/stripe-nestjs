import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO for creating a Stripe customer
 */
export class CreateCustomerDto {
  @ApiProperty({
    example: 'customer@example.com',
    description: 'Email address of the customer',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Optional name of the customer',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: {
      userId: '123',
    },
    description: 'Optional metadata for tracking purposes',
  })
  @IsOptional()
  metadata?: Record<string, string>;
}
