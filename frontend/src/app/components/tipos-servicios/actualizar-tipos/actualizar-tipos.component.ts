import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-actualizar-tipos',
  standalone: true,
  imports: [MatInputModule, MatIconModule, CommonModule, ReactiveFormsModule],
  templateUrl: './actualizar-tipos.component.html',
  styleUrls: ['./actualizar-tipos.component.css']
})
export class ActualizarTiposComponent {

  tipoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ActualizarTiposComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Crear el formulario y prellenar los campos con los datos del tipo de servicio
    this.tipoForm = this.fb.group({
      nombre: [
        data.nombre,
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)  // Solo letras y espacios
        ]
      ]
    });    
  }

  guardarCambios(): void {
    if (this.tipoForm.valid) {
      this.dialogRef.close(this.tipoForm.value);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Verifica que todos los campos estén completos y sean válidos.',
        confirmButtonText: 'Cerrar',
        customClass: {
          confirmButton: 'btn btn-danger'
        },
        buttonsStyling: false
      });
    }
  }  

  cancelar(): void {
    this.dialogRef.close();
  }
}

