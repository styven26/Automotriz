import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { CitaMecanicoService } from '../../../services/CitaMecanico/cita-mecanico.service';
import { FullCalendarModule } from '@fullcalendar/angular'; // Import FullCalendarModule
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-mecanico-cita',
    standalone: true,
    imports: [CommonModule, FullCalendarModule],
    templateUrl: './mecanico-cita.component.html',
    styleUrls: ['./mecanico-cita.component.css']
})
export class MecanicoCitaComponent {

  constructor(private authService: AuthService, private router: Router, private http: HttpClient, private citasService: CitaMecanicoService) {}

  calendarOptions: any;
  tiempoRestante: string = '';

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  // Funciones de navegación del menú
  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: esLocale,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      },
      displayEventTime: true,
      eventTimeFormat: {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false      // si prefieres 24h; pon true para AM/PM
      },
      allDaySlot: false,
      height:            'auto',
      contentHeight:     'auto',
      expandRows:        true,
      handleWindowResize:true,
      events: [], // Inicialmente vacío, se llenará con `cargarCitasMecanico`
      eventClick: this.mostrarDetallesCita.bind(this),
    };
  
    this.cargarCitasMecanico();
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

  cargarCitasMecanico(): void {
    this.citasService.listarCitasMecanico().subscribe(
      (response) => {
        this.calendarOptions.events = response.map((cita: any) => ({
          id: cita.id,
          title: `Vehículo: ${cita.vehiculo?.marca || 'Vehículo no definido'}`,
          start: `${cita.fecha}T${cita.hora}`,
          end: cita.fecha_fin 
                 ? `${cita.fecha_fin}T${cita.hora_fin}` 
                 : (cita.hora_fin ? `${cita.fecha}T${cita.hora_fin}` : null),
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
            vehiculo: cita.vehiculo || null,
            clienteNombre: cita.cliente?.nombre || 'Sin nombre',
            clienteApellido: cita.cliente?.apellido || 'Sin apellido',
            subtipos: cita.subtipos || [],
            estado: cita.estado,
            fecha: cita.fecha,
            fecha_fin: cita.fecha_fin, // Se incluye para poder combinar con hora_fin
            hora_fin: cita.hora_fin,
            capacidad: cita.capacidad,
            orden_reserva: cita.orden_reserva
          },
        }));        
      },
      (error) => {
        console.error('Error al cargar citas del mecánico:', error);
      }
    );
  }                                

  mostrarDetallesCita(event: any): void {
    const cita = event.event;
  
    const servicios = cita.extendedProps?.subtipos || [];
    const serviciosHtml = servicios .length
      ? servicios
          .map((subtipo: any) => `
            <div style="margin-bottom: 10px; text-align: center;">
              🔧 ${subtipo.nombre}
            </div>
          `)
          .join('')
      : 'Subtipos de servicio no definidos';
  
    const vehiculo = cita.extendedProps?.vehiculo
      ? `${cita.extendedProps.vehiculo.marca || 'Marca no definida'} (${cita.extendedProps.vehiculo.modelo || 'Modelo no definido'})`
      : 'Vehículo no definido';
  
    const clienteNombre = cita.extendedProps?.clienteNombre || 'Sin nombre';
    const clienteApellido = cita.extendedProps?.clienteApellido || 'Sin apellido';
    const estado = cita.extendedProps?.estado || 'Estado no definido';
  
    const horaInicio = cita.start ? cita.start.toLocaleString() : 'No definida';
  
    // Usar fecha_fin si existe, sino la fecha de inicio
    let fechaFin = cita.extendedProps?.fecha_fin || cita.extendedProps?.fecha;
    let horaFin = 'No definida';
    if (fechaFin && cita.extendedProps?.hora_fin) {
      const dateFin = new Date(`${fechaFin}T${cita.extendedProps.hora_fin}`);
      horaFin = dateFin.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    // Construir la información de reserva
  const reservaInfo = (
    cita.extendedProps?.capacidad !== undefined && 
    cita.extendedProps?.orden_reserva !== undefined
  )
    ? `
      <p style="
        font-size: 22px; 
        font-weight: bold; 
        color: #333; 
        margin-bottom: 10px;
        text-align: center;
      ">
        Reserva: ${cita.extendedProps.orden_reserva} de ${cita.extendedProps.capacidad}
      </p>
    `
    : '';
  
    Swal.fire({
      title: '<h5>📅 DETALLES DE LA RESERVA</h5>',
      html: `
        <div style="text-align: center;">
          ${reservaInfo}
          <br>
          <p><strong>🚗 Vehículo:</strong> ${vehiculo}</p>
          <p><strong>🔧 Servicios Solicitados:</strong><br>${serviciosHtml}</p>
          <p><strong>🕒 Inicio:</strong> ${horaInicio}</p>
          <p><strong>⏰ Fin:</strong> ${horaFin}</p>
          <p><strong>🙍‍♂️ Cliente:</strong> ${clienteNombre} ${clienteApellido}</p>
          <p><strong>📋 Estado:</strong> ${estado}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Cerrar',
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