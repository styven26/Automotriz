import { Component,  ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { TiposService } from '../../../services/Tiposervicios/tipos.service'; // Importa el servicio
import Swal from 'sweetalert2';
import { ActualizarTiposComponent } from '../actualizar-tipos/actualizar-tipos.component';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AdministradorService } from '../../../services/Administrador/administrador.service';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

@Component({
  selector: 'app-listar-tipos',
  standalone: true,
  imports: [CommonModule, MatTreeModule, MatIconModule, MatSelectModule, MatSnackBarModule, MatTableModule, MatPaginatorModule, MatSortModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatProgressBarModule],
  templateUrl: './listar-tipos.component.html',
  styleUrls: ['./listar-tipos.component.css']
})
export class ListarTiposComponent {

  displayedColumns: string[] = ['nombre', 'activo', 'acciones'];
  dataSource!: MatTableDataSource<any>;
  filterValue: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
    
  // Variables de usuario
  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  filtrosCitas: any = { anio: '', mes: '' };
  filtrosIngresos: any = { anio: '', mes: '' };

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showOrdenMenu: boolean = false;
  showReportes: boolean = false;

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private tiposService: TiposService,
    private snackBar: MatSnackBar,
    private admin: AdministradorService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
      this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    // Obtener datos del usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';

    this.obtenerTiposServicios();
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

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  obtenerTiposServicios(): void {
    this.tiposService.obtenerTiposServicios().subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error) => {
        console.error('Error al obtener los tipos de servicios:', error);
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

  editarTipoServicio(tipo: any): void {
    const dialogRef = this.dialog.open(ActualizarTiposComponent, {
      width: '600px',
      data: tipo
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Usa el id real de tu modelo
        const id = tipo.id_tipo;
  
        this.tiposService.actualizarTipoServicio(id, result).subscribe(
          response => {
            console.log('Tipo de servicio actualizado con éxito:', response);
            this.obtenerTiposServicios();
            Swal.fire('Actualizado', 'El tipo de servicio se ha actualizado con éxito.', 'success');
          },
          error => {
            console.error('Error al actualizar el tipo de servicio:', error);
            Swal.fire('Error', 'Hubo un problema al actualizar el tipo de servicio.', 'error');
          }
        );
      }
    });
  }    

  eliminarTipoServicio(tipo: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de desactivar el tipo de servicio: ${tipo.nombre}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded',
        cancelButton: 'btn btn-secondary btn-rounded'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        // aquí usamos la PK real
        const id = tipo.id_tipo;
  
        this.tiposService.eliminarTipoServicio(id).subscribe(
          () => {
            Swal.fire('Desactivado', 'El tipo de servicio se ha desactivado con éxito.', 'success');
            this.obtenerTiposServicios(); // refresca lista
          },
          (error) => {
            console.error('Error al desactivar el tipo de servicio:', error);
            Swal.fire('Error', 'Hubo un problema al desactivar el tipo de servicio.', 'error');
          }
        );
      }
    });
  }  

  reactivarTipoServicio(tipo: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de reactivar el tipo de servicio: ${tipo.nombre}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Reactivar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-success btn-rounded',
        cancelButton: 'btn btn-secondary btn-rounded'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        const id = tipo.id_tipo;
        this.tiposService.reactivarTipoServicio(id).subscribe(
          () => {
            Swal.fire('Reactivado', 'El tipo de servicio se ha reactivado con éxito.', 'success');
            this.obtenerTiposServicios(); // refresca la lista
          },
          (error) => {
            console.error('Error al reactivar el tipo de servicio:', error);
            Swal.fire('Error', 'Hubo un problema al reactivar el tipo de servicio.', 'error');
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

  descargarCitasPDF(): void {
    this.admin.descargarReporteCitas(this.filtrosCitas);
  }

  descargarFinancieroPDF(): void {
    this.admin.descargarReporteFinanciero(this.filtrosIngresos);
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
    } else if (menu === 'reportes') {
      this.showReportes = !this.showReportes;
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
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showClientesMenu = false;
    this.showOrdenMenu = false;
    this.showReportes = false;
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
  navigateConfiguracion() {
    this.router.navigate(['/configuracion']);
  }
}