import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TokenType } from './enums/token-type.enum';

@Entity()
export class VerificationToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  token!: string;

  @Column({
    type: 'enum',
    enum: TokenType,
    default: TokenType.EMAIL_VERIFICATION,
  })
  type!: TokenType;

  @Column({
    type: 'int',
    nullable: false,
  })
  userId!: number;

  @Column({
    type: 'timestamptz',
    nullable: false,
  })
  expiresAt!: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  usedAt?: Date;
}
