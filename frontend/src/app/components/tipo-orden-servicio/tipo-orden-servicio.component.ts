import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TiposService } from '../../services/Tiposervicios/tipos.service'; // Importa el servicio
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tipo-orden-servicio',
  standalone: true,
  imports: [CommonModule, MatTreeModule, MatIconModule, FormsModule, MatSelectModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatProgressBarModule],
  templateUrl: './tipo-orden-servicio.component.html',
  styleUrl: './tipo-orden-servicio.component.css'
})
export class TipoOrdenServicioComponent {
    tipoOrdenForm!: FormGroup;
    nombreExistente: boolean = false;

    // Variables de usuario
    sidebarActive: boolean = false;
    nombreUsuario: string = '';
    apellidoUsuario: string = '';
    tiempoRestante: string = '';

    // Control de submenús
    showMecanicosMenu: boolean = false;
    showClientesMenu: boolean = false;
    showCitasMenu: boolean = false;
    showConfiguracionMenu: boolean = false;
    showTiposnMenu: boolean = false;
    showSubtiposnMenu: boolean = false;
    showHorariosMenu: boolean = false;
    showOrdenMenu: boolean = false;

    rolActivo: string = 'Sin rol'; 
    roles: string[] = [];

    constructor(
      private authService: AuthService,
      private router: Router,
      private http: HttpClient,
      private fb: FormBuilder,
      private tiposService: TiposService
    ) {
      this.tipoOrdenForm = this.fb.group({
        nombre: ['', [Validators.required]]
      });
    }

   ngOnInit(): void {
      this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
      this.rolActivo = localStorage.getItem('rol_activo') ?? '';
  
      // Obtener datos del usuario del localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.nombreUsuario = user.nombre || '';
      this.apellidoUsuario = user.apellido || '';
    
      this.iniciarReloj();
    }

