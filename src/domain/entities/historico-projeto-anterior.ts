import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { PapelTecnico } from './enums';
import { Profissional } from './profissional';


@Entity('historico_projetos_anteriores')
export class HistoricoProjetoAnterior {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Profissional, (profissional) => profissional.historicoProjetos, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'profissional_id' })
  profissional!: Profissional;

  /** Referência leve ao projeto anterior (pode ser de outro bounded context). */
  @Column({ type: 'uuid', nullable: true })
  projetoId?: string;

  @Column({ type: 'varchar', length: 200 })
  nomeProjeto!: string;

  @Column({ type: 'enum', enum: PapelTecnico })
  papelDesempenhado!: PapelTecnico;

  @Column({ type: 'date' })
  dataConclusao!: Date;
}
