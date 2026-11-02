import { Projeto } from '../entities/projeto';
import { TipoProjeto } from '../entities/enums';


export class RegistroPrototiposProjeto {
  private readonly prototipos = new Map<TipoProjeto, Projeto>();


  registrar(tipo: TipoProjeto, prototipo: Projeto): void {
    this.prototipos.set(tipo, prototipo.clonar());
  }

  possui(tipo: TipoProjeto): boolean {
    return this.prototipos.has(tipo);
  }


  criar<T extends Projeto = Projeto>(tipo: TipoProjeto, ajustar?: (copia: T) => void): T {
    const prototipo = this.prototipos.get(tipo);
    if (!prototipo) {
      throw new Error(`Nenhum protótipo registrado para o tipo de projeto: ${tipo}`);
    }

    const copia = prototipo.clonar() as T;
    if (ajustar) {
      ajustar(copia);
    }
    return copia;
  }
}
