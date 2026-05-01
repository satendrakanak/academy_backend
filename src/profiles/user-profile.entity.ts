import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/user.entity';

@Entity()
export class UserProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user!: User;

  @Column({ nullable: true, type: 'text' })
  bio!: string;

  @Column({ nullable: true })
  coverImage!: string;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ default: true })
  showCourses!: boolean;

  @Column({ default: true })
  showCertificates!: boolean;

  @Column({ nullable: true })
  location!: string;

  @Column({ nullable: true })
  website!: string;

  @Column({ nullable: true })
  headline!: string;

  @Column({ nullable: true })
  company!: string;

  @Column({ nullable: true })
  facebook!: string;

  @Column({ nullable: true })
  instagram!: string;

  @Column({ nullable: true })
  twitter!: string;

  @Column({ nullable: true })
  linkedin!: string;

  @Column({ nullable: true })
  youtube!: string;

  @Column({ nullable: true })
  whatsapp!: string;

  @Column({ nullable: true })
  telegram!: string;
}
