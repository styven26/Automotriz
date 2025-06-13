import { AfterViewInit, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CitaadminService } from '../../../services/CitaAdmin/citaadmin.service';
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // FormsModule y ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { AuthService } from '../../../services/auth.service';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    FullCalendarModule,
    MatSelectModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './citas-admin.component.html',
  styleUrls: ['./citas-admin.component.css']
})
export class CitasAdminComponent {

  constructor(private authService: AuthService, private router: Router, private citadmin: CitaadminService ) {}

  tiempoRestante: string = '';
  calendarOptions: any;

  // Variables de usuario
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario en localStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    this.calendarOptions = {
      plugins: [ dayGridPlugin, timeGridPlugin, interactionPlugin ],
      initialView: 'dayGridMonth',
      locale: esLocale,
      headerToolbar: {
        left:   'prev,next today',
        center: 'title',
        right:  'dayGridMonth,timeGridWeek,timeGridDay'
      },
      displayEventTime: true,
      eventTimeFormat: {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false      // si prefieres 24h; pon true para AM/PM
      },
      height:            'auto',
      contentHeight:     'auto',
      expandRows:        true,
      handleWindowResize:true,
      aspectRatio:       1.8,
      events:            [], 
      eventClick:        this.mostrarDetallesCita.bind(this)
    };

    this.cargarCitasGlobal();
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

  cargarCitasGlobal(): void {
    this.citadmin.listarCitasGlobal().subscribe(
      (citas: any[]) => {
        this.calendarOptions.events = citas.map(cita => {
          // Sacamos la orden y sus detalles
          const orden = cita.ordenServicio;
          const detalles: any[] = orden?.detalles_servicios ?? [];

          return {
            id: cita.id_cita, // o cita.id según tu JSON
            title: `Mecánico: ${cita.mecanico?.nombre || 'No asignado'} | Vehículo: ${cita.vehiculo?.marca || 'No definido'}`,
            start: `${cita.fecha}T${cita.hora}`,
            end: `${cita.fecha}T${cita.hora_fin}`,
           className: 
           cita.estado === 'En Proceso'
              ? 'fc-event-purple'
              :cita.estado === 'Diagnosticado'
                ? 'fc-event-orange'
                : cita.estado === 'Atendida'
                  ? 'fc-event-blue'
                  : cita.estado === 'Confirmada'
                    ? 'fc-event-green'
                    : 'fc-event-red',
            extendedProps: {
              vehiculo: cita.vehiculo,
              clienteNombre: cita.cliente?.nombre,
              clienteApellido: cita.cliente?.apellido,
              mecanicoNombre: cita.mecanico?.nombre,
              servicios: detalles,    // aquí van los detalles de servicio
              estado: cita.estado,
              ordenId: orden?.id_orden,
            }
          };
        });
      },
      err => console.error('Error al cargar citas globales:', err)
    );
  }

 mostrarDetallesCita(event: any): void {
    const cita = event.event;
    const props = cita.extendedProps;

    // 1) Vehículo
    const vehiculo = props.vehiculo
      ? `${props.vehiculo.marca || 'Marca no definida'} ${props.vehiculo.modelo || 'Modelo no definido'}`
      : 'Vehículo no definido';

    // 2) Cliente
    const clienteNombre   = props.clienteNombre || 'Sin nombre';
    const clienteApellido = props.clienteApellido || '';

    // 3) Mecánico
    const mecanico = props.mecanicoNombre || 'Sin asignar';

    // 4) Estado
    const estado = props.estado || 'Estado no definido';

    // 5) Horarios
    const horaInicio = cita.start.toLocaleString();
    const horaFin    = cita.end?.toLocaleString() ?? 'No definida';

    // 6) Servicios (antes “subtipos”)
    const servicios = props.servicios as any[] || [];
    const serviciosHtml = servicios.length
      ? servicios.map(detalle => {
          // detalle.servicio contiene el modelo Servicio con nombre, precio, etc.
          const nombre = detalle.servicio?.nombre || 'Servicio sin nombre';
          return `
            <div style="
              margin-bottom: 8px;
              display: flex; justify-content: center; align-items: center;
              text-align: center;
            ">
              🔧 ${nombre}
            </div>
          `;
        }).join('')
      : '<div>No hay servicios asociados</div>';

    // 7) Lanzar el modal
    Swal.fire({
      title: '<h5>📅 DETALLES DE LA RESERVA</h5>',
      html: `
        <div style="font-family: Poppins, sans-serif; text-align: center; line-height: 1.5;">
          <p><strong>🙍 Cliente:</strong> ${clienteNombre} ${clienteApellido}</p>
          <p><strong>🚗 Vehículo:</strong> ${vehiculo}</p>
          <p><strong>🔧 Servicios Solicitados:</strong><br>${serviciosHtml}</p>
          <p><strong>👷 Mecánico:</strong> ${mecanico}</p>
          <p><strong>🕒 Inicio:</strong> ${horaInicio}</p>
          <p><strong>⏰ Fin:</strong> ${horaFin}</p>
          <p><strong>📋 Estado:</strong> ${estado}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
      customClass: {
        popup: 'p-4',
        title: 'text-lg font-bold',
        htmlContainer: 'mt-3 text-sm'
      }
    });
  }

  // Funciones de navegación del menú
  navigateDashboardAdmin() {
    this.router.navigate(['/dashboard-admin']);
  }
  // Crear Mecanico
  navigateToCrearMecanico() {
    this.router.navigate(['/crear-mecanico']);
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
  navigateListarClientes(): void {
    this.router.navigate(['/listar-clientes']);
  }
  navigateListarOrden(): void {
    this.router.navigate(['/tipo-orden-servicio']);
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
    this.showHorariosMenu = false;
    this.showCitasMenu = false;
    this.showClientesMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
  }
}
