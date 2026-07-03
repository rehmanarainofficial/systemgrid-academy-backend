import { IsObject, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsObject()
  branding?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  theme?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  contact?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  whatsapp?: Record<string, unknown>;
}
