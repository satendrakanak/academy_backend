import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { State } from './state.entity';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  countryCode!: string;

  @Column({ nullable: true })
  phoneCode!: string;

  @OneToMany(() => State, (state) => state.country)
  states!: State[];
}
