import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for payment intent creation
 */
export class PaymentIntentResponseDto {
  @ApiProperty({
    example: 'pi_3Re8RLGP78DZzpzI0VOqGWIk_secret_XXXX',
    description: 'Client secret for confirming the payment on the frontend',
  })
  clientSecret!: string;
}
