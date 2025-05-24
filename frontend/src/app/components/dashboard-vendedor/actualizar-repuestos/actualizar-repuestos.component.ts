import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms'; 
import { MAT_DIALOG_DATA, MatDialogRef }     from '@angular/material/dialog';
import { CommonModule }                      from '@angular/common';
import { ReactiveFormsModule }               from '@angular/forms';
import { MatFormFieldModule }                from '@angular/material/form-field';
import { MatInputModule }                    from '@angular/material/input';
import { MatIconModule }                     from '@angular/material/icon';
import { RepuestoService, Repuesto }         from '../../../services/Repuesto/repuesto.service';
import Swal                                  from 'sweetalert2';

@Component({
  selector: 'app-actualizar-repuestos',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './actualizar-repuestos.component.html',
  styleUrls: ['./actualizar-repuestos.component.css']
})
export class ActualizarRepuestosComponent {

  repuestoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private repuestoService: RepuestoService,
    public dialogRef: MatDialogRef<ActualizarRepuestosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Repuesto
  ) {
    this.repuestoForm = this.fb.group({
      nombre:       [data.nombre,       [Validators.required, Validators.maxLength(50)]],
      precio_base:  [data.precio_base,  [Validators.required, Validators.min(0)]],
      iva:          [data.iva,          [Validators.required, Validators.min(0), Validators.max(100)]],
      stock:        [data.stock,        [Validators.required, Validators.min(0)]],
      stock_minimo: [data.stock_minimo, [Validators.required, Validators.min(0)]],
    });
  }

  guardarCambios(): void {
    if (this.repuestoForm.invalid) return;

    const valores = this.repuestoForm.value;
    this.repuestoService
      .update(this.data.id_repuesto!, valores)
      .subscribe({
        next: updated => {
          Swal.fire({
            icon:  'success',
            title: '¡Repuesto actualizado!',
            text:  `El repuesto "${updated.nombre}" se actualizó correctamente.`,
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'btn btn-success btn-rounded' },
            buttonsStyling: false
          }).then(() => {
            this.dialogRef.close(updated);
          });
        },
        error: err => {
          console.error('Error actualizando repuesto:', err);
          Swal.fire({
            icon:  'error',
            title: 'Error',
            text:  err?.error?.message || 'No se pudo actualizar el repuesto.',
            confirmButtonText: 'Cerrar',
            customClass: { confirmButton: 'btn btn-danger' },
            buttonsStyling: false
          });
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}