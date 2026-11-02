import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';


@Entity('competencias')
export class Competencia {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  nome!: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  categoria?: string;
}
