import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../core/services/usuario';
import { Usuario } from '../../core/models/usuario.model';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css',
})
export class ListaUsuariosComponent implements OnInit {

  usuarios:  Usuario[] = [];
  cargando   = false;
  error      = '';
  busqueda   = '';

  modalAbierto = false;
  modoEdicion  = false;
  usuarioForm: Usuario = this.formVacio();

  // ✅ roles disponibles
  roles = ['Administrador', 'Operador', 'UsuarioPublico'];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error    = '';
    this.usuarioService.listar().subscribe({
      next:  u  => { this.usuarios = u; this.cargando = false; },
      error: () => { this.error = 'Error al cargar usuarios.'; this.cargando = false; },
    });
  }

  get usuariosFiltrados(): Usuario[] {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) return this.usuarios;
    return this.usuarios.filter(u =>
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)  ||
      u.rol.toLowerCase().includes(q)
    );
  }

  abrirCrear(): void {
    this.modoEdicion  = false;
    this.usuarioForm  = this.formVacio();
    this.error        = '';
    this.modalAbierto = true;
  }

  abrirEditar(u: Usuario): void {
    this.modoEdicion  = true;
    this.usuarioForm  = { ...u, password: '' };
    this.error        = '';
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.usuarioForm  = this.formVacio();
    this.error        = '';
  }

  guardar(): void {
    this.error = '';

    if (!this.usuarioForm.nombre?.trim()) {
      this.error = 'El nombre es obligatorio'; return;
    }
    if (!this.usuarioForm.email?.trim()) {
      this.error = 'El email es obligatorio'; return;
    }
    if (!this.modoEdicion && !this.usuarioForm.password?.trim()) {
      this.error = 'La contraseña es obligatoria'; return;
    }

    if (this.modoEdicion && this.usuarioForm.id) {
      const payload: Partial<Usuario> = { ...this.usuarioForm };
      if (!payload.password) delete payload.password;

      this.usuarioService.actualizar(this.usuarioForm.id, payload).subscribe({
        next:  () => { this.cerrarModal(); this.cargar(); },
        error: () => { this.error = 'Error al actualizar el usuario.'; },
      });
    } else {
      this.usuarioService.crear(this.usuarioForm).subscribe({
        next:  () => { this.cerrarModal(); this.cargar(); },
        error: () => { this.error = 'Error al crear el usuario.'; },
      });
    }
  }

  toggleActivo(u: Usuario): void {
    this.usuarioService.toggleActivo(u.id!).subscribe({
      next:  () => this.cargar(),
      error: () => { this.error = 'Error al cambiar estado del usuario.'; },
    });
  }

  eliminar(id: number): void {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    this.usuarioService.eliminar(id).subscribe({
      next:  () => this.cargar(),
      error: () => { this.error = 'Error al eliminar el usuario.'; },
    });
  }

  private formVacio(): Usuario {
    return { nombre: '', email: '', password: '', rol: 'Operador', activo: true };
  }

  inicial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  badgeRol(rol: string): string {
    const m: Record<string, string> = {
      Administrador:  'badge-admin',
      Operador:       'badge-operador',
      UsuarioPublico: 'badge-publico',  // ✅
    };
    return m[rol] ?? 'badge-default';
  }

  labelRol(rol: string): string {
    const m: Record<string, string> = {
      Administrador:  'Administrador',
      Operador:       'Operador',
      UsuarioPublico: 'Usuario Público',  // ✅
    };
    return m[rol] ?? rol;
  }
}
