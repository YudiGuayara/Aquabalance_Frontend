import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css',
})
export class RegistroComponent {

  form: RegisterRequest = {
    nombre: '',
    email: '',
    password: '',
  };

  error: string = '';
  exito: string = '';
  registrado: boolean = false;
  cargando: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  onSubmit(): void {
    this.error = '';
    this.exito = '';
    this.cargando = true;

    this.authService.registro(this.form).subscribe({
      next: (res) => {
        this.cargando = false;
        this.registrado = true;
        this.exito = res.mensaje;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'Error al registrar usuario.';
        this.cdr.detectChanges();
      },
    });
  }

  // 🔥 VALIDACIÓN SIMPLE PARA HTML
  esNombreInvalido(): boolean {
    return !this.form.nombre || this.form.nombre.trim().length === 0;
  }

  esEmailInvalido(): boolean {
    return !this.form.email || !this.form.email.includes('@');
  }

  // Mínimo 8 caracteres, con al menos una letra y un número (igual que el backend)
  esPasswordInvalida(): boolean {
    const p = this.form.password;
    return !p || p.length < 8 || !/[A-Za-z]/.test(p) || !/\d/.test(p);
  }

  esFormularioInvalido(): boolean {
    return (
      this.esNombreInvalido() ||
      this.esEmailInvalido() ||
      this.esPasswordInvalida()
    );
  }
}
