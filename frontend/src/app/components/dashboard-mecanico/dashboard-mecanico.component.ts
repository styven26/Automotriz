import { Component, OnInit, HostListener } from '@angular/core';
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
import { CitaMecanicoService } from '../../services/CitaMecanico/cita-mecanico.service';
import { OrdenService, Orden } from '../../services/Orden/orden.service';
import { IgxCardModule, IgxButtonModule, IgxRippleModule, IgxIconModule } from 'igniteui-angular';
import { forkJoin, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { MatCardModule } from '@angular/material/card';
import { ScaleType, Color, LegendPosition } from '@swimlane/ngx-charts';

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
  // ancho x alto del chart
  view: [number,number] = [0,0];

  readonly LegendPosition = LegendPosition;

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
  sidebarActive: boolean = false;
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

  constructor(private authService: AuthService, private ordenSvc: OrdenService, private citasService: CitaMecanicoService, private router: Router, private http: HttpClient) {
    registerLocaleData(localeEs, 'es');
  }

  // Para el selector de año
  availableYears: number[] = [];
  selectedYear!: number;

  citasPorDiaData: { name: string; series: { name: string; value: number }[] }[] = [];
  citasPorMesData: { name: string; series: { name: string; value: number }[] }[] = [];
  citasPorMesStacked: { name: string; series: { name: string; value: number }[] }[] = [];

  private allCitas: any[] = [];

  // Funciones de navegación del menú
  ngOnInit(): void {
    // cargar usuario y roles
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    this.nombreUsuario = u.nombre || '';
    this.apellidoUsuario = u.apellido || '';

    // iniciar reloj
    this.iniciarReloj();

    // cargar solo años y datos iniciales para el gráfico mensual
    this.citasService.listarCitasMecanico().subscribe(citas => {
      this.allCitas = citas;
      this.citas    = citas;                 // ← asigna aquí para el pie-chart
      this.totalCitas = citas.length;        // ← si lo quieres en tu KPI

      // años para el stacked
      const years = Array.from(
        new Set(citas.map(c => +c.fecha.slice(0,4)))
      ).sort((a,b) => a-b);
      this.availableYears = years;
      const current = new Date().getFullYear();
      this.selectedYear = years.includes(current) ? current : (years[0]||current);

      this.updateMonthlyChart();            // stacked mensual
      this.actualizarDistribucionEstados(); // pie-chart de estados
    });

    // polling cada 30s para refrescar todo
    timer(0, 10000).pipe(
      switchMap(() => forkJoin({
        citas:   this.citasService.listarCitasMecanico(),
        ordenes: this.ordenSvc.listar()
      }))
    ).subscribe(({ citas, ordenes }) => {
      this.citas    = citas;
      this.ordenes  = ordenes;
      this.allCitas = citas;
      this.totalCitas   = citas.length;
      this.totalTrabajos = ordenes.length;
      this.actualizarDistribucionEstados();
      this.updateMonthlyChart();
      this.calculateView();
    }, err => console.error(err));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculateView();
  }

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

  descargarReporte(): void {
    this.ordenSvc.descargarReporte();
  }

  private calculateView() {
    const width  = Math.floor((window.innerWidth - 250) * 1.38);  // 250 = ancho del sidebar
    const height = 600;                                          // <-- altura fija
    this.view = [ width, height ];
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
