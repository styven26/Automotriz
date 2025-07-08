import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OptionService } from '../../../services/option.service';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { VehiculoService } from '../../../services/Vehiculo/vehiculo.service';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-actualizar-vehiculo',
    standalone: true,
    imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, ReactiveFormsModule, MatSelectModule, MatIconModule],
    templateUrl: './actualizar-vehiculo.component.html',
    styleUrls: ['./actualizar-vehiculo.component.css']
})
export class ActualizarVehiculoComponent {
  vehiculoForm: FormGroup;

  nuevaImagen: File | null = null; // Variable para la nueva imagen
  previewImage: string | null = null;
  transmissions: {id:string,name:string}[] = [];
  fuelTypes:    {id:string,name:string}[] = [];

  constructor(
    private fb: FormBuilder,
    private vehiculoService: VehiculoService,
    private optionSvc: OptionService,
    public dialogRef: MatDialogRef<ActualizarVehiculoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.vehiculoForm = this.fb.group({
      marca: [data.marca, [Validators.required, Validators.maxLength(100)]],
      modelo: [data.modelo, [Validators.required, Validators.maxLength(100)]],
      anio: [data.anio, [Validators.required, Validators.min(1886), Validators.max(new Date().getFullYear())]],
      numero_placa: [data.numero_placa, [Validators.required, Validators.maxLength(100)]],
      transmision: [data.transmision, Validators.required],
      tipo_combustible: [data.tipo_combustible, Validators.required],
      kilometraje: [data.kilometraje, [Validators.min(0)]],
      // Forzamos que se interprete la fecha como local añadiéndole 'T00:00:00'
      fecha_ultimo_servicio: [
        data.fecha_ultimo_servicio
          ? new Date(data.fecha_ultimo_servicio + 'T00:00:00')
          : null
      ]
    });    

    // Cargar la imagen actual para mostrar la vista previa inicial
    this.previewImage = data.imagen ? `http://localhost:8000/${data.imagen}` : null;

    // Agregamos el `id_cliente` automáticamente desde el `localStorage`.
    const clienteId = JSON.parse(localStorage.getItem('user') || '{}').id;
    this.vehiculoForm.patchValue({ id_cliente: clienteId });
  }

  ngOnInit(): void {
    // 1) Cargamos transmisiones y combustibles
    this.optionSvc.list().subscribe(opts => {
      this.transmissions = opts.transmissions;
      this.fuelTypes     = opts.fuel_types;
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.nuevaImagen = file;

      // Mostrar la vista previa de la nueva imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  guardarCambios(): void {
    // 1) Si el formulario no es válido, mostrar error y salir
    if (this.vehiculoForm.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Formulario Inválido',
        text: 'Por favor, revisa los campos e inténtalo nuevamente.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }

    // 2) Construir FormData
    const formData = new FormData();

    // 2a) Agregar todos los campos excepto la fecha
    Object.keys(this.vehiculoForm.value).forEach((key) => {
      if (key === 'fecha_ultimo_servicio') return;
      const value = this.vehiculoForm.value[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // 2b) Convertir y agregar la fecha en formato YYYY-MM-DD
    const fecha: Date | null = this.vehiculoForm.value.fecha_ultimo_servicio;
    if (fecha) {
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      formData.append('fecha_ultimo_servicio', `${yyyy}-${mm}-${dd}`);
    }

    // 2c) Si hay imagen nueva, agregarla
    if (this.nuevaImagen) {
      formData.append('imagen', this.nuevaImagen);
    }

    // 2d) Spoofear método PUT para que Laravel lo acepte junto a FormData
    formData.append('_method', 'PUT');

    // 3) Llamar al servicio
    this.vehiculoService.actualizarVehiculo(this.data.id_vehiculo, formData)
      .subscribe({
        next: (response) => {
          // 3a) Actualizar vista previa con la nueva URL de la imagen
          if (response.imagen) {
            this.previewImage = `http://localhost:8000/${response.imagen}?t=${Date.now()}`;
          }

          // 3b) Mensaje de éxito
          Swal.fire({
            icon: 'success',
            title: '¡Actualización Exitosa!',
            text: 'El vehículo se actualizó correctamente.',
            confirmButtonText: 'Aceptar',
          }).then(() => {
            this.dialogRef.close(true);
          });
        },
        error: (error) => {
          console.error('Error al actualizar el vehículo:', error);
          // 3c) Si Laravel devuelve validaciones, podemos mostrarlas aquí
          if (error.error?.errors) {
            const mensajes = Object.values(error.error.errors)
              .flat()
              .join('\n');
            Swal.fire({
              icon: 'error',
              title: 'Error de validación',
              text: mensajes,
              confirmButtonText: 'Aceptar',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Ocurrió un error al intentar actualizar el vehículo.',
              confirmButtonText: 'Aceptar',
            });
          }
        }
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}