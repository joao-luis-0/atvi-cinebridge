import { EventoDominio } from './evento-dominio';


export interface ObservadorEvento {
  notificar(evento: EventoDominio): void | Promise<void>;
}
