import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadResourceDto {
  @IsOptional()
  @IsIn(['image', 'pdf', 'document', 'resource'])
  type?: 'image' | 'pdf' | 'document' | 'resource';

  @IsOptional()
  @IsString()
  @MaxLength(120)
  module?: string;
}
