export interface Medicion {
  id?: number;
  ph: number;
  temperatura: number;
  fecha?: string;
  idUsuario: number;
  idRecurso: number;
  idContaminante: number;
}
