import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // FormsModule y ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../services/auth.service';
import { OptionService } from '../../services/option.service'; 
import { AdministradorService } from '../../services/Administrador/administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-configuraciones',
  standalone: true,
  imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatDatepickerModule,
      MatSelectModule,
      MatNativeDateModule,
      MatButtonModule,
      MatIconModule,
      MatListModule,
      MatDividerModule
  ],
  templateUrl: './configuraciones.component.html',
  styleUrls: ['./configuraciones.component.css']
})
export class ConfiguracionesComponent {

  constructor( private fb: FormBuilder, private http: HttpClient, private optionSvc: OptionService, private admin: AdministradorService, private router: Router, private authService: AuthService ) {}

  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  filtrosCitas: any = { anio: '', mes: '' };
  filtrosIngresos: any = { anio: '', mes: '' };

  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  isSubmitting: boolean = false; // Control del estado de carga

  // Catálogos dinámicos
  transmissions: { id: string; name: string }[] = [];
  fuelTypes:    { id: string; name: string }[] = [];
  especialidades:{ id: string; name: string }[] = [];

  // Campos para nuevos registros
  newTransName = '';
  newFuelName  = '';
  newEspecialidadName = '';

  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;
  showReportes: boolean = false;

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

  // Validaciones de cada campo
  registerForm!: FormGroup;

  ngOnInit(): void {

    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario en localStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    this.loadOptions();
    this.iniciarReloj();
  }

  descargarCitasPDF(): void {
    this.admin.descargarReporteCitas(this.filtrosCitas);
  }

  descargarFinancieroPDF(): void {
    this.admin.descargarReporteFinanciero(this.filtrosIngresos);
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

  // Carga transmisiones y combustibles
  private loadOptions(): void {
    this.optionSvc.list().subscribe(opts => {
      this.transmissions   = opts.transmissions;
      this.fuelTypes       = opts.fuel_types;
      this.especialidades  = opts.especialidades;
    });
  }

  // CRUD Transmissions
  addTransmission(): void {
    if (!this.newTransName.trim()) {
      Swal.fire('Error', 'Ingrese un nombre válido', 'error');
      return;
    }
    this.optionSvc.addTrans(this.newTransName).subscribe(() => {
      Swal.fire('Éxito', 'Transmisión agregada', 'success');
      this.newTransName = '';
      this.loadOptions();
    }, () => Swal.fire('Error', 'No se pudo agregar la transmisión', 'error'));
  }

  deleteTransmission(id: string): void {
    this.optionSvc.delTrans(id).subscribe(() => {
      Swal.fire('Éxito', 'Transmisión eliminada', 'success');
      this.loadOptions();
    }, () => Swal.fire('Error', 'No se pudo eliminar la transmisión', 'error'));
  }

  // CRUD Fuel Types
  addFuelType(): void {
    if (!this.newFuelName.trim()) {
      Swal.fire('Error', 'Ingrese un nombre válido', 'error');
      return;
    }
    this.optionSvc.addFuel(this.newFuelName).subscribe(() => {
      Swal.fire('Éxito', 'Combustible agregado', 'success');
      this.newFuelName = '';
      this.loadOptions();
    }, () => Swal.fire('Error', 'No se pudo agregar el combustible', 'error'));
  }

  deleteFuelType(id: string): void {
    this.optionSvc.delFuel(id).subscribe(() => {
      Swal.fire('Éxito', 'Combustible eliminado', 'success');
      this.loadOptions();
    }, () => Swal.fire('Error', 'No se pudo eliminar el combustible', 'error'));
  }

  /** Agrega una nueva especialidad */
  addEspecialidad(): void {
    if (!this.newEspecialidadName.trim()) {
      Swal.fire('Error', 'Ingrese un nombre válido', 'error');
      return;
    }
    this.optionSvc.addEspecialidad(this.newEspecialidadName).subscribe(() => {
      Swal.fire('Éxito', 'Especialidad agregada', 'success');
      this.newEspecialidadName = '';
      this.loadOptions();
    }, () => Swal.fire('Error', 'No se pudo agregar la especialidad', 'error'));
  }

  /** Elimina una especialidad */
  deleteEspecialidad(id: string): void {
    this.optionSvc.delEspecialidad(id).subscribe(() => {
      Swal.fire('Éxito', 'Especialidad eliminada', 'success');
      this.loadOptions();
    }, () => Swal.fire('Error', 'No se pudo eliminar la especialidad', 'error'));
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
    } else if (menu === 'reportes') {
      this.showReportes = !this.showReportes;
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
    this.showOrdenMenu = false;
    this.showSubtiposnMenu = false;
    this.showReportes = false;
  }

}