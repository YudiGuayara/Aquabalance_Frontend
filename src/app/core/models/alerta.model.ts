export type NivelAlerta = 'Verde' | 'Amarilla' | 'Naranja' | 'Roja';

export interface Alerta {
  id?: number;
  fecha?: string;
  nivel: NivelAlerta;
  mensaje: string;
  idUsuario: number;
  idEvento: number;
}
