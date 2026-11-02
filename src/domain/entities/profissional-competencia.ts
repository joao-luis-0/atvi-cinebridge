import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Profissional } from './profissional';
import { Competencia } from './competencia';


@Entity('profissional_competencias')
export class ProfissionalCompetencia {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Profissional, (profissional) => profissional.competencias, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'profissional_id' })
  profissional!: Profissional;

  @ManyToOne(() => Competencia, { eager: true })
  @JoinColumn({ name: 'competencia_id' })
  competencia!: Competencia;

  /** Nível de domínio da competência, de 0 (iniciante) a 1 (especialista). */
  @Column({ type: 'decimal', precision: 3, scale: 2 })
  nivel!: number;
}
