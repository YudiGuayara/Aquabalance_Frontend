import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-olvide-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './olvide-password.html',
  styleUrl: './olvide-password.css',
})
export class OlvidePasswordComponent {
  email = '';
  cargando = false;
  enviado = false;
  mensaje = '';
  error = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  emailInvalido(): boolean {
    return !this.email || !this.email.includes('@');
  }

  onSubmit(): void {
    if (this.emailInvalido()) return;
    this.error = '';
    this.cargando = true;

    this.authService.olvidePassword(this.email.trim()).subscribe({
      next: (res) => {
        this.cargando = false;
        this.enviado = true;
        this.mensaje = res.mensaje;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.error =
          err.status === 0
            ? 'No se puede conectar con el servidor.'
            : err.error?.message || 'Ocurrió un error inesperado.';
        this.cdr.detectChanges();
      },
    });
  }
}
