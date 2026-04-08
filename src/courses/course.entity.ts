import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  title: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceInr: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceUsd?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duration?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mode?: string;

  @Column({ type: 'boolean', default: false })
  certificate: boolean;

  @Column({ type: 'text', nullable: true })
  exams?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  experienceLevel?: string;

  @Column({ type: 'text', nullable: true })
  studyMaterial?: string;

  @Column({ type: 'text', nullable: true })
  additionalBook?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  language?: string;

  @Column({ type: 'text', nullable: true })
  technologyRequirements?: string;

  @Column({ type: 'text', nullable: true })
  eligibilityRequirements?: string;

  @Column({ type: 'text', nullable: true })
  disclaimer?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
