import {
  Component,
  AfterViewInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import * as L from 'leaflet';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements AfterViewInit {

  map: any;

  busqueda = '';

  recursosEstables = 12;
  riesgoMedio = 5;
  contaminacionCritica = 2;

  marcadorBusqueda: any;

  ngAfterViewInit(): void {

    // 🌎 Inicializar mapa
    this.map = L.map('map').setView(
      [4.5709, -74.2973],
      6
    );

    // 🗺️ Tiles
    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap'
      }
    ).addTo(this.map);

    // 🔥 ICONOS
    const rojo = this.crearIcono('red');
    const naranja = this.crearIcono('orange');
    const verde = this.crearIcono('green');

    // 🔴 Río Cauca
    L.marker([3.4516, -76.5320], {
      icon: rojo
    })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup">
          <h3>🏞️ Río Cauca</h3>

          <p><strong>📍 Ciudad:</strong> Cali</p>

          <p><strong>🌡️ Temperatura:</strong> 24°C</p>

          <p><strong>💧 Humedad:</strong> 81%</p>

          <p><strong>🧪 pH:</strong> 5.8</p>

          <p><strong>☣️ Contaminación:</strong> Alta</p>

          <p><strong>🤖 Riesgo IA:</strong> 🔴 CRÍTICO</p>
        </div>
      `);

    // 🟡 Bogotá
    L.marker([4.7110, -74.0721], {
      icon: naranja
    })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup">
          <h3>🌆 Bogotá</h3>

          <p><strong>🌧️ Clima:</strong> Lluvia moderada</p>

          <p><strong>💧 Calidad hídrica:</strong> Media</p>

          <p><strong>🧪 pH:</strong> 6.7</p>

          <p><strong>🤖 Riesgo IA:</strong> 🟠 MEDIO</p>
        </div>
      `);

    // 🟢 Lago Calima
    L.marker([3.9000, -76.3000], {
      icon: verde
    })
      .addTo(this.map)
      .bindPopup(`
        <div class="popup">
          <h3>💧 Lago Calima</h3>

          <p><strong>🧪 pH:</strong> 7.1</p>

          <p><strong>🌡️ Temperatura:</strong> 21°C</p>

          <p><strong>💧 Oxígeno:</strong> Bueno</p>

          <p><strong>🤖 Riesgo IA:</strong> 🟢 ESTABLE</p>
        </div>
      `);

    // 🔥 arregla mapa blanco
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  // 🔎 BUSCAR LUGAR
  buscarLugar(): void {

    if (!this.busqueda.trim()) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${this.busqueda}`
    )
      .then(res => res.json())
      .then(data => {

        if (data.length > 0) {

          const lugar = data[0];

          const lat = parseFloat(lugar.lat);
          const lon = parseFloat(lugar.lon);

          this.map.setView([lat, lon], 12);

          // eliminar marcador anterior
          if (this.marcadorBusqueda) {
            this.map.removeLayer(this.marcadorBusqueda);
          }

          // nuevo marcador
          this.marcadorBusqueda = L.marker([lat, lon])
            .addTo(this.map)
            .bindPopup(`
              <div class="popup">
                <h3>📍 ${this.busqueda}</h3>

                <p><strong>Latitud:</strong> ${lat}</p>

                <p><strong>Longitud:</strong> ${lon}</p>

                <p><strong>🌡️ Estado:</strong> Monitoreando...</p>
              </div>
            `)
            .openPopup();
        }
      });
  }

  // 🎨 ICONOS
  crearIcono(color: string): any {

    return L.icon({
      iconUrl:
        `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,

      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',

      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
  }
}
