import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Profissional } from './profissional';

/**
 * Uma janela de tempo em que o Profissional está disponível para novos
 * projetos. Um profissional pode ter várias janelas cadastradas
 * (disponibilidade temporal, citada no enunciado).
 */
@Entity('disponibilidades')
export class DisponibilidadePeriodo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Profissional, (profissional) => profissional.disponibilidades, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'profissional_id' })
  profissional!: Profissional;

  @Column({ type: 'date' })
  inicio!: Date;

  @Column({ type: 'date' })
  fim!: Date;
}
