import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccessLevel } from '../../common/enums/access-level.enum';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('role_permissions')
@Index('uq_role_permissions_role_resource', ['role', 'resource'], {
  unique: true,
})
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'role', type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'resource', type: 'varchar', length: 64 })
  resource: string;

  @Column({
    name: 'access_level',
    type: 'enum',
    enum: AccessLevel,
    default: AccessLevel.None,
  })
  accessLevel: AccessLevel;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
