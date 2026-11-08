export interface Medicion {
  id?: number;
  ph: number;
  temperatura: number;
  fecha?: string;
  /** Lo asigna el backend desde el token; el cliente no lo envía. */
  idUsuario?: number;
  idRecurso: number;
  nombreRecurso?: string;
  idContaminante: number;
  nombreContaminante?: string;
}
