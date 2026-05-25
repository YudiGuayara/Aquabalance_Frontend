export interface Evento {
  id?: number;
  descripcion: string;
  magnitud: string;
  fecha?: string;
  idContaminante: number;
  idRecurso: number;
}
