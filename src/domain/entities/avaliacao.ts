import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Profissional } from './profissional';


@Entity('avaliacoes')
export class Avaliacao {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Profissional, (profissional) => profissional.avaliacoes, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'profissional_id' })
  profissional!: Profissional;

  /** Nota de 0 a 5. */
  @Column({ type: 'decimal', precision: 2, scale: 1 })
  nota!: number;

  @Column({ type: 'text', nullable: true })
  comentario?: string;

  /** Identificador do projeto avaliado (referência leve, sem FK forte entre bounded contexts). */
  @Column({ type: 'uuid', nullable: true })
  projetoId?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadaEm!: Date;
}
