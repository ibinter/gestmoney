import { IsString, IsOptional } from 'class-validator';

export class PushSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsString()
  p256dh: string;

  @IsString()
  auth: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class PushUnsubscribeDto {
  @IsString()
  endpoint: string;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  vibrate?: number[];
}
