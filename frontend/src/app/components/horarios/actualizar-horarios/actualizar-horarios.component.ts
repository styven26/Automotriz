import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; 
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select'; // Asegúrate de importar MatSelectModule
import { HorarioService } from '../../../services/Horario/horario.service';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-actualizar-horarios',
  standalone: true,
  templateUrl: './actualizar-horarios.component.html',
  styleUrls: ['./actualizar-horarios.component.css'],
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatSelectModule, MatInputModule, ReactiveFormsModule, MatIconModule]
})
export class ActualizarHorariosComponent {

  horarioForm: FormGroup;
  diasSemana: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  constructor(
    public dialogRef: MatDialogRef<ActualizarHorariosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private horarioService: HorarioService
  ) {
    // Configuración del formulario con los campos del esquema actual
    this.horarioForm = this.fb.group({
      id: [data.id || null],
      dia_semana: [data.dia || '', Validators.required],
      manana_inicio: [data.mananaInicio || '', Validators.required],
      tarde_fin: [data.tardeFin || '', Validators.required],
      capacidad_max: [data.capacidad !== undefined ? data.capacidad : '', [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/), Validators.max(10)]]
    });
  }

  private formatTime(time: string): string {
    if (!time) return '';
    // Parse the time to make sure it’s in HH:mm format
    const date = new Date(`1970-01-01T${time}`);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onSave(): void {
    if (this.horarioForm.valid) {
        const horarioData = this.horarioForm.value;

        horarioData.manana_inicio = this.formatTime(horarioData.manana_inicio);
        horarioData.tarde_fin = this.formatTime(horarioData.tarde_fin);

        console.log('Datos del formulario antes de enviar (formateados):', horarioData);

        this.horarioService.verificarFranjaHoraria(horarioData)
            .subscribe(response => {
                if (response.existe) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: `Ya existe un horario configurado para ${horarioData.dia_semana}.`
                    });
                } else {
                    this.dialogRef.close(horarioData);
                }
            },
            error => {
                console.error('Error en la verificación:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de verificación',
                    text: 'Por favor, asegúrate de que todos los campos de tiempo están en el formato correcto (H:i).'
                });
            });
    } else {
        console.error('Formulario inválido:', this.horarioForm.errors);
    }
  }
  
  onCancel(): void {
    this.dialogRef.close();
  }
}