import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AccessLevel } from '../../../common/enums/access-level.enum';
import { UserRole } from '../../../common/enums/user-role.enum';

export class AccessControlChangeDto {
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  resource: string;

  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;
}

export class UpdateAccessControlDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => AccessControlChangeDto)
  changes: AccessControlChangeDto[];
}
