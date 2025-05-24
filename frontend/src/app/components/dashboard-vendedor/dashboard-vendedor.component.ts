import { Component, OnInit, AfterViewInit, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AlertListDialogComponent } from '../alert-list-dialog/alert-list-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTreeModule } from '@angular/material/tree';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdministradorService } from '../../services/Administrador/administrador.service';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule }     from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule }      from '@angular/material/sort';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexStroke, ApexDataLabels, ApexMarkers, ApexGrid, ApexTooltip } from 'ng-apexcharts';
import { RepuestoService, Repuesto } from '../../services/Repuesto/repuesto.service';

export interface AlertDialogData {
  repuestos: { nombre: string }[];
}

@Component({
  selector: 'app-dashboard-vendedor',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, NgApexchartsModule, FormsModule, MatDialogModule, MatListModule, MatTableModule, MatTooltipModule, MatPaginatorModule, MatSortModule, MatTreeModule, MatSelectModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './dashboard-vendedor.component.html',
  styleUrls: ['./dashboard-vendedor.component.css']
})
export class DashboardVendedorComponent {

  totalRepuestos = 0;
  lowStockRepuestos: Repuesto[] = []; // Ya lo tienes
  lowStockCount = 0;
  showAlertList = false;
  selectedAlerts: string[] = [];   // opcional: guarda los nombres seleccionados
  totalInventoryValue = 0;      // <-- nueva métrica

  alertNames = '';

  filtros: any = {
    anio: '',
    mes: '',
  };

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  // Añade estas variables al componente

  tiempoRestante: string = '';

  // Variables de usuario
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  // Métricas
  totalStock = 0;
  addedToday = 0;

  // Chart
  stockChartData: any[] = [{ data: [], label: 'Stock total' }];
  stockChartLabels: string[] = [];

  // Control de submenús
  showRepuestosMenu: boolean = false;

  chartOptions!: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    dataLabels: ApexDataLabels;
    grid: ApexGrid;
    tooltip: ApexTooltip;
  };

  constructor(private authService: AuthService, private dialog: MatDialog, private repService: RepuestoService, private admin:AdministradorService, private router: Router, private http: HttpClient) {}

  openAlertModal() {
    this.dialog.open(AlertListDialogComponent, {
      width:  '600px',
      data:   { repuestos: this.lowStockRepuestos }
    });
  }

  // Funciones de navegación del menú
  navigateCrearRepuestos() {
    this.router.navigate(['/crear-repuestos']);
  }
  navigateListarRepuestos() {
    this.router.navigate(['/listar-repuestos']);
  }

  ngOnInit(): void {
    this.roles     = this.authService.getRoles();
    this.rolActivo = sessionStorage.getItem('rol_activo') || '';

     const user = this.authService.getUser();
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    // Generar rango de años (últimos 10 años)
  
    this.iniciarReloj();
    this.cargarMetricas();
    this.setupBarChart();
  }

  // Métricas de inventario
  cargarMetricas(): void {
    this.repService.getAll().subscribe(list => {
      this.lowStockRepuestos = list.filter(r => r.stock <= r.stock_minimo);
      this.lowStockCount     = this.lowStockRepuestos.length;
      this.totalRepuestos = list.length;
      this.totalStock = list.reduce((s, r) => s + r.stock, 0);
      this.lowStockCount = list.filter(r => r.stock <= r.stock_minimo).length;
      this.addedToday = list.filter(r => r.created_at?.startsWith(new Date().toISOString().split('T')[0])).length;
      this.lowStockRepuestos = list.filter(r => r.stock <= r.stock_minimo);
      this.selectedAlerts = this.lowStockRepuestos.map(r => r.nombre);
      this.totalInventoryValue = list
        .reduce((sum, r) => sum + (r.precio_final ?? 0) * r.stock, 0);
    });
  }

  private setupBarChart() {
    // 1. Etiquetas de los últimos 12 meses
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      map[label] = 0;
    }

    // 2. Al cargar todos los repuestos, agrupa por mes de creación
    this.repService.getAll().subscribe(list => {
      list.forEach(r => {
        if (!r.created_at) return;
        const created = new Date(r.created_at);
        const key = created.toLocaleString('default', { month: 'short', year: 'numeric' });
        if (map[key] !== undefined) {
          // Suma el stock de cada repuesto creado en ese mes
          map[key] += r.stock;
        }
      });

      // 3. Asigna a chartOptions
      this.chartOptions = {
        series: [{ name: 'Stock agregado', data: Object.values(map) }],
        chart:  { type: 'bar', height: 530 },
        xaxis:  { categories: Object.keys(map) },
        dataLabels: { enabled: false },
        grid: { padding: { top: 0, bottom: 0 } },
        tooltip: { enabled: true }
      };
    });
  }

  // dashboard-vendedor-repuestos.component.ts
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
    if (menu === 'repuestos') {
      this.showRepuestosMenu = !this.showRepuestosMenu;
    }
  }

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showRepuestosMenu = false;
  }
}
