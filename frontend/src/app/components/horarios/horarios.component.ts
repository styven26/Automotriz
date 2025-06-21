import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // FormsModule y ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { HorarioService } from '../../services/Horario/horario.service';
import { AuthService } from '../../services/auth.service';
import { MatSelectModule } from '@angular/material/select'; // Importar MatSelectModule
import Swal from 'sweetalert2';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, MatButtonModule, MatNativeDateModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule ], 
  templateUrl: './horarios.component.html',
  styleUrls: ['./horarios.component.css']
})
export class HorariosComponent {

  horarioForm!: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService, private horarioService: HorarioService) {}

  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  showMecanicosMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showClientesMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

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
  // Rutas del Panel - Listar Horarios
  navigateListarHorarios() {
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

  logout(): void { 
    this.authService.logout(); // Llama al método de logout en AuthService

    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Recarga la página después de la redirección
    });
  }

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

  resetMenus(): void {
    this.showMecanicosMenu = false;
    this.showClientesMenu = false;
    this.showHorariosMenu = false;
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
  }

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario en localStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    this.horarioForm = this.fb.group({
      dia_semana: ['', Validators.required],
      manana_inicio: [''],
      tarde_fin: [''],
      capacidad_max: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/), Validators.max(10)]], // Rango 1-10
    });
  
    this.iniciarReloj();
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

  onSubmit(): void {
    if (this.horarioForm.valid) {
      const horarioData = this.horarioForm.value;
  
      this.horarioService.verificarFranjaHoraria(horarioData)
        .subscribe(response => {
          if (response.existe) {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: `Ya existe un horario configurado para ${horarioData.dia_semana}.`
            });
          } else {
            // Crear el horario si no hay solapamiento
            this.horarioService.createHorario(horarioData).subscribe(
              response => {
                console.log('Horario creado con éxito:', response);
                Swal.fire({
                  icon: 'success',
                  title: 'Éxito',
                  text: `Horario para ${horarioData.dia_semana} creado con éxito.`
                });
                this.router.navigate(['/listar-horario']);
              },
              error => {
                console.error('Error al crear horario:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Hubo un problema al crear el horario. Intente de nuevo.'
                });
              }
            );
          }
        });
    }
  }  

  get diaSemanaErrors() {
    const errors = this.horarioForm.get('dia_semana')?.errors;
    return errors?.['required'] ? 'El día de la semana es obligatorio.' : null;
  }
  
}
