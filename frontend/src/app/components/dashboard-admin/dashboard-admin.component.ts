import { Component, OnInit, AfterViewInit, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { ApexChart, ApexXAxis, ApexYAxis, ApexAxisChartSeries, ApexDataLabels, ApexStroke, ApexGrid, ApexFill, ApexLegend, ApexTooltip, ApexPlotOptions } from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatTreeModule } from '@angular/material/tree';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AdministradorService } from '../../services/Administrador/administrador.service';
import { MatSelectModule } from '@angular/material/select';

@Component({
    selector: 'app-dashboard-admin',
    standalone: true,
    templateUrl: './dashboard-admin.component.html',
    styleUrls: ['./dashboard-admin.component.css'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [CommonModule, NgApexchartsModule, FormsModule, MatTreeModule, MatSelectModule, MatIconModule, MatButtonModule, MatProgressBarModule]
})
export class DashboardAdminComponent implements OnInit {

  filtros: any = {
    anio: '',
    mes: '',
  };

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  // Añade estas variables al componente
  filtrosCitas: any = { anio: '', mes: '' };
  filtrosMecanicos: any = { anio: '', mes: '' };
  filtrosClientes: any = { anio: '', mes: '' };
  filtrosIngresos: any = { anio: '', mes: '' };

  anios: number[] = [];
  meses = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  tiempoRestante: string = '';

  // Variables de usuario
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  totalCitas: number = 0;
  totalMecanicos: number = 0;
  totalClientes: number = 0;
  dineroTotal: number = 0;

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;

  chartOptions: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 620,
    },
    xaxis: {
      categories: [],
    },
  };

  constructor(private authService: AuthService, private admin:AdministradorService, private router: Router, private http: HttpClient) {
    // Escuchar eventos de navegación para redibujar el gráfico
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.redrawChart();
      }
    });
  }

  // Funciones de navegación del menú
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

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario en localStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    // Generar rango de años (últimos 10 años)
    const currentYear = new Date().getFullYear();
    this.anios = Array.from({ length: 10 }, (_, i) => currentYear - i);
  
    this.loadDashboardStats();
    this.loadChartData();
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

  descargarCitasPDF(): void {
    this.admin.descargarReporteCitas(this.filtrosCitas);
  }
  
  descargarMecanicosPDF(): void {
    this.admin.descargarReporteTrabajos(this.filtrosMecanicos);
  }
  
  descargarClientesPDF(): void {
    this.admin.descargarReporteClientes(this.filtrosClientes);
  }
  
  descargarFinancieroPDF(): void {
    this.admin.descargarReporteFinanciero(this.filtrosIngresos);
  }  

  ngAfterViewInit(): void {
    setTimeout(() => this.redrawChart(), 100);
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.redrawChart();
  }

  redrawChart(): void {
    const chartElement = document.querySelector('apx-chart') as any;
    if (chartElement?.chartObj) {
      chartElement.chartObj.updateOptions(this.chartOptions);
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

  // Función para cargar los datos del dashboard
  loadDashboardStats(): void {
    this.authService.getAdminDashboardStats().subscribe(
      (data) => {
        this.totalCitas = data.totalCitas; // Total de citas confirmadas
        this.totalMecanicos = data.totalMecanicos; // Total de mecánicos
        this.totalClientes = data.totalClientes; // Total de clientes
        this.dineroTotal = data.dineroTotal; // Total de dinero generado de citas atendidas
      },
      (error) => {
        console.error('Error al cargar estadísticas del dashboard:', error);
      }
    );
  }    

  loadChartData(): void {
    this.authService.getCitasYClientesPorMes().subscribe(
      (data) => {
        // Crear un mapa para evitar duplicados y asegurar el correcto manejo por categorías
        const categoriasMap = new Map<string, { citas: number; clientes: number }>();
  
        // Procesar datos de citas
        data.citas.forEach((cita: any) => {
          const etiqueta = `${this.obtenerMes(cita.mes)} ${cita.anio}`;
          if (!categoriasMap.has(etiqueta)) {
            categoriasMap.set(etiqueta, { citas: cita.total_citas, clientes: 0 });
          } else {
            const valorActual = categoriasMap.get(etiqueta)!;
            categoriasMap.set(etiqueta, {
              citas: valorActual.citas + cita.total_citas,
              clientes: valorActual.clientes,
            });
          }
        });
  
        // Procesar datos de clientes
        data.clientes.forEach((cliente: any) => {
          const etiqueta = `${this.obtenerMes(cliente.mes)} ${cliente.anio}`;
          if (!categoriasMap.has(etiqueta)) {
            categoriasMap.set(etiqueta, { citas: 0, clientes: cliente.total_clientes });
          } else {
            const valorActual = categoriasMap.get(etiqueta)!;
            categoriasMap.set(etiqueta, {
              citas: valorActual.citas,
              clientes: valorActual.clientes + cliente.total_clientes,
            });
          }
        });
  
        // Ordenar las categorías por año y mes
        const categoriasOrdenadas = Array.from(categoriasMap.entries()).sort(
          ([etiquetaA], [etiquetaB]) => {
            const [mesA, anioA] = etiquetaA.split(' ');
            const [mesB, anioB] = etiquetaB.split(' ');
            return (
              Number(anioA) - Number(anioB) ||
              this.ordenMes(mesA) - this.ordenMes(mesB)
            );
          }
        );
  
        // Configurar los datos para el gráfico
        const categorias = categoriasOrdenadas.map(([etiqueta]) => etiqueta);
        const citasPorMes = categoriasOrdenadas.map(([, datos]) => datos.citas);
        const clientesPorMes = categoriasOrdenadas.map(([, datos]) => datos.clientes);
  
        // Actualizar opciones del gráfico
        this.chartOptions = {
          ...this.chartOptions,
          series: [
            {
              name: 'Citas Atendidas',
              data: citasPorMes,
            },
            {
              name: 'Total de Clientes',
              data: clientesPorMes,
            },
          ],
          xaxis: {
            categories: categorias,
          },
        };
      },
      (error) => {
        console.error('Error al cargar los datos del gráfico:', error);
      }
    );
  }
  
  private obtenerMes(mes: number): string {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return meses[mes - 1];
  }
  
  private ordenMes(mes: string): number {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return meses.indexOf(mes);
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
}