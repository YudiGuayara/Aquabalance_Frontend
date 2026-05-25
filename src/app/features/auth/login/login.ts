import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {


    this.error = '';
    this.cargando = true;


    this.authService.login(this.form).subscribe({


      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard/home']);
      },


      error: (err) => {
        this.cargando = false;


        if (err.status === 401 || err.status === 403) {
          this.error = 'Correo o contraseña incorrectos.';
        } else if (err.status === 0) {
          this.error = 'No se puede conectar con el servidor.';
        } else {
          this.error = 'Ocurrió un error inesperado.';
        }
      }
    });
  }
}
