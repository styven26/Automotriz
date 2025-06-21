import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule} from '@swimlane/ngx-charts';
import { Router } from '@angular/router';
import { MonitoreoService, Monitoreo } from '../../services/Monitoreo/monitoreo.service';
import { AuthService } from '../../services/auth.service';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar'; 
import { MatCardModule } from '@angular/material/card'; 
import { MatButtonModule } from '@angular/material/button'; 
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { NotificacionesService } from '../../services/Notificaciones/notificaciones.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { ViewChild } from '@angular/core';
import { ClienteService } from '../../services/Cliente/cliente.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-monitoreo',
    standalone: true,
    imports: [CommonModule, NgxChartsModule, MatTableModule, MatPaginator, MatCardModule, MatButtonModule, MatProgressBarModule],
    templateUrl: './monitoreo.component.html',
    styleUrls: ['./monitoreo.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class MonitoreoComponent {

  constructor(private authService: AuthService, private clienteService: ClienteService, private router: Router, private notificacionesService: NotificacionesService, private monitoreoService: MonitoreoService) {}

  view: [number,number] = [700,600];
  private dataSubscription!: Subscription;
  showDropdown: boolean = false; // Controla la visibilidad del menú desplegable

  // Datos para las gráficas
  categoryData = [
    { name: 'Revisión', value: 0 },
    { name: 'Reparación', value: 0 },
    { name: 'Finalización', value: 0 },
    { name: 'Cancelado', value: 0 }
  ];

  // Datos para las gráficas y tablas
  sidebarActive: boolean = false;
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  skuSalesData: any[] = []; // Gráfico de barras
  countryOrders: any[] = []; // Tabla de vehículos y clientes
  ordersStatus: any[] = []; // Tabla de progreso
  monitoreos: Monitoreo[] = []; // Datos originales del backend

  // Variables de usuario
  tiempoRestante: string = '';

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

  displayedColumns: string[] = ['vehiculo', 'etapa', 'servicios'];
  dataSource = new MatTableDataSource<any>(this.ordersStatus);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;
  
    if (user) {
      this.nombreUsuario = user.nombre || '';
      this.apellidoUsuario = user.apellido || '';
    } else {
      console.log('Usuario no autenticado o datos faltantes en el localStorage.');
      this.router.navigate(['/login']); // Redirigir al login si no hay datos
    }

    this.notificacionesService.subscribeToTrabajoActualizado(user.id, (data: any) => {
      // Ahora el backend envía 'detalles' en lugar de 'subtipos'
      if (Array.isArray(data.detalles)) {
        const serviciosHtml = data.detalles
          .map(
            (detalle: any) => `<div style="
                margin-bottom: 8px; 
                display: flex; 
                align-items: center; 
                font-family: 'Poppins', sans-serif; 
                font-size: 14px; 
                color: #333;
                text-transform: uppercase;
              ">
                🔧 
                <strong style="color: #4CAF50; margin: 0 8px 0 4px;">
                  ${detalle.servicio}:
                </strong> 
                ${detalle.descripcion}
              </div>
            `
          )
          .join('');

        const mensajeHtml = `<div style="
            font-family: 'Poppins', sans-serif; 
            text-align: center; 
            line-height: 1.6; 
            font-size: 14px;
            text-transform: uppercase;
          "> <p style="
              font-size: 16px; 
              font-weight: bold; 
              color: #2196F3; 
              margin-bottom: 15px;
            "> 🚗 Vehículo: 
              <span style="color: #2196F3;">${data.vehiculo}</span>
            </p> <p style="
              font-size: 16px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 15px;
            "> 📋 Estado del Trabajo: 
              <span style="color: #FF9800;">${data.estado}</span>
            </p>
            <p style=" font-size: 16px; 
              font-weight: bold; 
              color: #333; 
              margin-bottom: 10px;
            "> 🛠️ Servicios Actualizados:
            </p>
            <div style=" max-height: 40vh;      /* altura máxima */
              overflow-y: auto;      /* scroll vertical si supera esa altura */
              padding: 0 20px;       /* espacio interior */
              text-align: left;
            ">
              ${serviciosHtml}
            </div>
          </div>
        `;

        Swal.fire({
          title:`<h5 style="
              font-family: Poppins, sans-serif;
              font-size: 20px;         /* un poco más grande */
              font-weight: 900;        /* más grueso que bold */
              color: #3F51B5;
              text-transform: uppercase;
              margin: 0;
            ">
              <strong>Actualización de Trabajo</strong>
            </h5>
          `,
          html: mensajeHtml,
          icon: 'info',
          iconColor: '#3F51B5',
          showCancelButton: false,
          confirmButtonText: `
            <span style="
              font-family: 'Poppins', sans-serif;
              font-size: 14px;
              font-weight: bold;
              color: #ffffff;
              text-transform: uppercase;
            ">
              Aceptar
            </span>
          `,
          confirmButtonColor: '#4CAF50',
        });
      } else {
        console.error('Error: `detalles` no es un array o está indefinido.', data.detalles);
      }
    });

    this.iniciarReloj();
    this.cargarMonitoreos();
    this.onResize();

    // Usa interval para actualizar los datos periódicamente
    this.dataSubscription = interval(3000).subscribe(() => {
      this.cargarMonitoreos();
    });
  }

  @HostListener('window:resize')
  onResize() {
    const w = window.innerWidth;
    if (w < 600) {
      // móvil: cuadrado pequeño
      this.view = [w * 0.8, w * 0.8];
    } else if (w < 960) {
      // tablet: un poco más grande
      this.view = [w * 0.7, w * 0.7];
    } else {
      // escritorio
      this.view = [700, 600];
    }
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

  toggleDropdown(): void {
      this.showDropdown = !this.showDropdown;
  }
  
  descargarEstadoVehiculos(): void {
    this.clienteService.descargarEstadoVehiculos().subscribe(
      (response: Blob) => {
        const blob = new Blob([response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'reporte-estado-vehiculos.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      (error: any) => {
        console.error('Error al descargar el reporte:', error);
        const errorMessage =
          error.status === 404
            ? 'El reporte no está disponible.'
            : 'No se pudo descargar el reporte. Inténtalo más tarde.';
        Swal.fire('Error', errorMessage, 'error');
      }
    );
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe(); // Detener la suscripción al destruir el componente
    }
  }
  
  cargarMonitoreos(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token disponible, deteniendo monitoreo');
      return;
    }
  
    this.monitoreoService.obtenerTodosMonitoreos().subscribe({
      next: (data) => {
        console.log('Datos monitoreos:', data);
        this.procesarDatos(data); // Procesa los datos para actualizarlos en el HTML
      },
      error: (err) => {
        console.error('Error al cargar monitoreos:', err);
      },
    });
  }  

  procesarDatos(monitoreos: Monitoreo[]): void {
    const etapas: Record<'Revisión' | 'Reparación' | 'Finalización', number> = {
      Revisión: 0,
      Reparación: 0,
      Finalización: 0,
    };
  
    monitoreos.forEach((monitoreo) => {
      const etapa = monitoreo.etapa.charAt(0).toUpperCase() + monitoreo.etapa.slice(1).toLowerCase();
      if (etapas[etapa as keyof typeof etapas] !== undefined) {
        etapas[etapa as keyof typeof etapas]++;
      }
    });
  
    this.categoryData = Object.keys(etapas).map((key) => ({
      name: key,
      value: etapas[key as keyof typeof etapas],
    }));
  
    // Mapear monitoreos a ordersStatus
    this.ordersStatus = monitoreos.map((monitoreo) => ({
      vehiculo: `${monitoreo.vehiculo.marca} ${monitoreo.vehiculo.modelo}`,
      etapa: monitoreo.etapa,
      servicios: monitoreo.servicios.map((servicio) => ({
        nombre: servicio.nombre,
        progreso: servicio.progreso,
      })),
    }));
    this.dataSource.data = this.ordersStatus;
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
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
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
  navigateDashboarCliente(): void {
    this.router.navigate(['/dashboard-clientes']);
  }
  navigateVehiculoCliente() {
    this.router.navigate(['/registrar-vehiculo']);
  }
  navigateListarVehiculos() {
    this.router.navigate(['/listar-vehiculo']);
  }
  navigateCitas() {
    this.router.navigate(['/calendario']);
  }
  navigateHistorial() {
    this.router.navigate(['/historial']);
  }
}