import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn
} from 'typeorm';
import { StatusRecomendacao, TipoEstrategiaRecomendacao } from './enums';
import { Projeto } from './projeto';
import { AlocacaoRecomendada } from './alocacao-recomendada';
import type { Visitante } from '../visitors/visitante.interface';


@Entity('recomendacoes')
export class Recomendacao {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Projeto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projeto_id' })
  projeto!: Projeto;

  @Column({ type: 'enum', enum: TipoEstrategiaRecomendacao })
  estrategiaUtilizada!: TipoEstrategiaRecomendacao;

  @Column({ type: 'enum', enum: StatusRecomendacao, default: StatusRecomendacao.EM_ANDAMENTO })
  status!: StatusRecomendacao;

  @OneToMany(() => AlocacaoRecomendada, (alocacao) => alocacao.recomendacao, {
    cascade: true,
    eager: true
  })
  alocacoes!: AlocacaoRecomendada[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadaEm!: Date;

  /**
   * A equipe é consensual quando toda alocação ativa (não substituída)
   * tem convite aceito. Usado para disparar o registro da composição
   * final e os eventos para outros microsserviços.
   */
  estaConsensual(): boolean {
    const ativas = this.alocacoes.filter((alocacao) => !alocacao.substituida);
    if (ativas.length === 0) {
      return false;
    }
    return ativas.every((alocacao) => alocacao.convite?.foiAceito() ?? false);
  }

  /** Retorna as alocações ativas (não substituídas) que ainda aguardam resposta. */
  alocacoesPendentes(): AlocacaoRecomendada[] {
    return this.alocacoes.filter(
      (alocacao) => !alocacao.substituida && !(alocacao.convite?.foiRespondido() ?? false)
    );
  }

  /**
   * Padrão Visitor: notifica o visitante sobre si mesma, depois sobre
   * o projeto associado (requisitos) e, por fim, sobre cada alocação
   * (o que foi de fato sugerido) — nesta ordem, para que visitantes
   * como a validação de consistência já conheçam os requisitos do
   * projeto antes de processar as alocações.
   */
  aceitar(visitante: Visitante): void {
    visitante.visitarRecomendacao(this);
    this.projeto?.aceitar(visitante);
    this.alocacoes.forEach((alocacao) => alocacao.aceitar(visitante));
  }
}
