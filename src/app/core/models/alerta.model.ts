export type NivelAlerta = 'Verde' | 'Amarilla' | 'Naranja' | 'Roja';

export interface Alerta {
  id?: number;
  fecha?: string;
  nivel: NivelAlerta;
  mensaje: string;
  /** Lo asigna el backend desde el token; el cliente no lo envía. */
  idUsuario?: number;
  idEvento: number;
}
