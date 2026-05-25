export type NivelNotificacion = 'ALTA' | 'MEDIA' | 'BAJA' | 'INFO' | string;
export type TipoNotificacion  = 'ALERTA' | 'INFORME' | 'MEDICION' | string;

export interface Notificacion {
  id:        number;
  tipo:      TipoNotificacion;
  titulo:    string;
  mensaje:   string;
  nivel:     NivelNotificacion;
  leida:     boolean;
  fecha:     string;
  expandida?: boolean;
}
