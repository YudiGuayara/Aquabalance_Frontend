import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClimaService } from '../../core/services/clima.service';

@Component({
  selector: 'app-clima',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clima.component.html',
  styleUrl: './clima.component.css',
})
export class ClimaComponent implements OnInit {

  ciudad = 'Cargando...';

  temperatura: number | null = null;
  viento: number | null = null;
  direccion: number | null = null;
  sensTermica: number | null = null;

  humedad: number | null = null;
  lluvia: number | null = null;
  uv: number | null = null;

  calidadAgua = 'Buena';
  riesgo = 'Bajo';

  hora = '';

  tipo: 'sun' | 'rain' | 'cloud' = 'cloud';

  weatherLabel = 'Cargando...';

  pronostico: any[] = [];

  cargando = true;

  error = '';

  constructor(private climaService: ClimaService) {}

  ngOnInit(): void {
    this.obtenerClima();
  }

  obtenerClima(): void {

    this.cargando = true;
    this.error = '';

    if (!navigator.geolocation) {

      this.error = 'Tu navegador no soporta geolocalización.';
      this.cargando = false;

      return;
    }

    navigator.geolocation.getCurrentPosition(

      (pos) => {

        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // 📍 CIUDAD
        this.climaService.getCiudad(lat, lon).subscribe({

          next: (geo: any) => {

            const ciudad =
              geo.address?.city ||
              geo.address?.town ||
              geo.address?.village ||
              geo.address?.county ||
              'Tu ubicación';

            const estado = geo.address?.state || '';

            this.ciudad = estado
              ? `${ciudad}, ${estado}`
              : ciudad;
          },

          error: () => {

            this.ciudad = 'Tu ubicación';
          }
        });

        // 🌦️ CLIMA
        this.climaService.getClimaPorUbicacion(lat, lon).subscribe({

          next: (data: any) => {

            const w = data.current;

            this.temperatura = Math.round(w.temperature_2m);

            this.viento = Math.round(w.wind_speed_10m);

            this.direccion = w.wind_direction_10m;

            this.sensTermica = Math.round(w.apparent_temperature);

            this.humedad = w.relative_humidity_2m;

            this.lluvia = w.precipitation;

            // ⏰ HORA
            const date = new Date();

            this.hora = date.toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit'
            });

            // 🌤️ ESTADO VISUAL
            if (this.temperatura >= 28) {

              this.tipo = 'sun';
              this.weatherLabel = 'Soleado';

            } else if ((this.lluvia ?? 0) > 0) {

              this.tipo = 'rain';
              this.weatherLabel = 'Lluvioso';

            } else {

              this.tipo = 'cloud';
              this.weatherLabel = 'Nublado';
            }

            // 🌊 ESTADO HÍDRICO
            if ((this.humedad ?? 0) >= 80) {

              this.calidadAgua = 'Regular';
              this.riesgo = 'Medio';

            } else if (this.temperatura >= 32) {

              this.calidadAgua = 'Mala';
              this.riesgo = 'Alto';

            } else {

              this.calidadAgua = 'Buena';
              this.riesgo = 'Bajo';
            }

            this.cargando = false;
          },

          error: () => {

            this.error = 'No se pudo obtener el clima.';
            this.cargando = false;
          }
        });

        // 📊 PRONÓSTICO
        this.climaService.getPronostico(lat, lon).subscribe({

          next: (data: any) => {

            this.pronostico = data.daily.time.map((d: string, i: number) => ({

              dia: new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
                weekday: 'short'
              }),

              max: Math.round(data.daily.temperature_2m_max[i]),

              min: Math.round(data.daily.temperature_2m_min[i]),

              lluvia: data.daily.precipitation_probability_max[i],

              uv: data.daily.uv_index_max[i]

            }));
          }
        });

        // ☀️ UV
        this.climaService.getUV(lat, lon).subscribe({

          next: (data: any) => {

            this.uv = Math.round(data.daily.uv_index_max[0]);
          }
        });
      },

      () => {

        this.error = 'Permite el acceso a tu ubicación.';
        this.cargando = false;
      }
    );
  }
}
