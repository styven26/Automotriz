import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { RouterModule } from '@angular/router'; // Importar RouterModule para usar rutas
import { HorarioService } from '../../../services/Horario/horario.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { ActualizarHorariosComponent } from '../../../components/horarios/actualizar-horarios/actualizar-horarios.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';  
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-listar-horarios',
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
    MatButtonModule], 
  templateUrl: './listar-horarios.component.html',
  styleUrls: ['./listar-horarios.component.css']
})
export class ListarHorariosComponent {

  displayedColumns: string[] = [
    'dia', 
    'manana', 
    'tarde', 
    'capacidad_max', 
    'acciones'
  ]; 

  dataSource!: MatTableDataSource<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  filterValue: string = '';

  constructor(
    private horarioService: HorarioService, 
    private snackBar: MatSnackBar, 
    private router: Router, 
    private authService: AuthService, 
    public dialog: MatDialog
  ) {}

  tiempoRestante: string = '';
  showMecanicosMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showClientesMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
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
  // Rutas del Panel - Listar Mecanico
  navigateToListarHorario() {
    this.router.navigate(['/listar-horario']);
  }
  // Rutas del Panel - Crear Horario
  navigateToCrearHorario() {
    this.router.navigate(['/crear-horario']);
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
    this.showHorariosMenu = false;
    this.showCitasMenu = false;
    this.showClientesMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
  }

  ngOnInit(): void {
    this.roles = JSON.parse(sessionStorage.getItem('roles') ?? '[]');
    this.rolActivo = sessionStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    console.log('Usuario en sessionStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';
    
    this.obtenerHorarios();
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

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = this.filterValue;
  
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Obtener todos los horarios desde el servicio y transformarlos
  obtenerHorarios(): void {
    this.horarioService.getHorarios().subscribe(
      (horarios) => {
        horarios.forEach((horario: any) => {
          horario.manana_inicio = horario.manana_inicio.substring(0, 5); // Quitar segundos
          horario.tarde_fin = horario.tarde_fin.substring(0, 5); // Quitar segundos
        });
        this.dataSource = new MatTableDataSource(horarios);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      },
      (error) => {
        console.error('Error al obtener los horarios:', error);
      }
    );
  }  
  
  editarHorario(horario: any): void {
    const dialogRef = this.dialog.open(ActualizarHorariosComponent, {
      data: {
        id: horario.id_horario,        // Se usa la PK correcta
        dia: horario.dia_semana,
        mananaInicio: horario.manana_inicio,
        tardeFin: horario.tarde_fin,
        capacidad: horario.capacidad_max  // Se usa el campo correcto
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.id) {
        // Diálogo de confirmación para actualizar
        Swal.fire({
          title: '¿Estás seguro?',
          text: "¿Quieres actualizar este horario?",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, actualizar',
          cancelButtonText: 'Cancelar'
        }).then((confirmation) => {
          if (confirmation.isConfirmed) {
            // Procede con la actualización
            this.horarioService.updateHorario(result.id, result).subscribe(
              () => {
                Swal.fire({
                  icon: 'success',
                  title: 'Horario actualizado',
                  text: 'El horario ha sido actualizado exitosamente.',
                  confirmButtonText: 'OK',
                });
                this.obtenerHorarios();
              },
              (error) => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error al actualizar',
                  text: 'Hubo un problema al actualizar el horario. Intenta de nuevo.',
                  confirmButtonText: 'OK',
                });
              }
            );
          }
        });
      }
    });
  }

  eliminarHorario(horario: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Estás a punto de eliminar el horario para ${horario.dia_semana}. ¡Esta acción no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded', // Personalizar botón de eliminar
        cancelButton: 'btn btn-secondary btn-rounded', // Personalizar botón de cancelar
      },
      buttonsStyling: false,
    }).then((result) => {
      if (result.isConfirmed) {
        this.horarioService.deleteHorario(horario.id_horario).subscribe(
          () => {
            this.snackBar.open('Horario eliminado con éxito', 'Cerrar', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'center',
              panelClass: ['snackbar-success'],
            });
            this.obtenerHorarios();
          },
          (error) => {
            this.snackBar.open('Error al eliminar el horario', 'Cerrar', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'center',
              panelClass: ['snackbar-error'],
            });
          }
        );
      }
    });
  }
}
