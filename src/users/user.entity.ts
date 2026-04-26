import { Exclude } from 'class-transformer';
import { Category } from 'src/categories/category.entity';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Order } from 'src/orders/order.entity';
import { Tag } from 'src/tags/tag.entity';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: false,
  })
  firstName!: string;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: true,
  })
  lastName?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  phoneNumber!: string;

  @Column({
    type: 'varchar',
    length: 96,
    nullable: false,
  })
  @Exclude()
  password!: string;

  @Exclude()
  @Column({ nullable: true, type: 'timestamptz' })
  emailVerified?: Date;

  @OneToMany(() => Category, (category) => category.createdBy)
  categories!: Category[];

  @OneToMany(() => Tag, (tag) => tag.createdBy)
  tags!: Tag[];

  @OneToMany(() => Course, (course) => course.createdBy)
  courses!: Course[];

  @OneToMany(() => UserProgres, (progress) => progress.user)
  lectureProgress!: UserProgres[];

  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.user)
  enrollments!: Enrollment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
