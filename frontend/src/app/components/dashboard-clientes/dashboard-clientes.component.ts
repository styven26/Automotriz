import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CitasService, DistribucionServicio, IngresoPorMes } from '../../services/Citas/citas.service';
import { VehiculoService } from '../../services/Vehiculo/vehiculo.service';
import { IgxCardModule, IgxButtonModule, IgxRippleModule, IgxIconModule } from 'igniteui-angular';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NotificacionesService } from '../../services/Notificaciones/notificaciones.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-dashboard-clientes',
    standalone: true,
    templateUrl: './dashboard-clientes.component.html',
    styleUrls: ['./dashboard-clientes.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, MatTreeModule, NgxChartsModule, IgxCardModule, MatIconModule, IgxButtonModule, IgxRippleModule, IgxIconModule, MatButtonModule, MatProgressBarModule]
})
export class DashboardClientesComponent implements OnInit {

  tiempoRestante: string = '';
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  vehiculosRegistrados: number = 0;
  proximasCitas: number = 0;
  facturacionTotal: number = 0;
  citasCanceladas: number = 0;

  ingresosPorMes: { name: string; value: number }[] = []; // Inicializa como un array vacío
  distribucionServicios: any[] = [];
  facturacionMensual: number = 0;

  // Variables de usuario
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showHistorialMenu: boolean = false;
  showMonitoreoMenu: boolean = false;
  showVehiculoMenu: boolean = false;

  constructor(private authService: AuthService, private vehiculoService: VehiculoService, private notificacionesService: NotificacionesService, private citasService: CitasService, private router: Router) {   console.log('✅ DashboardClientesComponent cargado correctamente');
  }

  ngOnInit(): void {

    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) {
      this.router.navigate(['/login']);
      return;
    }

    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';                        

    this.cargarDatosDashboard();
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
      case 'vendedor':
        this.router.navigate(['/dashboard-vendedor']);
        break;
      case 'cliente':
        this.router.navigate(['/dashboard-clientes']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  cargarDatosDashboard(): void {
    forkJoin({
      vehiculos: this.vehiculoService.obtenerVehiculos(),
      citas: this.citasService.listarCitasAtendidas(),  // Este endpoint ya trae citas con estado "atendida"
      facturacion: this.citasService.obtenerFacturacionTotal(),
      distribucionServicios: this.citasService.obtenerDistribucionServicios(),
      ingresosPorMes: this.citasService.obtenerIngresosPorMes(),
    }).subscribe(
      ({ vehiculos, citas, facturacion, distribucionServicios, ingresosPorMes }) => {
        // Total de vehículos registrados
        this.vehiculosRegistrados = Array.isArray(vehiculos) ? vehiculos.length : 0;
    
        // Citas atendidas: contar todas las citas recibidas sin filtrar por fecha
        this.proximasCitas = Array.isArray(citas) ? citas.length : 0;
    
        // Citas canceladas (si aplica)
        this.citasCanceladas = Array.isArray(citas)
          ? citas.filter((cita: any) => cita.estado === 'cancelada').length
          : 0;
    
        // Facturación total
        this.facturacionTotal = facturacion?.facturacionTotal || 0;
    
        // Distribución de servicios
        this.distribucionServicios = Array.isArray(distribucionServicios)
          ? distribucionServicios.map((servicio: DistribucionServicio) => ({
              name: servicio.nombre,
              value: servicio.total_solicitudes,
            }))
          : [];
    
        // Ingresos por mes
        this.ingresosPorMes = Array.isArray(ingresosPorMes)
          ? ingresosPorMes.map((item: any) => ({
              name: item.name || 'Mes desconocido',
              value: item.value ?? 0,
            }))
          : [];
    
        console.log('Datos del Dashboard cargados:', {
          vehiculos: this.vehiculosRegistrados,
          proximasCitas: this.proximasCitas,
          citasCanceladas: this.citasCanceladas,
          facturacionTotal: this.facturacionTotal,
          distribucionServicios: this.distribucionServicios,
          ingresosPorMes: this.ingresosPorMes,
        });
      },
      (error: any) => {
        console.error('Error al cargar los datos del Dashboard:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos del dashboard.', 'error');
    
        // Inicializa valores en caso de error
        this.vehiculosRegistrados = 0;
        this.proximasCitas = 0;
        this.citasCanceladas = 0;
        this.facturacionTotal = 0;
        this.distribucionServicios = [];
        this.ingresosPorMes = [];
      }
    );    
  }  

  obtenerDistribucionServicios(): void {
    this.citasService.obtenerDistribucionServicios().subscribe((data: DistribucionServicio[]) => {
      this.distribucionServicios = data.map(servicio => ({
        name: servicio.nombre,
        value: servicio.total_solicitudes
      }));
    });
  }
  
  obtenerIngresosPorMes(): void {
    this.citasService.obtenerIngresosPorMes().subscribe(
      (data) => {
        this.ingresosPorMes = data.map((item) => ({
          name: item.name || 'Mes desconocido',
          value: item.value || 0, // Asegúrate de que el valor sea un número
        }));
        console.log('Datos de ingresos por mes:', this.ingresosPorMes);
      },
      (error) => {
        console.error('Error al cargar los ingresos por mes:', error);
      }
    );
  }           

  cargarVehiculos(): void {
    this.vehiculoService.obtenerVehiculos().subscribe((response) => {
      this.vehiculosRegistrados = response.length;

      const anios: { [key: string]: number } = {};
      response.forEach((vehiculo: any) => {
        const anio = vehiculo.anio || 'Desconocido';
        anios[anio] = (anios[anio] || 0) + 1;
      });
    });
  }

  cargarCitas(): void {
    this.citasService.listarCitasAtendidas().subscribe((response) => {
      const proximas = response.filter(
        (cita: any) => new Date(cita.fecha) > new Date()
      );
      this.proximasCitas = proximas.length;

      const canceladas = response.filter(
        (cita: any) => cita.estado === 'cancelada'
      );
      this.citasCanceladas = canceladas.length;
    });
  }

  cargarFacturacionTotal(): void {
    this.citasService.obtenerFacturacionTotal().subscribe(
      (response) => {
        this.facturacionTotal = Number(response?.facturacionTotal) || 0; // Convierte a número o usa 0 por defecto
      },
      (error) => {
        console.error('Error al cargar la facturación total:', error);
        this.facturacionTotal = 0; // Asignar 0 en caso de error
        Swal.fire('Error', 'No se pudo cargar la facturación total.', 'error');
      }
    );
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
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => {
        window.location.reload();
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
  navigateVehiculoCliente() {
    this.router.navigate(['/registrar-vehiculo']);
  }
  navigateListarVehiculos() {
    this.router.navigate(['/listar-vehiculo']);
  }
  navigateCitas() {
    this.router.navigate(['/calendario']);
  }
  navigateMonitoreo() {
    this.router.navigate(['/monitoreo']);
  }
  navigateHistorial() {
    this.router.navigate(['/historial']);
  }
}