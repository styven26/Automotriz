import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder} from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { RouterModule } from '@angular/router'; // Importar RouterModule para usar rutas
import { MecanicoService } from '../../../services/Mecanico/mecanico.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { ActualizarMecanicoComponent } from '../actualizar-mecanico/actualizar-mecanico.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdministradorService } from '../../../services/Administrador/administrador.service';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';  
import Swal from 'sweetalert2'; 

@Component({
    selector: 'app-listar-mecanico',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatFormFieldModule,
        MatInputModule,
        MatTableModule,
        MatPaginatorModule,
        MatIconModule,
        MatSortModule,
        MatButtonModule
    ],
    templateUrl: './listar-mecanico.component.html',
    styleUrls: ['./listar-mecanico.component.css'],
    providers: [MecanicoService]
})
export class ListarMecanicoComponent {

  constructor( private fb: FormBuilder, private http: HttpClient, private admin:AdministradorService, private snackBar: MatSnackBar, private router: Router, private authService: AuthService, private mecanicoService: MecanicoService, public dialog: MatDialog) {}

  displayedColumns: string[] = ['nombre', 'apellido', 'cedula', 'fecha_nacimiento', 'correo', 'telefono', 'direccion_domicilio', 'especialidad', 'acciones'];
  dataSource!: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  isSubmitting: boolean = false;
  isModalOpen: boolean = false;
  showMecanicosMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showClientesMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;
  showReportes: boolean = false;

  // Añade estas variables al componente
  filtrosCitas: any = { anio: '', mes: '' };
  filtrosIngresos: any = { anio: '', mes: '' };

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  // Rutas del Panel - Crear Mecanico
  navigateToCrearMecanico() {
    this.router.navigate(['/crear-mecanico']);
  }
  // Rutas del Panel - Dashboard Admin
  navigateDashboardAdmin() {
    this.router.navigate(['/dashboard-admin']);
  }
  // Rutas del Panel - Listar Mecanico
  navigateListarMecanico() {
    this.router.navigate(['/listar-mecanico']);
  }
  // Rutas del Panel - Crear Horario
  navigateToCrearHorario(){
    this.router.navigate(['/crear-horario']);
  }
  // Rutas del Panel - Listar Horario
  navigateToListarHorario(){
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

   descargarCitasPDF(): void {
    this.admin.descargarReporteCitas(this.filtrosCitas);
  }
  
  descargarFinancieroPDF(): void {
    this.admin.descargarReporteFinanciero(this.filtrosIngresos);
  }  

  // Salir del Dashboard
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
    this.showHorariosMenu = false;
    this.showClientesMenu = false;
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
    this.showReportes = false;
  }

  // Listar Mecanicos
  mecanicos: any[] = [];

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario en localStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    this.obtenerMecanicos();
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

  // Obtener lista de mecánicos
  obtenerMecanicos(): void {
    this.mecanicoService.obtenerMecanicos().subscribe(
      (mecanicos) => {
        this.dataSource = new MatTableDataSource(mecanicos);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error) => {
        console.error('Error al obtener los mecánicos:', error);
      }
    );
  }

  filterValue: string = '';

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }  

  // Update Mecanicos
  editarMecanico(mecanico: any): void {
    const dialogRef = this.dialog.open(ActualizarMecanicoComponent, {
      data: mecanico, // Pasar los datos del mecánico al modal
    });

    dialogRef.afterClosed().subscribe(result => {
      this.isModalOpen = false;
      if (result) {
        this.mecanicoService.actualizarMecanico(mecanico.cedula, result).subscribe(
          (response) => {
            console.log('Mecánico actualizado con éxito:', response);
            this.obtenerMecanicos(); // Refresca la lista después de actualizar
          },
          (error) => {
            console.error('Error al actualizar el mecánico:', error);
          }
        );
      }
    });
  }

  // Eliminar Mecanicos
  eliminarMecanico(mecanico: any): void {
    // Verificar si el nombre del mecánico está presente en el objeto
    if (!mecanico || !mecanico.nombre) {
      console.error('No se puede eliminar el mecánico: Nombre no encontrado');
      return;
    }
  
    // Mostrar cuadro de confirmación con SweetAlert2
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar al mecánico: ${mecanico.nombre}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded', // Personalizar botón de eliminar
        cancelButton: 'btn btn-secondary btn-rounded', // Personalizar botón de cancelar
      },
      buttonsStyling: false, // Deshabilitar estilos automáticos
    }).then((result) => {
      if (result.isConfirmed) {
        // Si se confirma la eliminación, se realiza la llamada al servicio
        this.mecanicoService.eliminarMecanico(mecanico.cedula).subscribe(
          (response) => {
            // Mostrar notificación de éxito
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Mecánico eliminado con éxito.',
              showConfirmButton: true, // Mostrar el botón de confirmación
              confirmButtonText: 'OK', // Texto del botón
              customClass: {
                confirmButton: 'btn btn-success btn-rounded', // Personalizar el botón
              },
            });            

            this.obtenerMecanicos(); // Refrescar la lista después de la eliminación
          },
          (error) => {
            // Manejo de errores
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al eliminar el mecánico.',
              showConfirmButton: true, // Mostrar botón de confirmación
              confirmButtonText: 'OK', // Texto del botón
              customClass: {
                confirmButton: 'btn btn-danger btn-rounded', // Personalizar botón de error
              },
            });            
            console.error('Error al eliminar el mecánico:', error);
          }
        );
      }
    });
  }
}