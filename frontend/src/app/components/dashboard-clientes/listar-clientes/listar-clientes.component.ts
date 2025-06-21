import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder} from '@angular/forms'; 
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { RouterModule } from '@angular/router'; // Importar RouterModule para usar rutas
import { AdministradorService } from '../../../services/Administrador/administrador.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';  
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-listar-clientes',
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
  templateUrl: './listar-clientes.component.html',
  styleUrl: './listar-clientes.component.css'
})
export class ListarClientesComponent {

  constructor( private fb: FormBuilder, private http: HttpClient, private snackBar: MatSnackBar, private router: Router, private authService: AuthService, private adminService: AdministradorService, public dialog: MatDialog) {}

  displayedColumns: string[] = ['nombre', 'apellido', 'cedula', 'correo', 'telefono', 'direccion_domicilio', 'acciones'];
  dataSource = new MatTableDataSource<any>(); // Inicializamos con un array vacío

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  isSubmitting: boolean = false;
  isModalOpen: boolean = false;
  showMecanicosMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showClientesMenu: boolean = false;
  showOrdenMenu: boolean = false;

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
    this.showCitasMenu = false;
    this.showClientesMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
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

    this.obtenerClientes();
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

  eliminarCliente(cliente: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar al cliente: ${cliente.nombre}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded',
        cancelButton: 'btn btn-secondary btn-rounded',
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.eliminarCliente(cliente.id).subscribe(
          (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Cliente eliminado correctamente.',
              confirmButtonText: 'OK',
              customClass: {
                confirmButton: 'btn btn-success btn-rounded',
              },
            });
            this.obtenerClientes(); // Refresca la lista de clientes
          },
          (error) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al eliminar el cliente.',
              confirmButtonText: 'OK',
              customClass: {
                confirmButton: 'btn btn-danger btn-rounded',
              },
            });
            console.error('Error al eliminar cliente:', error);
          }
        );
      }
    });
  }

  // Obtener lista de clientes
  obtenerClientes(): void {
    this.adminService.listarClientes().subscribe(
      (response) => {
        this.dataSource.data = response.clientes; // Asigna los clientes a la tabla
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
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
}