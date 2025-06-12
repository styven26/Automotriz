import { Component, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { RouterModule } from '@angular/router'; // Importar RouterModule para usar rutas
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import { SubtipoService } from '../../services/Subtiposervicios/subtipo.service';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon'; 
import { DiagnosticoService } from '../../services/Diagnostico/diagnostico.service';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-diagnostico',
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
  templateUrl: './diagnostico.component.html',
  styleUrls: ['./diagnostico.component.css']
})
export class DiagnosticoComponent {

  displayedColumns: string[] = [
    'cliente',
    'auto',
    'servicio',
    'problemas',
    'recomendados',
    'acciones'
  ];
  dataSource!: MatTableDataSource<any>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Variables de control
  fechaActual = new Date();
  totalCitas = 0;
  totalTrabajos = 0;

  // Datos para gráficos
  citas: any[] = []; // Lista de citas del mecánico
  trabajos: any[] = []; // Lista de trabajos del mecánico
  
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

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

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

  constructor(private authService: AuthService, public dialog: MatDialog, private subtipoService:SubtipoService, private diagnosticoService: DiagnosticoService, private router: Router, private http: HttpClient) {}

  // 1) En tu DiagnosticoComponent, define una variable para guardar todos los subtipos
  servicios: { id: number; nombre: string }[] = [];
  serviciosMap: { [key:number]:string } = {};

