import {
  Component,
  AfterViewInit,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import * as L from 'leaflet';

import { MapaService } from '../../core/services/mapa.service';
import { EstadoRecurso, PuntoMapa } from '../../core/models/mapa.model';

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
export class MapaComponent implements AfterViewInit, OnDestroy {

  map!: L.Map;

  busqueda = '';

  // Contadores calculados con los recursos reales (ya no son números fijos)
  recursosEstables = 0;
  riesgoMedio = 0;
  contaminacionCritica = 0;
  sinDatos = 0;

  cargando = true;
  error = '';

  marcadorBusqueda?: L.Marker;

  private capaRecursos = L.layerGroup();
  private suscripcion?: Subscription;
  private temporizador?: ReturnType<typeof setTimeout>;

  private readonly iconos: Record<EstadoRecurso, L.Icon> = {
    'critico':   this.crearIcono('red'),
    'medio':     this.crearIcono('orange'),
    'estable':   this.crearIcono('green'),
    'sin-datos': this.crearIcono('grey'),
  };

  constructor(private mapaService: MapaService) {}

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

    this.capaRecursos.addTo(this.map);

    // 🔥 arregla mapa blanco
    this.temporizador = setTimeout(() => {
      this.map.invalidateSize();
    }, 500);

    this.cargarRecursos();
  }

  ngOnDestroy(): void {
    this.suscripcion?.unsubscribe();
    if (this.temporizador) clearTimeout(this.temporizador);
    this.map?.remove();
  }

  // 📡 RECURSOS REALES (recursos + última medición de cada uno)
  cargarRecursos(): void {

    this.cargando = true;
    this.error = '';

    this.suscripcion?.unsubscribe();
    this.suscripcion = this.mapaService.getPuntos().subscribe({

      next: (puntos) => {
        this.pintarPuntos(puntos);
        this.cargando = false;
      },

      error: () => {
        this.error = 'No se pudieron cargar los recursos del mapa.';
        this.cargando = false;
      }
    });
  }

  private pintarPuntos(puntos: PuntoMapa[]): void {

    this.capaRecursos.clearLayers();

    this.recursosEstables = 0;
    this.riesgoMedio = 0;
    this.contaminacionCritica = 0;
    this.sinDatos = 0;

    for (const p of puntos) {

      switch (p.estado) {
        case 'estable':   this.recursosEstables++;     break;
        case 'medio':     this.riesgoMedio++;          break;
        case 'critico':   this.contaminacionCritica++; break;
        default:          this.sinDatos++;
      }

      L.marker([p.latitud, p.longitud], { icon: this.iconos[p.estado] })
        .bindPopup(this.popupRecurso(p))
        .addTo(this.capaRecursos);
    }

    if (puntos.length > 0) {
      this.map.fitBounds(
        L.latLngBounds(puntos.map(p => [p.latitud, p.longitud] as L.LatLngTuple)),
        { padding: [40, 40], maxZoom: 10 }
      );
    }
  }

  private popupRecurso(p: PuntoMapa): string {

    const etiqueta: Record<EstadoRecurso, string> = {
      'critico':   '🔴 CRÍTICO',
      'medio':     '🟠 RIESGO MEDIO',
      'estable':   '🟢 ESTABLE',
      'sin-datos': '⚪ SIN MEDICIONES',
    };

    const medicion = p.estado === 'sin-datos'
      ? '<p>Este recurso aún no tiene mediciones.</p>'
      : `
          <p><strong>🧪 pH:</strong> ${p.ph}</p>
          <p><strong>🌡️ Temperatura:</strong> ${p.temperatura} °C</p>
          <p><strong>☣️ Contaminante:</strong> ${this.escapar(p.contaminante ?? '—')}</p>
          <p><strong>🕒 Última medición:</strong> ${this.escapar(p.fecha ?? '—')}</p>
        `;

    return `
      <div class="popup">
        <h3>${this.escapar(p.nombre)}</h3>
        <p><strong>📍 Ubicación:</strong> ${this.escapar(p.ubicacion ?? '—')}</p>
        <p><strong>Tipo:</strong> ${this.escapar(p.tipo)}</p>
        ${medicion}
        <p><strong>Estado:</strong> ${etiqueta[p.estado]}</p>
      </div>
    `;
  }

  // 🔎 BUSCAR LUGAR
  buscarLugar(): void {

    if (!this.busqueda.trim()) return;

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(this.busqueda)}`
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
                <h3>📍 ${this.escapar(this.busqueda)}</h3>

                <p><strong>Latitud:</strong> ${lat}</p>

                <p><strong>Longitud:</strong> ${lon}</p>
              </div>
            `)
            .openPopup();
        }
      })
      .catch(() => {
        this.error = 'No se pudo buscar el lugar. Revisa tu conexión.';
      });
  }

  // 🎨 ICONOS
  private crearIcono(color: string): L.Icon {

    return L.icon({
      iconUrl:
        `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,

      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',

      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34]
    });
  }

  /** Los nombres vienen de la base de datos: se escapan antes de meterlos en el HTML del popup. */
  private escapar(valor: unknown): string {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
