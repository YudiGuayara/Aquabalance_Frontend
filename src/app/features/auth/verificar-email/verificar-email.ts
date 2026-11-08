import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.css',
})
export class VerificarEmailComponent implements OnInit {
  estado: 'cargando' | 'ok' | 'error' = 'cargando';
  mensaje = '';

  // para pedir un enlace nuevo si este expiró
  email = '';
  reenviando = false;
  infoReenvio = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.estado = 'error';
      this.mensaje = 'El enlace no es válido.';
      return;
    }

    // Se confirma con POST (no con GET) para que los escáneres de correo no consuman el enlace
    this.authService.verificarEmail(token).subscribe({
      next: (res) => {
        this.estado = 'ok';
        this.mensaje = res.mensaje;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.estado = 'error';
        this.mensaje =
          err.status === 0
            ? 'No se puede conectar con el servidor.'
            : err.error?.message || 'El enlace no es válido o ya expiró.';
        this.cdr.detectChanges();
      },
    });
  }

  reenviar(): void {
    if (!this.email || !this.email.includes('@')) return;
    this.reenviando = true;
    this.authService.reenviarVerificacion(this.email.trim()).subscribe({
      next: (res) => {
        this.reenviando = false;
        this.infoReenvio = res.mensaje;
        this.cdr.detectChanges();
      },
      error: () => {
        this.reenviando = false;
        this.infoReenvio = 'No se pudo reenviar el correo. Intenta más tarde.';
        this.cdr.detectChanges();
      },
    });
  }
}