  // Funciones de navegación del menú
  ngOnInit(): void {

    this.roles = JSON.parse(sessionStorage.getItem('roles') ?? '[]');
    this.rolActivo = sessionStorage.getItem('rol_activo') ?? '';

    // 1. Primero obtén todos los subtipos y guárdalos en `subtipos` y `subtiposMap`
    this.subtipoService.obtenerSubtiposServicios()
    .subscribe((resp: any[]) => {
      // resp es realmente un array de Servicio { id_servicio, id_tipo, nombre, … }
      this.servicios = resp
        // opcional: filtra aquí el servicio “Diagnóstico” si no quieres mostrarlo
        .filter(s => s.nombre.toLowerCase() !== 'diagnóstico')
        // y lo mapeas a {id,nombre}
        .map(s => ({ id: s.id_servicio, nombre: s.nombre }));

      // creas el mapa id→nombre
      this.serviciosMap = this.servicios
        .reduce((m, s) => ({ ...m, [s.id]: s.nombre }), {});

      // YA puedes cargar los diagnósticos
      this.cargarDiagnosticos();
    });

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';         
    
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

  cargarDiagnosticos() {
  this.diagnosticoService.listarDiagnosticos().subscribe({
    next: (resp) => {
      resp.forEach((diag: any) => {
        // 1) FORZAMOS a que _siempre_ sea un array de números:
        let arr = diag.servicios_recomendados;
        if (typeof arr === 'string') {
          try {
            arr = JSON.parse(arr);
          } catch {
            arr = [];
          }
        }
        if (!Array.isArray(arr)) {
          arr = [];
        }
        // 2) deduplicamos y convertimos a entero:
        arr = Array.from(new Set(arr.map((x: any) => +x)));
        diag.servicios_recomendados = arr;

        // 3) ahora montamos los nombres
        diag.servicios_recomendados_nombres = diag.servicios_recomendados
          .map((id: number) => this.serviciosMap[id] || 'Desconocido');
      });

      console.log('🔍 Diagnósticos tras normalizar:', resp);
      this.dataSource = new MatTableDataSource(resp);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    },
    error: (err) => console.error('Error al listar diagnósticos', err)
  });
}


  filterValue: string = '';

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (this.dataSource) {
      this.dataSource.filter = filterValue;
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
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

  openUpdateDialog(diag: any): void {
    // 1) IDs actuales
    const actuales: number[] = diag.servicios_recomendados;

    // 2) HTML de los checkboxes sin checked
    const optionsHtml = this.servicios.map(s => `
      <div style="margin-bottom:8px;">
        <input
          type="checkbox"
          id="serv-${s.id}"
          value="${s.id}"
          style="margin-right:6px;"
        />
        <label for="serv-${s.id}"
          style="font-family:'Poppins',sans-serif;font-size:16px;"
        >${s.nombre}</label>
      </div>
    `).join('');

    Swal.fire({
      title: ` <h3 style="
          font-family:Roboto,sans-serif;
          font-size:30px;
          font-weight:bold;
          text-align:center;
        ">
          <strong>Actualizar Diagnóstico</strong>
        </h3> `,
      html: `
        <div style="margin-bottom:10px;text-align:center;">
          <textarea
            id="descripcion"
            placeholder="Describa el problema encontrado"
            style="
              width:90%;
              height:100px;
              font-family:'Poppins',sans-serif;
              font-size:15px;
              padding:8px;
              border:1px solid #ccc;
              border-radius:5px;
              resize:none;
              box-sizing:border-box;
            ">${diag.descripcion || ''}</textarea>
        </div>
        <br />
        <div style="
          text-align:center;
          font-family:'Poppins',sans-serif;
          font-weight:bold;
          font-size:16px;
          margin-bottom:5px;
        ">
          Servicios Recomendados
        </div>
        <br />
        <div style="text-align:left;padding:0 20px;">
          ${optionsHtml}
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      didOpen: () => {
        const popup = Swal.getPopup()!;
        actuales.forEach(id => {
          const cb = popup.querySelector<HTMLInputElement>(`#serv-${id}`);
          if (cb) cb.checked = true;
        });
      },
      preConfirm: () => {
        const popup = Swal.getPopup()!;
        const descripcion = (popup.querySelector<HTMLTextAreaElement>('#descripcion')!).value.trim();
        if (!descripcion) {
          Swal.showValidationMessage('La descripción no puede estar vacía');
          return;
        }
        const seleccionados = Array.from(
          popup.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked')
        );
        return {
          descripcion,
          serviciosRecomendados: seleccionados.map(cb => +cb.value)
        };
      }
    }).then(result => {
      if (!result.isConfirmed) return;
      const { descripcion, serviciosRecomendados } = result.value!;
      this.diagnosticoService
        .updateDiagnostico(diag.id_orden, descripcion, serviciosRecomendados)
        .subscribe({
          next: () => {
            Swal.fire('Éxito', 'Diagnóstico actualizado.', 'success');
            this.cargarDiagnosticos();
          },
          error: err => {
            console.error(err);
            Swal.fire('Error', 'No se pudo actualizar el diagnóstico.', 'error');
          }
        });
    });
  }
  
  updateDiagnostico(diagnosticoId: number, descripcion: string, serviciosRecomendados: any[]) {
    this.diagnosticoService.updateDiagnostico(diagnosticoId, descripcion, serviciosRecomendados)
      .subscribe({
        next: (resp) => {
          Swal.fire('Éxito', 'Diagnóstico actualizado.', 'success');
          // Vuelve a cargar la tabla
          this.cargarDiagnosticos();
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo actualizar el diagnóstico.', 'error');
          console.error(err);
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

  /**
   * Método para enviar correo cuando NO hay servicios recomendados
   */
  sendEmailNoServices(idOrden: number): void {
    Swal.fire({
      title: 'Notificar al Cliente',
      text: 'No se han seleccionado servicios recomendados. ¿Desea enviar un correo informando que la mecánica no cuenta con esos servicios?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Enviar Notificación',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;

      // Usar id_orden en lugar de id
      this.diagnosticoService.enviarCorreoSinServicios(idOrden).subscribe({
        next: () => {
          Swal.fire({
            title: 'Correo enviado',
            text: 'Se ha notificado al cliente que la mecánica no cuenta con esos servicios.',
            icon: 'success',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              confirmButton: 'custom-swal-confirm-button'
            }
          });
        },
        error: err => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo enviar el correo.',
            icon: 'error',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              confirmButton: 'custom-swal-confirm-button'
            }
          });
        }
      });
    });
  }

  /**
   * Método para enviar correo cuando SÍ hay servicios recomendados
   */
  sendEmailRecommended(diagnostic: any): void {
    const servicios = diagnostic.servicios_recomendados_nombres?.join(', ') ?? 'Ninguno';

    Swal.fire({
      title: 'Confirmar Servicios Recomendados',
      html: `
        <style>
          .custom-swal-popup {
            border-radius: 10px;
            padding: 20px;
            font-family: Arial, sans-serif;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }
          .custom-swal-title {
            font-size: 1.5em;
            color: #333;
            margin-bottom: 10px;
          }
          .custom-swal-content {
            font-size: 1em;
            color: #555;
          }
          .custom-swal-confirm-button {
            background-color: #28a745 !important;
            color: #fff !important;
            border: none;
            border-radius: 5px;
            padding: 8px 16px;
            font-size: 1em;
            margin: 5px;
          }
          .custom-swal-cancel-button {
            background-color: #dc3545 !important;
            color: #fff !important;
            border: none;
            border-radius: 5px;
            padding: 8px 16px;
            font-size: 1em;
            margin: 5px;
          }
        </style>
        <p>Los servicios recomendados son: <strong>${servicios}</strong></p>
        <p>¿Desea enviar un correo al cliente confirmando estos servicios?</p>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Enviar Correo',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'custom-swal-popup',
        title: 'custom-swal-title',
        confirmButton: 'custom-swal-confirm-button',
        cancelButton: 'custom-swal-cancel-button'
      }
    }).then(result => {
      if (!result.isConfirmed) return;

      // Nuevamente usamos id_orden
      this.diagnosticoService.enviarCorreoServiciosRecomendados(diagnostic.id_orden).subscribe({
        next: () => {
          Swal.fire({
            title: 'Correo enviado',
            text: 'Se ha enviado el correo al cliente con los servicios recomendados.',
            icon: 'success',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              confirmButton: 'custom-swal-confirm-button'
            }
          });
          // Opcional: actualizar fila o eliminarla localmente
          this.dataSource.data = this.dataSource.data.filter(
            (d: any) => d.id_orden !== diagnostic.id_orden
          );
        },
        error: err => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo enviar el correo.',
            icon: 'error',
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              confirmButton: 'custom-swal-confirm-button'
            }
          });
        }
      });
    });
  }    
}
