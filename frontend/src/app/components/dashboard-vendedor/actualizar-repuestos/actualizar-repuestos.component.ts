import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { RepuestoService, Repuesto } from '../../../services/Repuesto/repuesto.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actualizar-repuestos',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './actualizar-repuestos.component.html',
  styleUrls: ['./actualizar-repuestos.component.css']
})
export class ActualizarRepuestosComponent implements OnInit {
  repuestoForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private repuestoService: RepuestoService,
    public dialogRef: MatDialogRef<ActualizarRepuestosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Repuesto
  ) {}

  ngOnInit(): void {
    // 1) Creamos el FormGroup igual que en creación
    this.repuestoForm = this.fb.group({
      nombre: [
        this.data.nombre,
        [
          Validators.required,
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)
        ]
      ],
      precio_base: [
        this.data.precio_base,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(1000),
          // hasta 2 decimales
          Validators.pattern(/^\d{1,4}(\.\d{1,2})?$/)
        ]
      ],
      iva: [
        this.data.iva,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(20),
          Validators.pattern(/^[0-9]+$/)
        ]
      ],
      stock: [
        this.data.stock,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^[0-9]+$/)
        ]
      ],
      stock_minimo: [
        this.data.stock_minimo,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^[0-9]+$/)
        ]
      ]
    });

    // 2) Añadimos validador cruzado a stock_minimo
    const stockMinCtrl = this.repuestoForm.get('stock_minimo')!;
    stockMinCtrl.addValidators(this.stockMinimoValidator());

    // 3) Cada vez que cambie stock, revalidamos stock_minimo
    this.repuestoForm.get('stock')!
      .valueChanges
      .subscribe(() => stockMinCtrl.updateValueAndValidity());
  }

  /** Validador: stock_minimo ≤ stock */
  private stockMinimoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const min   = control.value;
      const stock = this.repuestoForm?.get('stock')?.value;
      return (min != null && stock != null && min > stock)
        ? { stockMinimoMayor: true }
        : null;
    };
  }

  // Getters para la plantilla
  get nombre()      { return this.repuestoForm.get('nombre'); }
  get precioBase()  { return this.repuestoForm.get('precio_base'); }
  get iva()         { return this.repuestoForm.get('iva'); }
  get stock()       { return this.repuestoForm.get('stock'); }
  get stockMinimo() { return this.repuestoForm.get('stock_minimo'); }

  guardarCambios(): void {
    if (this.repuestoForm.invalid) return;

    const valores = this.repuestoForm.value as Repuesto;
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
          }).then(() => this.dialogRef.close(updated));
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