import { Chapter } from 'src/chapters/chapter.entity';
import { Upload } from 'src/uploads/upload.entity';
import { Attachment } from 'src/attachments/attachment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserProgres } from 'src/user-progress/user-progres.entity';

@Entity()
export class Lecture {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 0 })
  position!: number;

  @Column({ default: false })
  isPublished!: boolean;

  @Column({ default: false })
  isFree!: boolean;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  video?: Upload | null;

  @ManyToOne(() => Chapter, (chapter) => chapter.lectures, {
    onDelete: 'CASCADE',
  })
  chapter!: Chapter;

  @OneToMany(() => Attachment, (att) => att.lecture)
  attachments!: Attachment[];

  @OneToMany(() => UserProgres, (progress) => progress.lecture)
  progress!: UserProgres[];
}
