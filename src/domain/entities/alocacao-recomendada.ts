import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn
} from 'typeorm';
import { PapelTecnico } from './enums';
import { Recomendacao } from './recomendacao';
import { Profissional } from './profissional';
import { Convite } from './convite';
import type { Visitante } from '../visitors/visitante.interface';


@Entity('alocacoes_recomendadas')
export class AlocacaoRecomendada {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Recomendacao, (recomendacao) => recomendacao.alocacoes, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'recomendacao_id' })
  recomendacao!: Recomendacao;

  @Column({ type: 'enum', enum: PapelTecnico })
  papel!: PapelTecnico;

  @ManyToOne(() => Profissional, { eager: true })
  @JoinColumn({ name: 'profissional_id' })
  profissionalSugerido!: Profissional;

  /** Posição no ranking gerado pela estratégia (1 = melhor colocado para o papel). */
  @Column({ type: 'int' })
  posicaoRanking!: number;

  /** Score de compatibilidade calculado pela estratégia, de 0 a 1. */
  @Column({ type: 'decimal', precision: 5, scale: 4 })
  score!: number;

  /** Marcada como true quando o produtor substitui esta sugestão por outra. */
  @Column({ type: 'boolean', default: false })
  substituida!: boolean;

  @OneToOne(() => Convite, (convite) => convite.alocacao, {
    cascade: true,
    eager: true,
    nullable: true
  })
  convite?: Convite;

  /**
   * Padrão Visitor: notifica o visitante sobre si mesma e repassa a
   * visita para o profissional sugerido.
   */
  aceitar(visitante: Visitante): void {
    visitante.visitarAlocacaoRecomendada(this);
    this.profissionalSugerido?.aceitar(visitante);
  }
}
