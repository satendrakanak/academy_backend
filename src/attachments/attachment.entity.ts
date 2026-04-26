import { Lecture } from 'src/lectures/lecture.entity';
import { Upload } from 'src/uploads/upload.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  file!: Upload | null;

  @ManyToOne(() => Lecture, (lecture) => lecture.attachments, {
    onDelete: 'CASCADE',
  })
  lecture!: Lecture;
}
