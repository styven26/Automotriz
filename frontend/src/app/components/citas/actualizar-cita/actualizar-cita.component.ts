import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CitasService } from '../../../services/Citas/citas.service';
import { VehiculoService } from '../../../services/Vehiculo/vehiculo.service';
import { SubtipoService } from '../../../services/Subtiposervicios/subtipo.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-actualizar-cita',
    standalone: true,
    imports: [CommonModule, FormsModule, MatInputModule, MatIconModule, MatButtonModule, MatSelectModule, MatDialogContent, MatDialogActions],
    templateUrl: './actualizar-cita.component.html',
    styleUrls: ['./actualizar-cita.component.css']
})
export class ActualizarCitaComponent {

  constructor(
    public dialogRef: MatDialogRef<ActualizarCitaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private citasService: CitasService,
    private vehiculoService: VehiculoService,
    private subtipoService: SubtipoService
  ) {}

  misVehiculos: any[] = []; // Lista de vehículos
  servicios: any[] = []; // Lista de tipos de servicio
  idVehiculo: number = 0; // ID del vehículo seleccionado
  idSubtipo: number = 0; // ID del tipo de servicio seleccionado
  horaInicio: string = '';
  horaFin: string = '';
  subtiposSeleccionados: number[] = []; // IDs de los subtipos seleccionados
  duracionTotal: number = 0; // Duración total de los servicios seleccionados

  ngOnInit(): void {
    this.idVehiculo = this.data.idVehiculo;
    this.idSubtipo = this.data.idSubtipo;
    this.horaInicio = this.data.horaInicio;
    this.horaFin = this.data.horaFin || '';
    this.subtiposSeleccionados = this.data.subtiposSeleccionados || [];
    this.duracionTotal = this.data.duracionTotal || 0;
  
    this.cargarVehiculos();
    this.cargarServicios();
  }  

  cargarVehiculos(): void {
    this.vehiculoService.obtenerVehiculos().subscribe(
      (response) => {
        this.misVehiculos = response;
      },
      (error) => {
        console.error('Error al cargar vehículos:', error);
      }
    );
  }

  cargarServicios(): void {
    this.subtipoService.obtenerSubtiposServicios().subscribe(
      (response) => {
        this.servicios = response || [];
        console.log('Servicios cargados:', this.servicios);
      },
      (error) => {
        console.error('Error al cargar servicios:', error);
        this.servicios = [];
      }
    );
  }  

  actualizarCita(): void {
    const citaActualizada = {
        fecha: this.data.fecha,
        hora: this.horaInicio,
        hora_fin: this.horaFin,
        id_vehiculo: this.idVehiculo,
        subtipos: this.subtiposSeleccionados.map((id) => {
            const servicio = this.servicios.find((s) => s.id === id);
            return {
                id,
                descripcion: servicio?.descripcion || 'Sin descripción',
                progreso: servicio?.progreso || 0,
            };
        }),
    };

    this.citasService.modificarCita(this.data.citaId, citaActualizada).subscribe(
        () => {
            Swal.fire({
              icon: 'success',
              title: '¡Cita Actualizada!',
              text: 'La cita ha sido actualizada exitosamente.',
              confirmButtonText: 'Aceptar',
            }).then(() => {
                this.dialogRef.close(true);
            });
        },
        (error) => {
            const errores = error.error;
            let mensajeError = `<p style="font-family: 'Poppins', sans-serif; color: #e74c3c;">${errores.error || 'Ocurrió un problema al actualizar la cita.'}</p>`;

            if (errores.horario_permitido) {
                mensajeError += `
                    <p style="font-family: 'Poppins', sans-serif; color: #2c3e50;"> ${errores.horario_permitido}</p>
                `;
            }

            if (errores.mensaje_sugerencia) {
                mensajeError += `
                    <p style="font-family: 'Poppins', sans-serif; color: #2c3e50;">${errores.mensaje_sugerencia}</p>
                `;
            }

            if (errores.duracion_total && errores.horas_disponibles) {
                mensajeError += `
                    <p style="font-family: 'Poppins', sans-serif; color: #16a085;">
                        <strong>Duración Total:</strong> ${errores.duracion_total}
                    </p>
                    <p style="font-family: 'Poppins', sans-serif; color: #16a085;">
                        <strong>Horas Disponibles:</strong> ${errores.horas_disponibles}
                    </p>
                `;
            }

            if (errores.horarios_sugeridos?.length > 0) {
                mensajeError += `
                    <p style="font-family: 'Poppins', sans-serif; color: #2980b9;"><strong>Horarios Sugeridos:</strong></p>
                    <ul style="list-style: none; padding: 0;">
                        ${errores.horarios_sugeridos
                            .map(
                                (h: any) =>
                                    `<li style="margin-bottom: 5px;">🕒 ${h.hora_inicio} - ${h.hora_fin}</li>`
                            )
                            .join('')}
                    </ul>
                `;
            }

            Swal.fire({
                icon: 'error',
                title: '<h5 style="font-family: Poppins, sans-serif; color: #c0392b;">Error al actualizar la cita</h5>',
                html: mensajeError,
                confirmButtonText: `
                    <span style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: bold; color: #ffffff;">
                        Aceptar
                    </span>
                `,
                confirmButtonColor: '#c0392b',
            });
        }
    );
  }

  cancelar(): void {
    this.dialogRef.close(false); // Cierra el modal sin cambios
  }

  onSubtiposChange(): void {
    // Calcular la duración total de los servicios seleccionados
    this.duracionTotal = this.subtiposSeleccionados.reduce((total, id) => {
      const servicio = this.servicios.find((s) => s.id === id);
      return total + (servicio?.duracion_estimada || 0);
    }, 0);
    this.calcularHoraFin();
  }

  calcularHoraFin(): void {
    if (this.horaInicio && this.duracionTotal > 0) {
      const [hours, minutes] = this.horaInicio.split(':').map(Number);
      const fecha = new Date();
      fecha.setHours(hours, minutes);
      fecha.setMinutes(fecha.getMinutes() + this.duracionTotal);
      this.horaFin = fecha.toTimeString().slice(0, 5); // Formato HH:mm
    } else {
      this.horaFin = '';
    }
  } 

}