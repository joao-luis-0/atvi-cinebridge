import type { ServicoProjeto } from '../services/servico-projeto';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { PapelTecnico, TipoCaptacao } from './enums';
import { Localizacao } from './localizacao';
import { PapelObrigatorio } from './papel-obrigatorio';
import type { Visitante } from '../visitors/visitante.interface';
import type { Profissional } from './profissional';
import type { Prototipavel } from '../prototypes/prototipavel.interface';
import type { VisitanteValidador, VisitanteRelatorio } from '../visitors/visitante.interface';
import type { EstrategiaRecomendacao } from '../strategies/estrategia-recomendacao.interface';
import { VisitanteValidacaoConsistencia } from '../visitors/validacao/validacao-consistencia.visitor';
import { VisitanteGeradorRelatorio } from '../visitors/relatorio/gerador-relatorio.visitor';
import { FiltragemColaborativaStrategy } from '../strategies/filtragem-colaborativa.strategy';


@Entity('projetos')
export class Projeto implements Prototipavel<Projeto> {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  nome!: string;

  @Column({ type: 'varchar', length: 100 })
  genero!: string;

  /** Duração estimada da obra, em minutos. */
  @Column({ type: 'int' })
  duracaoEstimadaMinutos!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  orcamentoTotal!: number;

  @Column({ type: 'date' })
  dataEntrega!: Date;

  @Column({ type: 'enum', enum: TipoCaptacao })
  tipoCaptacao!: TipoCaptacao;

  @Column(() => Localizacao)
  localizacaoFilmagem!: Localizacao;

  @OneToMany(() => PapelObrigatorio, (papel) => papel.projeto, {
    cascade: true,
    eager: true
  })
  papeisObrigatorios!: PapelObrigatorio[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  criadoEm!: Date;

  /**
   * Equipe confirmada pelo produtor: um profissional por papel (não persistida
   * ainda; o endpoint atual trabalha em memória). Um projeto clonado começa
   * sempre com a equipe vazia.
   */
  /** ATVIII: serviço principal em árvore (não persistido na versão atual). */
  servicoPrincipal?: ServicoProjeto;

  calcularCustoTotal(): number { return this.servicoPrincipal?.calcularCusto() ?? 0; }
  obterPrazoServicos(): number { return this.servicoPrincipal?.obterPrazo() ?? 0; }
  validarServicos(): boolean { return this.servicoPrincipal?.validar() ?? false; }

  readonly equipeConfirmada = new Map<PapelTecnico, Profissional>();

  /** Indica que o produtor pediu uma nova rodada completa de recomendação. */
  reavaliacaoSolicitada = false;

  /**
   * Soma dos pesos de importância de todos os papéis obrigatórios.
   * Usado pelo Template Method (Parte 4) para normalizar contribuições
   * de cada papel no cálculo de compatibilidade da equipe.
   */
  pesoTotalPapeis(): number {
    return this.papeisObrigatorios.reduce((soma, papel) => soma + papel.peso, 0);
  }

  /** Verifica se todos os papéis obrigatórios têm peso > 0 configurado. */
  possuiPesosValidos(): boolean {
    return (
      this.papeisObrigatorios.length > 0 &&
      this.papeisObrigatorios.every((papel) => papel.peso > 0)
    );
  }

  /**
   * O produtor aceita um profissional recomendado para um papel do projeto.
   * Só vale para papéis obrigatórios do projeto e para profissionais
   * especializados naquele papel. Aceitar uma recomendação encerra um
   * pedido de reavaliação pendente.
   */
  aceitarRecomendacao(papel: PapelTecnico, profissional: Profissional): void {
    this.validarMembro(papel, profissional);
    this.equipeConfirmada.set(papel, profissional);
    this.reavaliacaoSolicitada = false;
  }

  /** O produtor troca o membro já confirmado de um papel por outro profissional, mantendo as demais escolhas. */
  substituirMembro(papel: PapelTecnico, profissional: Profissional): void {
    if (!this.equipeConfirmada.has(papel)) {
      throw new Error(`Não há membro confirmado para o papel ${papel}; não há o que substituir.`);
    }
    this.validarMembro(papel, profissional);
    this.equipeConfirmada.set(papel, profissional);
  }

  /** O produtor pede uma reavaliação completa (ex.: o orçamento ou o prazo mudaram): a equipe confirmada é descartada. */
  solicitarReavaliacao(): void {
    this.equipeConfirmada.clear();
    this.reavaliacaoSolicitada = true;
  }

  private validarMembro(papel: PapelTecnico, profissional: Profissional): void {
    if (!this.papeisObrigatorios.some((obrigatorio) => obrigatorio.papel === papel)) {
      throw new Error(`O papel ${papel} não é obrigatório neste projeto.`);
    }
    if (!profissional.possuiEspecialidade(papel)) {
      throw new Error(`O profissional ${profissional.nome} não se especializa no papel ${papel}.`);
    }
  }

  /**
   * Padrão Prototype: devolve uma cópia profunda deste projeto — papéis
   * obrigatórios e localização também são copiados, então alterar o
   * clone nunca afeta o original. O clone é um projeto novo: não herda
   * o `id` e recebe um novo `criadoEm`. Cada subclasse sobrescreve este
   * método para devolver o seu próprio tipo e copiar seus atributos
   * específicos.
   */
  clonar(): Projeto {
    const copia = new Projeto();
    this.copiarEstadoPara(copia);
    return copia;
  }

  /** Copia (em profundidade) os atributos comuns a todo tipo de projeto para o destino. */
  protected copiarEstadoPara(destino: Projeto): void {
    destino.servicoPrincipal = this.servicoPrincipal?.clonar();
    destino.nome = this.nome;
    destino.genero = this.genero;
    destino.duracaoEstimadaMinutos = this.duracaoEstimadaMinutos;
    destino.orcamentoTotal = this.orcamentoTotal;
    destino.dataEntrega = new Date(this.dataEntrega.getTime());
    destino.tipoCaptacao = this.tipoCaptacao;
    destino.localizacaoFilmagem = this.localizacaoFilmagem.clonar();
    destino.papeisObrigatorios = this.papeisObrigatorios.map((papel) => papel.clonar());
    destino.criadoEm = new Date();
  }

  /**
   * Factory Method: cada tipo de projeto decide como o seu validador é
   * fabricado. A versão base devolve o validador genérico; as subclasses
   * (documentário, animação, publicitário) sobrescrevem.
   */
  criarValidador(): VisitanteValidador {
    return new VisitanteValidacaoConsistencia();
  }

  /** Factory Method: o recomendador (estratégia) padrão deste tipo de projeto. */
  criarRecomendador(): EstrategiaRecomendacao {
    return new FiltragemColaborativaStrategy();
  }

  /** Factory Method: o gerador de relatório padrão deste tipo de projeto. */
  criarGeradorRelatorio(): VisitanteRelatorio {
    return new VisitanteGeradorRelatorio();
  }

  /** Detalhe textual dos atributos específicos do tipo, usado nas notificações. Vazio no projeto genérico. */
  descricaoEspecifica(): string {
    return '';
  }

  /**
   * Padrão Visitor: aceita um visitante, notifica-o sobre si mesmo e
   * repassa a visita para seus papéis obrigatórios (percorrendo a
   * árvore de dados do projeto).
   */
  aceitar(visitante: Visitante): void {
    visitante.visitarProjeto(this);
    this.papeisObrigatorios.forEach((papel) => papel.aceitar(visitante));
  }
}
