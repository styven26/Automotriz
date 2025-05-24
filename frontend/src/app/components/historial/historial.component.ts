import { Component, ViewChild } from '@angular/core'; 
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HistorialService } from '../../services/Historial/historial.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ClienteService } from '../../services/Cliente/cliente.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-historial',
  standalone: true,
  providers: [{ provide: LOCALE_ID, useValue: 'es' }], // Configura el idioma a nivel de componente
  imports: [CommonModule, MatFormFieldModule, MatIconModule, FormsModule, MatInputModule, MatButtonModule, MatTableModule, MatPaginatorModule, MatSortModule, MatDialogModule],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css']
})
export class HistorialComponent {

  constructor( private authService: AuthService, private clienteService: ClienteService, private historialService: HistorialService, private router: Router, private http: HttpClient, public dialog: MatDialog) {
    registerLocaleData(localeEs, 'es');
  }

  // Variables de usuario
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  tiempoRestante: string = '';
  showDropdown: boolean = false; // Controla la visibilidad del menú desplegable

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterValue: string = '';
  
  displayedColumns: string[] = ['fecha', 'tipo_servicio', 'costo'];
  dataSource = new MatTableDataSource<any>();

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showHistorialMenu: boolean = false;
  showMonitoreoMenu: boolean = false;

  
  ngOnInit(): void {
    this.roles = JSON.parse(sessionStorage.getItem('roles') ?? '[]');
    this.rolActivo = sessionStorage.getItem('rol_activo') ?? '';

    // Obtener datos del usuario del sessionStorage
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';

    const currentYear = new Date().getFullYear();
    this.anios = Array.from({ length: 10 }, (_, i) => currentYear - i);

    this.iniciarReloj(); // Configurar el reloj
    this.obtenerHistorial(); // Obtener el historial
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

  obtenerHistorial(): void {
    this.historialService.obtenerHistorial().subscribe(
      (data) => {
        // Actualiza los datos y asigna la paginación y el orden
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error) => {
        console.error('Error al obtener el historial:', error);
      }
    );
  }  

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  filtrosServicios: any = { anio: '', mes: '' };
  anios: number[] = [];
  meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  descargarHistorialPDF(): void {
    this.clienteService.descargarHistorialServicios(this.filtrosServicios);
  }

  iniciarReloj(): void {
    const expirationTime = Number(sessionStorage.getItem('token_expiration')) || 0;

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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = filterValue;
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
    } else if (menu === 'clientes') {
      this.showClientesMenu = !this.showClientesMenu;
    } else if (menu === 'citas') {
      this.showCitasMenu = !this.showCitasMenu;
    } else if (menu === 'monitoreo') {
      this.showMonitoreoMenu = !this.showMonitoreoMenu;
    } else if (menu === 'historial') {
      this.showHistorialMenu = !this.showHistorialMenu;
    } else if (menu === 'configuracion') {
      this.showConfiguracionMenu = !this.showConfiguracionMenu;
    }
  }

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showMecanicosMenu = false;
    this.showClientesMenu = false;
    this.showCitasMenu = false;
    this.showHistorialMenu = false;
    this.showConfiguracionMenu = false;
    this.showMonitoreoMenu = false;
  }

  // Funciones
  navigateCitasCliente() {
    this.router.navigate(['/calendario']);
  }
  navigateDashboarCliente(): void {
    this.router.navigate(['/dashboard-clientes']);
  }
  navigateVehiculoCliente() {
    this.router.navigate(['/registrar-vehiculo']);
  }
  navigateMonitoreoCliente() {
    this.router.navigate(['/monitoreo']);
  }
  navigateListadoVehiculos() {
    this.router.navigate(['/listar-vehiculo']);
  }
}