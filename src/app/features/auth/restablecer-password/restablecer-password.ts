import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './restablecer-password.html',
  styleUrl: './restablecer-password.css',
})
export class RestablecerPasswordComponent implements OnInit {
  token = '';
  nuevaPassword = '';
  confirmar = '';
  verPassword = false;

  cargando = false;
  listo = false;
  mensaje = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error = 'El enlace no es válido. Solicita uno nuevo.';
    }
  }

  // Mínimo 8 caracteres, con al menos una letra y un número (igual que el backend)
  passwordInvalida(): boolean {
    const p = this.nuevaPassword;
    return !p || p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p);
  }

  noCoinciden(): boolean {
    return this.nuevaPassword !== this.confirmar;
  }

  formInvalido(): boolean {
    return !this.token || this.passwordInvalida() || this.noCoinciden();
  }

  onSubmit(): void {
    if (this.formInvalido()) return;
    this.error = '';
    this.cargando = true;

    this.authService
      .restablecerPassword({ token: this.token, nuevaPassword: this.nuevaPassword })
      .subscribe({
        next: (res) => {
          this.cargando = false;
          this.listo = true;
          this.mensaje = res.mensaje;
          this.cdr.detectChanges();
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
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
