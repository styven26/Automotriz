import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CitasService } from '../../../services/Citas/citas.service';
import { VehiculoService } from '../../../services/Vehiculo/vehiculo.service';
import { SubtipoService } from '../../../services/Subtiposervicios/subtipo.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    CommonModule,
  ],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css'],
})
export class EventosComponent {

  misVehiculos: any[] = [];
  servicios: any[] = [];
  busyVehicleIds: number[] = [];
  // Arreglo de IDs de servicios seleccionados
  subtiposSeleccionados: number[] = [];
  // Variable para almacenar el ID del servicio "Diagnóstico" (si existe)
  diagnosticoId: number | null = null;

  // 🚨 DECLARA ESTO:
  // El tipo de orden que el usuario elija
  tipoOrdenSeleccionado: number = 0;
  
  // Variables para el resumen
  vehiculoSeleccionado: string = '';
  serviciosSeleccionados: string = '';
  capacidadHoraria: number = 0;
  reservasActuales: number = 0;
  
  idVehiculo: number = 0;
  horaInicio: string = '';

  constructor(
    public dialogRef: MatDialogRef<EventosComponent>,
    private citasService: CitasService,
    private vehiculoService: VehiculoService,
    private subtipoService: SubtipoService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    console.log('Datos recibidos en el modal:', this.data);
    // Se asume que data.fecha está definida
    if (this.data.fecha) {
      this.obtenerCapacidad();
    }

    if (this.data.fecha && this.horaInicio) {
      this.loadBusyVehicles();
    }

    // Se pueden inicializar valores desde data si vienen preseleccionados
    this.idVehiculo = this.data.idVehiculo || 0;
    this.horaInicio = this.data.horaInicio || '';
    this.subtiposSeleccionados = this.data.subtiposSeleccionados || [];

    this.cargarVehiculos();
    this.cargarServicios();
  }

  // Llama al backend para saber qué vehículos están ocupados
  loadBusyVehicles() {
    this.citasService
      .busyVehicles(this.data.fecha, this.horaInicio)
      .subscribe(ids => this.busyVehicleIds = ids);
  }

  // Cada vez que el usuario cambie la hora de inicio...
  onHoraChange(newHora: string) {
    this.horaInicio = newHora;
    this.loadBusyVehicles();
  }

  /** Busca el nombre del servicio por su id */
  getNombreServicio(id: number): string {
    const svc = this.servicios.find(s => s.id_servicio === id);
    return svc ? svc.nombre : 'Servicio';
  }
  