    guardarTipoOrden(): void {
      if (this.tipoOrdenForm.valid) {
        const nombreServicio = this.tipoOrdenForm.value.nombre;
  
        // Verificar si el nombre ya existe antes de enviarlo
        this.tiposService.verificarNombreExiste(nombreServicio).subscribe(
          (existe: boolean) => {
            if (existe) {
              this.nombreExistente = true;
              Swal.fire({
                icon: 'warning',
                title: '¡Nombre duplicado!',
                text: 'Ese tipo de servicio ya existe. Intente con otro nombre.',
              });
            } else {
              // Si el nombre no existe, proceder con la creación
              this.tiposService.crearTipoServicio(this.tipoOrdenForm.value).subscribe(
                response => {
                  Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'El tipo de servicio ha sido agregado correctamente.',
                    showConfirmButton: true,
                    confirmButtonText: 'OK',
                    customClass: {
                      confirmButton: 'btn btn-success btn-rounded',
                    },
                  }).then(() => {
                    // al cerrar el alert, navego a la lista
                    this.navigateListarServicio();
                  });
  
                  this.tipoOrdenForm.reset();
                  this.nombreExistente = false; // Resetear validación
                },
                error => {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Ocurrió un problema al agregar el tipo de servicio. Inténtalo de nuevo.',
                  });
                }
              );
            }
          },
          error => {
            console.error('Error al verificar el nombre', error);
          }
        );
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Formulario inválido',
          text: 'Por favor, completa todos los campos requeridos.',
        });
      }
    }
  
    cambiarRol(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      const nuevoRol = selectElement.value;
  
      this.authService.cambiarRol(nuevoRol).subscribe({
        next: (response) => {
          console.log('Rol cambiado con éxito:', response);
          this.rolActivo = response.rol_activo;
          this.redirectUser(response.rol_activo);
        },
        error: (error) => {
          console.error('Error al cambiar de rol:', error);
        },
      });
    }
    
    private redirectUser(rolActivo: string): void {
      switch (rolActivo) {
        case 'admin':
          this.router.navigate(['/dashboard-admin']);
          break;
        case 'mecanico':
          this.router.navigate(['/dashboard-mecanico']);
          break;
        case 'cliente':
          this.router.navigate(['/dashboard-clientes']);
          break;
        default:
          this.router.navigate(['/login']);
          break;
      }
    }
  
    iniciarReloj(): void {
      const expirationTime = Number(localStorage.getItem('token_expiration')) || 0;
  
      if (!expirationTime) {
        this.tiempoRestante = '00:00';
        this.logout();
        return;
      }
  
      const timer = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = expirationTime - currentTime;
  
        if (remainingTime <= 0) {
          this.tiempoRestante = '00:00';
          clearInterval(timer); // Detiene el reloj
          this.logout(); // Redirige al login
        } else {
          this.tiempoRestante = this.formatearTiempo(remainingTime);
        }
      }, 1000);
    }
  
    formatearTiempo(segundos: number): string {
      const minutos = Math.floor(segundos / 60);
      const segundosRestantes = segundos % 60;
      return `${this.pad(minutos)}:${this.pad(segundosRestantes)}`;
    }
  
    pad(num: number): string {
      return num.toString().padStart(2, '0');
    }
  
    // Función de cierre de sesión
    logout(): void { 
      this.authService.logout(); // Llama al método de logout en AuthService
  
      this.router.navigate(['/login']).then(() => {
        window.location.reload(); // Recarga la página después de la redirección
      });
    }
  
    // Función para alternar los menús
    toggleMenu(menu: string): void {
      this.resetMenus(); // Cierra otros menús
      if (menu === 'mecanicos') {
        this.showMecanicosMenu = !this.showMecanicosMenu;
      } else if (menu === 'horarios') {
        this.showHorariosMenu = !this.showHorariosMenu;
      } else if (menu === 'tipos') {
          this.showTiposnMenu = !this.showTiposnMenu;
      } else if (menu === 'subtipos') {
        this.showSubtiposnMenu = !this.showSubtiposnMenu;
      } else if (menu === 'citas') {
        this.showCitasMenu = !this.showCitasMenu;
      } else if (menu === 'configuracion') {
        this.showConfiguracionMenu = !this.showConfiguracionMenu;
      } else if (menu === 'clientes') {
        this.showClientesMenu= !this.showClientesMenu;
      } else if (menu === 'orden') {
        this.showOrdenMenu= !this.showOrdenMenu;
      }
    }
  
    // Resetea todos los menús (ciérralos)
    resetMenus(): void {
      this.showMecanicosMenu = false;
      this.showHorariosMenu = false;
      this.showClientesMenu = false;
      this.showCitasMenu = false;
      this.showConfiguracionMenu = false;
      this.showTiposnMenu = false;
      this.showSubtiposnMenu = false;
      this.showOrdenMenu = false;
    }
  
    // Rutas del Panel - Listar Mecanico
    navigateListarMecanico() {
      this.router.navigate(['/listar-mecanico']);
    }
    // Rutas del Panel - Dashboard Admin
    navigateDashboardAdmin() {
      this.router.navigate(['/dashboard-admin']);
    }
    // Rutas del Panel - Crear Mecanico
    navigateToCrearMecanico() {
      this.router.navigate(['/crear-mecanico']);
    }
    // Rutas del Panel - Crear Horario
    navigateToCrearHorario() {
      this.router.navigate(['/crear-horario']);
    }
    // Rutas del Panel - Listar Horario
    navigateToListarHorario() {
      this.router.navigate(['/listar-horario']);
    }
    navigateArgregarServicio(): void {
      this.router.navigate(['/crear-tipo']);
    }
    navigateListarServicio(): void {
      this.router.navigate(['/listar-tipo']);
    }
    navigateListarSubtipo(): void {
      this.router.navigate(['/listar-subtipo']);
    }
    navigateListarCitas(): void {
      this.router.navigate(['/citas-admin']);
    }
    navigateListarClientes(): void {
      this.router.navigate(['/listar-clientes']);
    }
    navigateListarOrden(): void {
      this.router.navigate(['/tipo-orden-servicio']);
    }
  
  }
  