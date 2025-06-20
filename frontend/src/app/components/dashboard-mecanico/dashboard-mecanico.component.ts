import { Component, OnInit } from '@angular/core';
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
import { ScaleType, Color } from '@swimlane/ngx-charts';
import Swal from 'sweetalert2';

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
  // define colorScheme como un Color válido:
  colorScheme: Color = {
    name: 'estadosCitas',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: [
      '#2ecc71', // Confirmada
      '#e67e22', // En Proceso
      '#9b59b6', // Diagnosticado
      '#3498db', // Atendida
      '#e74c3c'  // Cancelada
    ]
  };

  // Decláralo como propiedad de la clase:
 readonly ESTADOS = [
    'Confirmada',
    'En Proceso',
    'Diagnosticado',
    'Atendida',
    'Cancelada'
  ];

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
  citasChartData: { name: string; value: number }[] = [];

  // Filtros
  filtroCitas: string = ''; // Filtro para citas
  filtroTrabajos: string = ''; // Filtro para trabajos

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

  // Para el selector de año
  availableYears: number[] = [];
  selectedYear!: number;

  citasPorDiaData: { name: string; series: { name: string; value: number }[] }[] = [];
  citasPorMesData: { name: string; series: { name: string; value: number }[] }[] = [];
  citasPorMesStacked: { name: string; series: { name: string; value: number }[] }[] = [];

  private allCitas: any[] = [];

  private agruparCitas(): void {
    const year = this.fechaActual.getFullYear();

    // 1) Genera array de todos los meses del año { id: '2025-01', label: 'Ene' }
    const meses = Array.from({ length: 12 }, (_, i) => {
      const mesNum = i + 1;
      const id = `${year}-${mesNum.toString().padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('es-ES', { month: 'short' })
        .format(new Date(year, i, 1));
      return { id, label };
    });

    // 2) Construye el stacked series, usando label para el eje X
    this.citasPorMesStacked = meses.map(({ id, label }) => ({
      name: label,    // p. ej. "ene", "feb", …
      series: this.ESTADOS.map(estado => ({
        name: estado, 
        value: this.citas.filter(c => {
          const val = typeof c.estado === 'string'
            ? c.estado
            : c.estado?.nombre_estado;
          return val === estado && c.fecha.startsWith(id);
        }).length
      }))
    }));
  }

  // Funciones de navegación del menú
  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';

    this.citasService.listarCitasMecanico().subscribe(citas => {
      this.allCitas = citas;

      // 1) Extrae años únicos de tus datos:
      const years = Array.from(
        new Set(citas.map(c => +c.fecha.slice(0,4)))
      ).sort((a,b) => a - b);
      this.availableYears = years;

      // 2) Setea el año seleccionado por defecto:
      this.selectedYear = new Date().getFullYear();
      if (!years.includes(this.selectedYear)) {
        // si no hay datos del año en curso, toma el primero disponible
        this.selectedYear = years[0];
      }

      // 3) Genera el chart mensual
      this.updateMonthlyChart();
    });

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
    
    this.citasService.listarCitasMecanico().subscribe(citas => {
      this.citasChartData = this.ESTADOS.map(estado => ({
        name: estado,
        value: citas.filter(c => {
          const valor = typeof c.estado === 'string'
            ? c.estado
            : c.estado?.nombre_estado;
          return valor === estado;
        }).length
      })).filter(d => d.value > 0);
    });
    
    this.iniciarReloj();
  
    // Cargar datos simultáneamente
    forkJoin({
      citas:   this.citasService.listarCitasMecanico(),
      ordenes: this.ordenSvc.listar()
    })
    .subscribe(({ citas, ordenes }) => {
      this.citas   = citas;
      this.ordenes = ordenes;     
      this.totalCitas   = citas.length;
      this.totalTrabajos = ordenes.length;      
      this.agruparCitas();
      this.actualizarDistribucionEstados();
    });
  }

  updateMonthlyChart(): void {
    // Genera los 12 meses del año seleccionado:
    const meses = Array.from({length:12}, (_, i) => {
      const m = i + 1;
      const id = `${this.selectedYear}-${m.toString().padStart(2,'0')}`;
      const label = new Intl.DateTimeFormat('es-ES',{month:'short'})
                    .format(new Date(this.selectedYear, i, 1));
      return { id, label };
    });

    // Reconstruye el stacked series
    this.citasPorMesStacked = meses.map(({id,label}) => ({
      name: label, 
      series: this.ESTADOS.map(estado => ({
        name: estado,
        value: this.allCitas
          .filter(c => {
            const estadoName = typeof c.estado==='string'
              ? c.estado
              : c.estado?.nombre_estado;
            return estadoName === estado && c.fecha.startsWith(id);
          })
          .length
      }))
    }));
  }

  private actualizarDistribucionEstados(): void {
    this.citasChartData = this.ESTADOS.map(estado => ({
      name: estado,
      value: this.citas.filter(c => {
        const valor = typeof c.estado === 'string'
          ? c.estado
          : c.estado?.nombre_estado;
        return valor === estado;
      }).length
    }));
  }

  // formato para las etiquetas de la tarta
  formatLabel(data: { name: string; value: number }): string {
    const total = this.citasChartData.reduce((sum, d) => sum + d.value, 0);
    const percent = total ? Math.round(100 * data.value / total) : 0;
    return `${data.name}: ${data.value} (${percent}%)`;
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
    });
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
