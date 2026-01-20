import { ApiProperty } from '@nestjs/swagger';

/**
 * Webhook event DTO (used internally)
 */
export class WebhookEventDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  data!: any;

  @ApiProperty()
  created!: number;
}
