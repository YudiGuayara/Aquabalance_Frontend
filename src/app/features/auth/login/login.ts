import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {

  form: LoginRequest = {
    email: '',
    password: '',
  };

  error: string = '';

  cargando: boolean = false;

  verPassword: boolean = false;

  // cuenta sin verificar / inactiva: permite reenviar el correo de activación
  cuentaNoActiva: boolean = false;
  info: string = '';
  reenviando: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Llegamos aqui por un 401 o por un token vencido (ver AuthService.expirarSesion)
    if (this.route.snapshot.queryParamMap.get('sesion') === 'expirada') {
      this.info = 'Tu sesión expiró. Inicia sesión de nuevo.';
    }
  }

  onSubmit(): void {


    this.error = '';
    this.info = '';
    this.cuentaNoActiva = false;
    this.cargando = true;


    this.authService.login(this.form).subscribe({


      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard/home']);
      },


      error: (err) => {
        this.cargando = false;


        if (err.status === 401) {
          this.error = 'Correo o contraseña incorrectos.';
        } else if (err.status === 403) {
          this.cuentaNoActiva = true;
          this.error = err.error?.message || 'Tu cuenta no está activa.';
        } else if (err.status === 429) {
          this.error = err.error?.message || 'Demasiados intentos. Intenta de nuevo en unos minutos.';
        } else if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor.';
        } else {
          this.error = 'Ocurrió un error inesperado.';
        }
      }
    });
  }

  reenviarVerificacion(): void {
    if (!this.form.email) {
      this.error = 'Escribe tu correo para reenviar el enlace de activación.';
      return;
    }
    this.reenviando = true;
    this.authService.reenviarVerificacion(this.form.email).subscribe({
      next: (res) => {
        this.reenviando = false;
        this.error = '';
        this.info = res.mensaje;
      },
      error: () => {
        this.reenviando = false;
        this.error = 'No se pudo reenviar el correo. Intenta más tarde.';
      },
    });
  }
}
