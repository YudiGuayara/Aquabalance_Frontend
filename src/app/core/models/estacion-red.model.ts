export type ProtocoloRed = 'HTTP' | 'MQTT' | 'LORAWAN';

export type EstadoEstacion = 'EN_LINEA' | 'DEGRADADA' | 'FUERA_DE_LINEA' | 'SIN_DATOS';

export interface EstacionRed {
  id: number;
  recursoId: number;
  nombre: string;
  tipoRecurso: string;
  ip: string;
  protocolo: ProtocoloRed;
  puerto: number;
  estado: EstadoEstacion;
  latenciaMs: number | null;
  senalDbm: number | null;
  bateriaPct: number | null;
  segundosSinComunicacion: number | null;
  paquetesRecibidos: number;
  paquetesPerdidos: number;
  perdidaPct: number;
}

export interface Telemetria {
  latenciaMs: number;
  senalDbm: number;
  bateriaPct: number;
}
