import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NotificacionesService } from '../../services/Notificaciones/notificaciones.service';
import { CitaMecanicoService } from '../../services/CitaMecanico/cita-mecanico.service';
import { OrdenService, Orden } from '../../services/Orden/orden.service';
import { IgxCardModule, IgxButtonModule, IgxRippleModule, IgxIconModule } from 'igniteui-angular';
import { forkJoin } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatCardModule } from '@angular/material/card';
import Swal from 'sweetalert2';

// 1) Definimos el tipo de estados y el mapeo a etiquetas legibles
type EstadoOrden = 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';

const estados: EstadoOrden[] = [
  'pendiente',
  'en_proceso',
  'completado',
  'cancelado'
];

const etiquetas: Record<EstadoOrden, string> = {
  pendiente:  'Pendiente',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado:  'Cancelado'
};

@Component({
    selector: 'app-dashboard-mecanico',
    imports: [
      CommonModule, 
      MatTreeModule, 
      NgxChartsModule, 
      FormsModule, 
      MatCardModule,
      IgxCardModule,
      IgxButtonModule,
      MatIconModule,
      IgxRippleModule, 
      IgxIconModule, 
      MatButtonModule, 
      MatProgressBarModule
    ],
    standalone: true,
    templateUrl: './dashboard-mecanico.component.html',
    styleUrls: ['./dashboard-mecanico.component.css']
})
export class DashboardMecanicoComponent {
  
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];


  fechaActual = new Date();
  totalCitas = 0;
  totalTrabajos = 0;

  // Datos para gráficos
  citas: any[] = []; // Lista de citas del mecánico
  ordenes: Orden[] = [];
  ordenesChartData: { name: string; value: number }[] = [];
  
  // Datos para gráficos
  citasChartData: any[] = [];
  trabajosChartData: any[] = [];
  trabajosSemanaData: any[] = [];

  // Filtros
  filtroCitas: string = ''; // Filtro para citas
  filtroTrabajos: string = ''; // Filtro para trabajos

  // Listas filtradas
  citasHoyFiltradas: any[] = [];
  trabajosHoyFiltradas: any[] = [];

  // Variables de usuario
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  tiempoRestante: string = '';

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;

  constructor(private authService: AuthService, private ordenSvc: OrdenService, private citasService: CitaMecanicoService, private router: Router, private notificacionesService: NotificacionesService, private http: HttpClient) {
    registerLocaleData(localeEs, 'es');
  }

  // Funciones de navegación del menú
  ngOnInit(): void {
    this.roles = JSON.parse(sessionStorage.getItem('roles') ?? '[]');
    this.rolActivo = sessionStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';

    this.notificacionesService.subscribeToNotifications(
      `notificaciones-mecanico-${user.mecanicoId}`,
      (message: string, cliente: { nombre: string; apellido: string } | undefined) => {
        const clienteNombre = cliente 
          ? `${cliente.nombre} ${cliente.apellido}` 
          : 'No disponible';
    
        Swal.fire({
          title: '<h2 style="font-family: Poppins, sans-serif; color: #1e8449; margin-bottom: 20px;">¡Nueva Notificación!</h2>',
          html: `
            <div style="font-family: 'Poppins', sans-serif; text-align: left; padding: 10px; border-radius: 10px; background-color: #f9f9f9; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <p style="font-size: 18px; color: #34495e; margin-bottom: 10px;">
                <strong style="color: #27ae60;">Mensaje:</strong> ${message}
              </p>
              <p style="font-size: 18px; color: #34495e; margin-bottom: 10px;">
                <strong style="color: #3498db;">Cliente:</strong> ${clienteNombre}
              </p>
            </div>
          `,
          icon: 'info',
          confirmButtonText: `
            <span style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">
              Aceptar
            </span>
          `,
          confirmButtonColor: '#2ecc71',
        });
      }
    );          
    
    this.iniciarReloj();
  
    // Cargar datos simultáneamente
    forkJoin({
      citas:   this.citasService.listarCitasMecanico(),
      ordenes: this.ordenSvc.listar()
    })
    .subscribe(({ citas, ordenes }) => {
      this.citas   = citas;
      this.ordenes = ordenes;             
      this.actualizarGraficosCitas();
      this.generarOrdenesChart();          
    });
  }

  private generarOrdenesChart() {
    this.ordenesChartData = estados.map(est => ({
      name: etiquetas[est],
      value: this.ordenes.filter(o => {
        // 1) Si está cancelada según el estado de la cita
        if (est === 'cancelado') {
          return o.cita?.estado?.toLowerCase() === 'cancelada';
        }

        // 2) Recogemos todos los progresos
        const progresos = o.detalles_servicios.map(d => d.progreso);

        // 3) Pendiente = todos a 0
        if (est === 'pendiente') {
          return progresos.every(p => p === 0);
        }
        // 4) Completado = todos a 100
        if (est === 'completado') {
          return progresos.every(p => p === 100);
        }
        // 5) Resto es en_proceso (al menos uno entre 1 y 99)
        return progresos.some(p => p > 0 && p < 100);
      }).length
    }));
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

  cargarCitas(): void {
    this.citasService.listarCitasMecanico().subscribe((data) => {
      this.citas = data; // Asignar las citas originales
      this.actualizarGraficosCitas(); // Actualiza los gráficos si es necesario
    });
  }  

  actualizarGraficosCitas(): void {
    const estados = ['Diagnosticado', 'Confirmada', 'Cancelada', 'Atendida'];
    this.citasChartData = estados.map((estado) => ({
      name: estado,
      value: this.citas.filter((cita) => cita.estado.toLowerCase() === estado.toLowerCase()).length,
    }));
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
    if (menu === 'trabajos') {
      this.showTiposnMenu = !this.showTiposnMenu;
    } else if (menu === 'citas') {
      this.showCitasMenu = !this.showCitasMenu;
    } else if (menu === 'configuracion') {
      this.showConfiguracionMenu = !this.showConfiguracionMenu;
    }
  }

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
  }
  
  // Funciones de navegación
  navigateDashboard(): void {
    this.router.navigate(['/dashboard-mecanico']);
  }
  navigateCitasMecanico(): void {
    this.router.navigate(['/cita-mecanico']);
  }
  navigateTrabajos(): void {
    this.router.navigate(['/trabajo-mecanico']);
  }
  navigateDiagnostico(): void {
    this.router.navigate(['/diagnostico']);
  }
}
