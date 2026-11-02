import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { PapelTecnico } from './enums';
import { Localizacao } from './localizacao';
import { ProfissionalCompetencia } from './profissional-competencia';
import { Avaliacao } from './avaliacao';
import { HistoricoProjetoAnterior } from './historico-projeto-anterior';
import { DisponibilidadePeriodo } from './disponibilidade-periodo';
import type { Visitante } from '../visitors/visitante.interface';


@Entity('profissionais')
export class Profissional {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ type: 'simple-array' })
  especialidades!: PapelTecnico[];

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valorMinimo!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valorMaximo!: number;

  @Column(() => Localizacao)
  localizacao!: Localizacao;

  @OneToMany(() => ProfissionalCompetencia, (pc) => pc.profissional, {
    cascade: true,
    eager: true
  })
  competencias!: ProfissionalCompetencia[];

  @OneToMany(() => Avaliacao, (avaliacao) => avaliacao.profissional, {
    cascade: true
  })
  avaliacoes!: Avaliacao[];

  @OneToMany(() => HistoricoProjetoAnterior, (historico) => historico.profissional, {
    cascade: true
  })
  historicoProjetos!: HistoricoProjetoAnterior[];

  @OneToMany(() => DisponibilidadePeriodo, (disp) => disp.profissional, {
    cascade: true,
    eager: true
  })
  disponibilidades!: DisponibilidadePeriodo[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm!: Date;

  /** Média das notas recebidas; retorna 0 quando o profissional ainda não tem avaliações. */
  mediaAvaliacoes(): number {
    if (!this.avaliacoes || this.avaliacoes.length === 0) {
      return 0;
    }
    const soma = this.avaliacoes.reduce((acc, avaliacao) => acc + Number(avaliacao.nota), 0);
    return soma / this.avaliacoes.length;
  }

  /** Verifica se o profissional possui alguma janela de disponibilidade cobrindo todo o período informado. */
  estaDisponivelEntre(inicio: Date, fim: Date): boolean {
    return this.disponibilidades.some(
      (janela) => janela.inicio <= inicio && janela.fim >= fim
    );
  }

  /** Verifica se um valor de orçamento (para o papel) está dentro da faixa de preço do profissional. */
  dentroDaFaixaDePreco(valor: number): boolean {
    return valor >= Number(this.valorMinimo) && valor <= Number(this.valorMaximo);
  }

  /** Verifica se o profissional se especializa no papel técnico informado. */
  possuiEspecialidade(papel: PapelTecnico): boolean {
    return this.especialidades.includes(papel);
  }

  /** Padrão Visitor: elemento-folha (nesta árvore), apenas notifica o visitante sobre si mesmo. */
  aceitar(visitante: Visitante): void {
    visitante.visitarProfissional(this);
  }
}
