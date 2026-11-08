import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClimaService {

  constructor(private http: HttpClient) {}

  // 🌦️ clima actual
  getClimaPorUbicacion(lat: number, lon: number) {
    return this.http.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=America/Bogota`
    );
  }

  // 📊 pronóstico 7 días
  getPronostico(lat: number, lon: number) {
    return this.http.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=America/Bogota`
    );
  }

  // ☀️ índice UV
  getUV(lat: number, lon: number) {
    return this.http.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=uv_index_max&timezone=America/Bogota`
    );
  }

  // 📍 ciudad real
  getCiudad(lat: number, lon: number) {
    return this.http.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
    );
  }
}
