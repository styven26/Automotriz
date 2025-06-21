import { Component,  ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { SubtipoService } from '../../services/Subtiposervicios/subtipo.service'; // Importa el servicio
import { ActualizarSubtiposComponent } from '../subtipos-servicios/actualizar-subtipos/actualizar-subtipos.component';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subtipos-servicios',
  standalone: true,
  imports: [CommonModule, MatTreeModule, MatIconModule, MatSelectModule, MatSnackBarModule, MatTableModule, MatPaginatorModule, MatSortModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatProgressBarModule],
  templateUrl: './subtipos-servicios.component.html',
  styleUrls: ['./subtipos-servicios.component.css']
})
export class SubtiposServiciosComponent {

  displayedColumns: string[] = ['tipo', 'nombre', 'descripcion', 'precio_base', 'iva', 'precio', 'acciones'];
  dataSource!: MatTableDataSource<any>;
  filterValue: string = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Variables de usuario
  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private subtipoService: SubtipoService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    // Obtener datos del usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';
    this.obtenerSubtiposServicios();
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

  transformarMinutosAHoras(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
  
    // Construir el formato legible
    return `${horas > 0 ? horas + 'h' : ''} ${minutosRestantes}m`.trim();
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

  obtenerSubtiposServicios(): void {
    this.subtipoService.obtenerSubtiposServicios().subscribe(
      (data) => {
        this.dataSource = new MatTableDataSource(data);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error) => {
        console.error('Error al obtener los subtipos de servicios:', error);
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

  editarSubtipoServicio(servicio: any): void {
    const dialogRef = this.dialog.open(ActualizarSubtiposComponent, {
      width: '600px',
      data: servicio
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Usamos la propiedad correcta "id_servicio"
        this.subtipoService.actualizarSubtipoServicio(servicio.id_servicio, result).subscribe(
          (response) => {
            console.log('Servicio actualizado con éxito:', response);
            this.obtenerSubtiposServicios();
            Swal.fire('Actualizado', 'El servicio se ha actualizado con éxito.', 'success');
          },
          (error) => {
            console.error('Error al actualizar el servicio:', error);
            Swal.fire('Error', 'Hubo un problema al actualizar el servicio.', 'error');
          }
        );
      }
    });
  }  

  eliminarSubtipoServicio(servicio: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar el servicio: ${servicio.nombre}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded',
        cancelButton: 'btn btn-secondary btn-rounded'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        // Usamos la propiedad correcta "id_servicio"
        this.subtipoService.eliminarSubtipoServicio(servicio.id_servicio).subscribe(
          (response) => {
            Swal.fire('Eliminado', 'El servicio se ha eliminado con éxito.', 'success');
            this.obtenerSubtiposServicios();
          },
          (error) => {
            console.error('Error al eliminar el servicio:', error);
            Swal.fire('Error', 'Hubo un problema al eliminar el servicio.', 'error');
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
    this.showClientesMenu = false;
    this.showHorariosMenu = false;
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
  }

  // Funciones de navegación del menú
  navigateDashboardAdmin() {
    this.router.navigate(['/dashboard-admin']);
  }
  navigateToCrearMecanico() {
    this.router.navigate(['/crear-mecanico']);
  }
  navigateListarMecanico() {
    this.router.navigate(['/listar-mecanico']);
  }
  navigateToCrearHorario(){
    this.router.navigate(['/crear-horario']);
  }
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
}
