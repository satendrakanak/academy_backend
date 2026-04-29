import { Exclude } from 'class-transformer';
import { Article } from 'src/articles/article.entity';
import { Category } from 'src/categories/category.entity';
import { Course } from 'src/courses/course.entity';
import { Enrollment } from 'src/enrollments/enrollment.entity';
import { Order } from 'src/orders/order.entity';
import { FacultyProfile } from 'src/profiles/faculty-profile.entity';
import { UserProfile } from 'src/profiles/user-profile.entity';
import { Role } from 'src/roles-permissions/role.entity';
import { Tag } from 'src/tags/tag.entity';
import { Upload } from 'src/uploads/upload.entity';
import { UserProgres } from 'src/user-progress/user-progres.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
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
  username?: string;

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

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  avatar?: Upload | null;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  coverImage?: Upload | null;

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

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;

  @OneToOne(() => FacultyProfile, (faculty) => faculty.user)
  facultyProfile?: FacultyProfile;

  @ManyToMany(() => Course, (course) => course.faculties)
  taughtCourses?: Course[];

  @ManyToMany(() => Role)
  @JoinTable()
  roles!: Role[];

  @OneToMany(() => Article, (article) => article.author)
  articles!: Article[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date;
}
