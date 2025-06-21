import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CitasService } from '../../services/Citas/citas.service';
import { VehiculoService } from '../../services/Vehiculo/vehiculo.service';
import { FormsModule } from '@angular/forms';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MatDialog } from '@angular/material/dialog';
import { EventosComponent } from '../../components/citas/eventos/eventos.component';
import { FullCalendarModule } from '@fullcalendar/angular'; // Import FullCalendarModule
import esLocale from '@fullcalendar/core/locales/es';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './calendario.component.html',
  styleUrls: ['./calendario.component.css']
})
export class CalendarioComponent {
  calendarOptions: any;
  citas: any[] = [];

  tiempoRestante: string = '';

  // Variables de usuario
  sidebarActive: boolean = false;
  rolActivo: string = 'Sin rol';
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showHistorialMenu: boolean = false;
  showMonitoreoMenu: boolean = false;

  constructor(
    private authService: AuthService,
    private vehiculoService: VehiculoService,
    private router: Router,
    private citasService: CitasService,
    private dialog: MatDialog
  ) {}

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
      events: [], // Se llenará con cargarCitas()
      dateClick: this.abrirModalCita.bind(this),
      eventClick: this.mostrarDetallesCita.bind(this),
    };

    this.cargarCitas(); // Cargar citas al iniciar
    this.iniciarReloj(); // Configurar el reloj
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

  // Mostrar detalles de la cita y, si es "confirmada" y el usuario es el dueño, permitir eliminarla
  mostrarDetallesCita(event: any): void {
    const cita = event.event;
  
    // Solo mostrar detalles si el estado es 'confirmada', 'atendida' o 'diagnosticado'
    if (
      !cita.extendedProps ||
      (cita.extendedProps.estado !== 'Atendida' &&
       cita.extendedProps.estado !== 'En Proceso' &&
       cita.extendedProps.estado !== 'Cancelada' &&
       cita.extendedProps.estado !== 'Confirmada' &&
       cita.extendedProps.estado !== 'Diagnosticado')
    ) {
      return;
    }    
  
    // Obtener el ID del usuario autenticado y verificar si es el dueño
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user.id;
    const isOwner = Number(cita.extendedProps.id_cliente) === Number(currentUserId);
  
    // Convertir la fecha y la hora de inicio de la cita en un objeto Date
    const appointmentStart = new Date(`${cita.extendedProps.fecha}T${cita.extendedProps.hora}`);
    const now = new Date();
  
    // Permitir eliminar solo si:
    // - El usuario es el dueño,
    // - El estado es "confirmada"
    // - Y la cita aún no ha iniciado (hora actual < hora de inicio)
    // Después: permitimos eliminar también si está Diagnosticado
    const canDelete = isOwner && (cita.extendedProps.estado === 'Confirmada' || cita.extendedProps.estado === 'Diagnosticado') && now < appointmentStart;
  
    // Construir los datos a mostrar
    const vehiculo = cita.extendedProps?.vehiculo
      ? `${cita.extendedProps.vehiculo.marca || 'Marca no definida'} (${cita.extendedProps.vehiculo.modelo || 'Modelo no definido'})`
      : 'Vehículo no definido';
  
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
  
    const mecanico = cita.extendedProps?.mecanicoNombre
      ? `${cita.extendedProps.mecanicoNombre} ${cita.extendedProps.mecanicoApellido}`
      : 'Mecánico no definido';
  
    const horaInicio = new Date(`1970-01-01T${cita.extendedProps.hora}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const horaFin = cita.extendedProps?.hora_fin
      ? new Date(`1970-01-01T${cita.extendedProps.hora_fin}`).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No definida';
  
    const fechaInicio = cita.extendedProps?.fecha || 'No definida';
    const fechaFin = cita.extendedProps?.fecha_fin || 'No definida';
    const estado = cita.extendedProps.estado || 'No definido';
    const cliente = cita.extendedProps?.nombre_cliente && cita.extendedProps?.apellido_cliente
      ? `${cita.extendedProps.nombre_cliente} ${cita.extendedProps.apellido_cliente}`
      : 'Cliente no definido';
  
    // Si en extendedProps se incluyen "capacidad" y "reservas", mostramos la info de reserva.
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

    const htmlContent = `
      <div style="font-family: 'Poppins', sans-serif; text-align: center; line-height: 1.6;">
        ${reservaInfo}
        <br>
        <p><strong>🙍‍♂️ Cliente:</strong> ${cliente}</p>
        <p><strong>🚗 Vehículo:</strong> ${vehiculo}</p>
        <p><strong>🔧 Servicios Solicitados:</strong><br>${serviciosHtml}</p>
        <p><strong>🛠️ Mecánico:</strong> ${mecanico}</p>
        <p><strong>🕒 Inicio:</strong> ${fechaInicio} - ${horaInicio}</p>
        <p><strong>⏰ Fin:</strong> ${fechaFin} - ${horaFin}</p>
        <p><strong>📋 Estado:</strong> ${estado}</p>
      </div>
    `;
  
    Swal.fire({
      title: '<h5 style="font-family: Poppins, sans-serif; color: rgb(26,25,25);">📅 DETALLES DE LA RESERVA</h5>',
      html: htmlContent,
      icon: 'info',
      showConfirmButton: false,
      showCancelButton: canDelete,
      cancelButtonText: `
        <span style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">
          Eliminar Cita
        </span>
      `,
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel && canDelete) {
        Swal.fire({
          title: '¿Estás seguro?',
          text: 'Esta acción no se puede deshacer.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar',
          cancelButtonText: 'Cancelar',
        }).then((deleteResult) => {
          if (deleteResult.isConfirmed) {
            this.citasService.cancelarCita(cita.id).subscribe(
              () => {
                Swal.fire('Eliminada', 'La cita ha sido eliminada con éxito.', 'success');
                this.cargarCitas();
              },
              (error) => {
                Swal.fire('Error', 'No se pudo eliminar la cita. Inténtalo nuevamente.', 'error');
              }
            );
          }
        });
      }
    });
  }        

  // Cargar todas las citas (de todos los clientes) y asignar extendedProps incluyendo el id_cliente y el estado
  cargarCitas(): void {
    this.citasService.listarCitas().subscribe(
      (response) => {
        this.calendarOptions.events = response.map((cita: any) => ({
          id: cita.id,
          title: `Vehículo: ${cita.vehiculo?.marca || 'Vehículo no definido'}`,
          start: `${cita.fecha}T${cita.hora}`,
          end: `${cita.fecha_fin}T${cita.hora_fin}`,
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
            id_cliente: cita.cliente.cedula, 
            nombre_cliente: cita.cliente.nombre,
            apellido_cliente: cita.cliente.apellido,
            vehiculo: cita.vehiculo || null,
            estado: cita.estado,
            vehiculoId: cita.id_vehiculo,
            subtipos: cita.subtipos || [],
            hora: cita.hora,
            hora_fin: cita.hora_fin,
            fecha: cita.fecha,
            fecha_fin: cita.fecha_fin,
            mecanicoNombre: cita.mecanico?.nombre || 'No asignado',
            mecanicoApellido: cita.mecanico?.apellido || '',
            capacidad: cita.capacidad,
            orden_reserva: cita.orden_reserva, // <--- nuevo campo
          },
        }));
      },
      (error) => {
        console.error('Error al cargar citas:', error);
      }
    );
  }    

  abrirModalCita(info: any): void {
    const [year, month, day] = info.dateStr.split('-').map(Number);
    const clickedDate = new Date(year, month - 1, day);
    clickedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validar si es sábado (0) o domingo (6)
    const dayOfWeek = clickedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha inválida',
        text: 'No puedes programar citas los sábados o domingos.'
      });
      return;
    }

    // Validar si es fecha pasada
    if (clickedDate < today) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha inválida',
        text: 'No puedes programar citas en fechas pasadas.'
      });
      return;
    }

    // Verificar vehículos y abrir el modal para programar cita
    this.vehiculoService.obtenerVehiculos().subscribe(
      (response) => {
        if (response.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin Vehículos Registrados',
            text: 'Debes registrar al menos un vehículo antes de programar una cita.',
            confirmButtonText: 'Registrar Vehículo',
          }).then(() => {
            this.router.navigate(['/registrar-vehiculo']);
          });
        } else {
          const dialogRef = this.dialog.open(EventosComponent, {
            data: { fecha: info.dateStr },
          });
          dialogRef.afterClosed().subscribe((result) => {
            if (result) this.cargarCitas();
          });
        }
      },
      (error) => {
        console.error('Error al verificar vehículos:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al verificar los vehículos. Por favor, inténtalo nuevamente.',
          confirmButtonText: 'Aceptar',
        });
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
        clearInterval(timer);
        this.logout();
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

  // Resetea todos los menús
  resetMenus(): void {
    this.showMecanicosMenu = false;
    this.showClientesMenu = false;
    this.showCitasMenu = false;
    this.showHistorialMenu = false;
    this.showConfiguracionMenu = false;
    this.showMonitoreoMenu = false;
  }

  // Alternar menús
  toggleMenu(menu: string): void {
    this.resetMenus();
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

  // Cierre de sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  // Navegación entre componentes
  navigateDashboarCliente(): void {
    this.router.navigate(['/dashboard-clientes']);
  }
  navigateRegistrarVehiculo(): void {
    this.router.navigate(['/registrar-vehiculo']);
  }
  navigateListarVehiculos(): void {
    this.router.navigate(['/listar-vehiculo']);
  }
  navigateMonitoreo(): void {
    this.router.navigate(['/monitoreo']);
  }
  navigateHistorial(): void {
    this.router.navigate(['/historial']);
  }
}
