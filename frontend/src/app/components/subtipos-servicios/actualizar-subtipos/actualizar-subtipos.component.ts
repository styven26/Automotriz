import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';         // <-- Para *ngIf, *ngFor
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TiposService } from '../../../services/Tiposervicios/tipos.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule }    from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actualizar-subtipos',
  standalone: true,
  imports: [MatInputModule, MatIconModule, CommonModule, MatSelectModule, ReactiveFormsModule],
  templateUrl: './actualizar-subtipos.component.html',
  styleUrls: ['./actualizar-subtipos.component.css']
})
export class ActualizarSubtiposComponent {
  subtipoForm: FormGroup;
  tiposExistentes: any[] = [];

  constructor(
    private fb: FormBuilder,
    private tiposService: TiposService,
    public dialogRef: MatDialogRef<ActualizarSubtiposComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Calcular valores iniciales para precio_base e iva
    const precioBase = this.calcularPrecioBase(data.precio, data.iva);

    // Inicializar el formulario con datos iniciales
    this.subtipoForm = this.fb.group({
      id_servicio: [data.id_servicio, [Validators.required]],
      id_tipo: [ data.id_tipo, [Validators.required ]],
      nombre: [
        data.nombre,
        [
          Validators.required,
          Validators.maxLength(100),
          Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/)
        ]
      ],
      descripcion: [data.descripcion, [Validators.required, Validators.maxLength(255)]],
      precio_base: [
        precioBase,
        [
          Validators.required,
          Validators.min(0),
          Validators.pattern(/^\d+(\.\d{1,2})?$/)
        ]
      ],
      iva: [data.iva || 12, [
        Validators.required,
        Validators.min(0),
        Validators.max(100),
        Validators.pattern(/^\d+$/) // Solo dígitos enteros
      ]],
      precio: [{ value: data.precio || 0, disabled: true }],
    });

    // Escuchar cambios en precio_base e IVA para recalcular el precio final
    this.subtipoForm.get('precio_base')?.valueChanges.subscribe(() => this.calcularPrecioFinal());
    this.subtipoForm.get('iva')?.valueChanges.subscribe(() => this.calcularPrecioFinal());
  }

  ngOnInit() {
    // Carga todos los tipos para el select
    this.tiposService.obtenerTiposServicios().subscribe(
      tipos => this.tiposExistentes = tipos,
      err   => console.error('No se pudieron cargar los tipos', err)
    );
  }

  // Método para calcular el Precio Base desde el Precio Final y el IVA
  calcularPrecioBase(precioFinal: number, iva: number): number {
    return parseFloat((precioFinal / (1 + iva / 100)).toFixed(2));
  }

  // Método para calcular el Precio Final desde el Precio Base y el IVA
  calcularPrecioFinal(): void {
    const precioBase = this.subtipoForm.get('precio_base')?.value || 0;
    const iva = this.subtipoForm.get('iva')?.value || 0;
    const precioFinal = precioBase + (precioBase * iva) / 100;

    this.subtipoForm.get('precio')?.setValue(precioFinal.toFixed(2), { emitEvent: false });
  }

  guardarCambios(): void {
    if (this.subtipoForm.valid) {

      // Preparar los datos para enviar al backend
      const datos = {
        id_tipo:      this.subtipoForm.value.id_tipo,        // ← ¡MUY IMPORTANTE!
        nombre:       this.subtipoForm.value.nombre,
        descripcion:  this.subtipoForm.value.descripcion,
        precio_base:  this.subtipoForm.value.precio_base,
        iva:          this.subtipoForm.value.iva,
        precio:       parseFloat(this.subtipoForm.get('precio')?.value),
      };

      console.log('Datos enviados al backend:', datos);

      // Cerrar el modal y enviar los datos
      this.dialogRef.close(datos);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Formulario no válido',
        text: 'Por favor, completa todos los campos correctamente.',
        confirmButtonText: 'Cerrar',
        customClass: {
          confirmButton: 'btn btn-danger',
        },
        buttonsStyling: false,
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}