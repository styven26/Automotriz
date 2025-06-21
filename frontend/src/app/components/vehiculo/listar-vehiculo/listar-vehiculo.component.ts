import { Component, ViewChild } from '@angular/core'; 
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import Swal from 'sweetalert2'; 
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { TrabajosService } from '../../../services/Trabajos/trabajos.service';
import { MatTableDataSource } from '@angular/material/table';
import { VehiculoService } from '../../../services/Vehiculo/vehiculo.service';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ActualizarVehiculoComponent } from '../actualizar-vehiculo/actualizar-vehiculo.component'; // Importa el componente de edición

@Component({
    selector: 'app-listar-vehiculo',
    standalone: true,
    styleUrls: ['./listar-vehiculo.component.css'],
    imports: [CommonModule, MatTreeModule, MatIconModule, MatButtonModule, MatProgressBarModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatPaginatorModule,
        MatIconModule,
        MatDialogModule,
        MatSortModule],
    templateUrl: './listar-vehiculo.component.html'
})

export class ListarVehiculoComponent {

  constructor( private authService: AuthService, private router: Router, private trabajosService: TrabajosService, private http: HttpClient, private vehiculoService: VehiculoService, public dialog: MatDialog, private snackBar: MatSnackBar ) {}

  // Variables de usuario
  sidebarActive: boolean = false;
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  tiempoRestante: string = '';

  // DataSource para la tabla de vehículos
  displayedColumns: string[] = ['marca', 'modelo', 'anio', 'numero_placa', 'transmision', 'tipo_combustible', 'kilometraje', 'fecha_ultimo_servicio', 'imagen', 'acciones'];
  dataSource = new MatTableDataSource<any>();

  // Variable para mensajes de error
  errorMessage: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterValue: string = '';

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showHistorialMenu: boolean = false;
  showMonitoreoMenu: boolean = false;

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    // Obtener datos del usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';

    // Obtener la lista de vehículos
    this.obtenerVehiculos();
    this.iniciarReloj(); // Configurar el reloj
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

  // Obtener vehículos
  obtenerVehiculos(): void {
    this.vehiculoService.obtenerVehiculos().subscribe(
      (vehiculos) => {
        if (vehiculos.length === 0) {
          this.errorMessage = 'No tienes vehículos registrados.';
        }
        this.dataSource.data = vehiculos;
      },
      (error) => {
        this.errorMessage = 'Error al cargar los vehículos.';
        console.error(error);
      }
    );
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Editar vehículo
  editarVehiculo(vehiculo: any): void {
    const dialogRef = this.dialog.open(ActualizarVehiculoComponent, {
      data: vehiculo,
    });

    dialogRef.afterClosed().subscribe((updated: boolean) => {
      if (updated) {
        // como el modal ya hizo el PUT, ahora solo recargamos:
        this.obtenerVehiculos();
      }
    });
  }    

  // Eliminar vehículo (borrado lógico)
  eliminarVehiculo(vehiculo: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar el vehículo con placa: ${vehiculo.numero_placa}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded btn-spacing',
        cancelButton: 'btn btn-secondary btn-rounded btn-spacing',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.vehiculoService.eliminarVehiculo(vehiculo.id).subscribe(
          () => {
            // Mostrar notificación de éxito con Swal
            Swal.fire({
              icon: 'success',
              title: '¡Vehículo eliminado!',
              text: 'El vehículo se eliminó correctamente.',
              confirmButtonText: 'OK',
              customClass: {
                confirmButton: 'btn btn-success btn-rounded',
              },
              buttonsStyling: false,
            });
            this.obtenerVehiculos(); // Refrescar la lista después de la eliminación
          },
          (error) => {
            // Mostrar notificación de error con Swal
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el vehículo. Intenta nuevamente.',
              confirmButtonText: 'Cerrar',
              customClass: {
                confirmButton: 'btn btn-danger btn-rounded',
              },
              buttonsStyling: false,
            });
          }
        );
      }
    });
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
  navigateDashboarCliente(){
    this.router.navigate(['/dashboard-clientes']);
  }
  navigateVehiculoCliente() {
    this.router.navigate(['/registrar-vehiculo']);
  }
  navigateMonitoreoCliente() {
    this.router.navigate(['/monitoreo']);
  }
  navigateHistorial(){
    this.router.navigate(['/historial']);
  }
}