  obtenerCapacidad(): void {
    if (this.data.fecha) {
      this.citasService.obtenerCapacidad({ fecha: this.data.fecha }).subscribe({
        next: (res: any) => {
          this.capacidadHoraria = res.capacidad;
          this.reservasActuales = res.reservadas;
          // Si la capacidad ya está llena, mostramos un mensaje de error
          if (this.reservasActuales >= this.capacidadHoraria) {
            Swal.fire(
              'Error',
              'No hay cupos disponibles para la fecha seleccionada. Por favor, reserva otro día.',
              'error'
            );
          }
        },
        error: (err) => {
          console.error('Error obteniendo capacidad:', err);
          
          // Verificamos si el backend devolvió un 422 y mostramos el mensaje correspondiente
          if (err.status === 422) {
            // Normalmente tu backend envía algo como { error: 'No se encontró un horario para el día seleccionado.' }
            // Lo tomamos de err.error?.error
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err.error?.error || 'Ocurrió un error al obtener la capacidad.',
              confirmButtonText: 'Cerrar',
            });
          } else {
            // Cualquier otro tipo de error
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al obtener la capacidad. Por favor, inténtalo nuevamente.',
              confirmButtonText: 'Cerrar',
            });
          }
        },
      });
    }
  }    

  cargarVehiculos(): void {
    this.vehiculoService.obtenerVehiculos().subscribe(
      (response) => {
        this.misVehiculos = response;
        if (this.misVehiculos.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'Sin Vehículos Registrados',
            text: 'Debes registrar un vehículo antes de programar una cita.',
            confirmButtonText: 'Registrar Vehículo',
          }).then(() => {
            this.dialogRef.close();
            window.location.href = '/registrar-vehiculo';
          });
        }
      },
      (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al Cargar Vehículos',
          text: 'Hubo un problema al obtener los vehículos. Por favor, inténtalo nuevamente.',
          confirmButtonText: 'Aceptar',
        });
      }
    );
  }

  cargarServicios(): void {
    this.subtipoService.obtenerSubtiposServicios().subscribe(
      (response: any[]) => {
        this.servicios = response;

        // Buscar el servicio "Diagnóstico"
        const diagnosticoServicio = this.servicios.find(
          s => s.nombre.toLowerCase() === 'diagnóstico'
        );
        // Asegúrate de leer id_servicio, no id
        this.diagnosticoId = diagnosticoServicio
          ? diagnosticoServicio.id_servicio
          : null;

        this.actualizarServiciosSeleccionados();
        this.onServiciosChange(this.subtiposSeleccionados);
      },
      error => { console.error(error); }
    );
  }

  onConfirmClick(): void {
    Swal.fire({
      title: '¿Deseas editar los datos?',
      text: 'Ya no será posible retroceder después de confirmar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then(result => {
      if (result.isConfirmed) {
        // Si confirma, llama al método que ya tienes
        this.confirmarCita();
      }
    });
  }

  onServiciosChange(selectedIds: number[]) {
    this.subtiposSeleccionados = selectedIds;
    this.actualizarServiciosSeleccionados();
  }

  // Método para determinar si "Diagnóstico" está seleccionado
  isDiagnosticoSelected(): boolean {
    return (
      this.diagnosticoId != null &&
      this.subtiposSeleccionados.includes(this.diagnosticoId)
    );
  }

  actualizarServiciosSeleccionados(): void { 
    // Si "Diagnóstico" está seleccionado y se han seleccionado más de una opción,
    // forzamos que solo permanezca "Diagnóstico"
    if (this.isDiagnosticoSelected() && this.subtiposSeleccionados.length > 1) {
      this.subtiposSeleccionados = [this.diagnosticoId as number];
      Swal.fire({
        title: 'Información',
        html: `<div style="font-family: 'Poppins', sans-serif; text-align: center; color: #d9534f; font-size: 18px;">
                 Solo se permite seleccionar "Diagnóstico" de forma exclusiva.
               </div>`,
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
    }
    // Actualizar la cadena de servicios seleccionados para mostrar en el resumen
    this.serviciosSeleccionados = this.subtiposSeleccionados
      .map(id => {
        const svc = this.servicios.find((s: any) => s.id_servicio === id);
        return svc ? svc.nombre : null;
      })
      .filter(nombre => !!nombre)
      .join(', ');
  }  

  confirmarCita(): void {
    // Validaciones iniciales (vehículo, servicios, hora)
    if (!this.idVehiculo || this.subtiposSeleccionados.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Datos Incompletos',
        text: 'Selecciona un vehículo y al menos un servicio antes de continuar.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
  
    if (!this.horaInicio) {
      Swal.fire({
        icon: 'error',
        title: 'Hora Inválida',
        text: 'Debes seleccionar una hora de inicio válida.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
  
    // Si se superó la capacidad, no permitir confirmar
    if (this.reservasActuales >= this.capacidadHoraria) {
      Swal.fire({
        icon: 'error',
        title: 'Capacidad Excedida',
        text: 'No hay cupos disponibles para la fecha seleccionada. Por favor, selecciona otra fecha.',
        confirmButtonText: 'Aceptar',
      });
      return;
    } 
    
    // Preparar los datos para la solicitud
    const citaData = {
        fecha:       this.data.fecha,
        hora:        this.horaInicio,
        id_vehiculo: this.idVehiculo,
        servicios:   this.subtiposSeleccionados  // solo IDs
      };
  
    this.citasService.crearCita(citaData).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: '¡Reserva Creada!',
          text: 'La reserva se ha registrado con éxito.',
          confirmButtonText: 'Aceptar',
        }).then(() => this.dialogRef.close(true));
      },
      error: (err) => {
        // Manejo de error 422
        if (err.status === 422) {
          // Extraer campos específicos del error
          const errorTitulo = err.error?.error || 'Datos Inválidos';
          const errorMensaje = err.error?.mensaje || '';
          const horaActual = err.error?.hora_actual;
          const horaIngresada = err.error?.hora_ingresada;
          const sugerencia = err.error?.sugerencia;
  
          // Campos que ya tenías
          const horarioPermitido = err.error?.horario_permitido || '';
          const sugerencias = err.error?.horarios_sugeridos || [];
          const mensajeSugerencia = err.error?.mensaje_sugerencia || '';
  
          // Empieza a armar el mensaje de error
          let mensajeError = `<p>${errorMensaje}</p>`;
  
          // Si el backend devolvió hora_actual y hora_ingresada, muéstralas
          if (horaActual && horaIngresada) {
            mensajeError += `
              <p>
                <strong style="color:rgb(16, 149, 221);">Hora Actual:</strong> 
                <span style="color: #000000;">${horaActual}</span>
              </p>
              <p>
                <strong style="color:rgb(232, 105, 94);">Hora Ingresada:</strong>
                <span style="color: #000000;">${horaIngresada}</span>
              </p>
            `;
          }
  
          // Si el backend devolvió sugerencia
          if (sugerencia) {
            mensajeError += `
              <p style="color:rgb(40, 37, 37);">
                ${sugerencia}
              </p>
            `;
          }
  
          // Resto de lógica que ya tenías:
          if (horarioPermitido) {
            mensajeError += `
              <p><strong>Horario permitido:</strong> ${horarioPermitido}</p>
            `;
          }
  
          if (mensajeSugerencia) {
            mensajeError += `
              <p style="color: #3498db;">${mensajeSugerencia}</p>
            `;
          }
  
          // ...
          if (sugerencias.length > 0) {
            mensajeError += `
              <p><strong>Horarios Sugeridos:</strong></p>
              <!-- Estilo inline para remover viñetas y espaciados -->
              <ul style="list-style-type: none; margin: 0; padding: 0;">
            `;
            sugerencias.forEach((h: any) => {
              mensajeError += `
                <li>
                  <span style="margin-right: 6px;">🕒</span>
                  ${h.hora_inicio} - ${h.hora_fin}
                </li>
              `;
            });
            mensajeError += `</ul>`;
          }
          // ...

          // Mostrar con SweetAlert
          Swal.fire({
            icon: 'error',
            title: errorTitulo,  // Usar el título devuelto por el backend
            html: mensajeError,
            confirmButtonText: 'Cerrar',
          });
        } else {
          // Otros errores (500, 401, etc.)
          Swal.fire({
            icon: 'error',
            title: 'Error al Crear la Cita',
            text: 'Ocurrió un problema en el servidor. Intenta de nuevo.',
            confirmButtonText: 'Cerrar',
          });
        }
      },
    });
  }    

  actualizarVehiculoSeleccionado(): void {
    const vehiculo = this.misVehiculos.find((v) => v.id_vehiculo  === this.idVehiculo);
    this.vehiculoSeleccionado = vehiculo
      ? `${vehiculo.marca} (${vehiculo.modelo})`
      : 'No seleccionado';
  }
}
