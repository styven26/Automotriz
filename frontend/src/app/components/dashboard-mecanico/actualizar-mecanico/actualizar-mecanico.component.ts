import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OptionService, OptionItem, OptionsResponse } from '../../../services/option.service';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MecanicoService } from '../../../services/Mecanico/mecanico.service';
import { MatDatepickerModule } from '@angular/material/datepicker';     // <-- IMPORTANTE
import { MatNativeDateModule } from '@angular/material/core'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actualizar-mecanico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './actualizar-mecanico.component.html',
  styleUrls: ['./actualizar-mecanico.component.css']
})
export class ActualizarMecanicoComponent {
  mecanicoForm: FormGroup;
  especialidades: OptionItem[] = [];
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private mecanicoService: MecanicoService,
    private optionSvc: OptionService,
    public dialogRef: MatDialogRef<ActualizarMecanicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // 1. Si el teléfono tiene +593, se lo quitamos para que el control solo tenga 9 dígitos
    let rawPhone = data.telefono || '';
    if (rawPhone.startsWith('+593')) {
      rawPhone = rawPhone.slice(4); // Elimina los primeros 4 caracteres (+593)
    }

    // 2) Convertir string "YYYY-MM-DD" a Date para el datepicker
    let initialDate: Date | null = null;
    if (typeof data.fecha_nacimiento === 'string') {
      const [y, m, d] = data.fecha_nacimiento
        .split('-')
        .map((v: string) => parseInt(v, 10));   // ← aquí aclaramos (v: string)
      initialDate = new Date(y, m - 1, d);
    }
  
    this.mecanicoForm = this.fb.group({
      nombre: [
        data.nombre,
        [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]
      ],
      apellido: [
        data.apellido,
        [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]
      ],
      cedula: [
        data.cedula,
        [Validators.required, Validators.pattern(/^\d{10}$/), this.validateCedula()]
      ],
      correo: [data.correo, [Validators.required, Validators.email]],
  
      // Aquí usamos rawPhone en lugar de data.telefono
      telefono: [
        rawPhone,
        [Validators.required, Validators.pattern(/^\d{9}$/)]
      ],
  
      direccion_domicilio: [
        data.direccion_domicilio,
        [Validators.required, Validators.minLength(5)]
      ],
      especialidad: [ data.especialidad, [ Validators.required ] ],
      fecha_nacimiento: [ initialDate, [Validators.required, this.validateAge(18)] ],
      genero: [data.genero, [Validators.required]],
      id_admin: [data.id_admin || 1, Validators.required],
    });
  }  

  ngOnInit() {
    this.optionSvc.list().subscribe(resp => {
      this.especialidades = resp.especialidades;
      // ¡el formControl ya trae data.especialidad (el nombre) y coincide con [value]="esp.name"!
    });
  }

  get f(): Record<string, AbstractControl> {
    return this.mecanicoForm.controls;
  }

  guardarCambios(): void {
    if (this.mecanicoForm.invalid) return;

    const vals = this.mecanicoForm.value;

    // Reconstruir teléfono
    const telefonoCompleto = '+593' + vals.telefono;

    // Formatear fecha a "YYYY-MM-DD"
    const fechaControl = vals.fecha_nacimiento;
    let fechaString = '';
    if (fechaControl instanceof Date && !isNaN(fechaControl.getTime())) {
      const y = fechaControl.getFullYear();
      const m = String(fechaControl.getMonth() + 1).padStart(2, '0');
      const d = String(fechaControl.getDate()).padStart(2, '0');
      fechaString = `${y}-${m}-${d}`;
    }

    // Objeto final
    const datosActualizados = {
      ...vals,
      telefono: telefonoCompleto,
      fecha_nacimiento: fechaString
    };

    this.mecanicoService
      .actualizarMecanico(this.data.cedula, datosActualizados)
      .subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: '¡Mecánico actualizado!',
            text: 'Los datos se guardaron correctamente.',
            confirmButtonText: 'OK',
            customClass: { confirmButton: 'btn btn-success btn-rounded' },
            buttonsStyling: false
          });
          this.dialogRef.close(datosActualizados);
        },
        error: err => {
          if (err.error?.cedula) {
            this.f['cedula'].setErrors({ taken: true });
          }
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error?.message || 'No se pudo actualizar el mecánico.',
            confirmButtonText: 'Cerrar',
            customClass: { confirmButton: 'btn btn-danger btn-rounded' },
            buttonsStyling: false
          });
        }
      });
  } 

  cancelar(): void {
    this.dialogRef.close();
  }

  // Validador para la cédula ecuatoriana
  validateCedula() {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const cedula = control.value;
      if (!this.validarCedulaEcuatoriana(cedula)) {
        return { invalidCedula: true };
      }
      return null;
    };
  }

  validarCedulaEcuatoriana(cedula: string): boolean {
    if (cedula.length !== 10) return false;
    const digitoRegion = parseInt(cedula.substring(0, 2));
    if (digitoRegion < 1 || digitoRegion > 24) return false;
    const digitos = cedula.split('').map(Number);
    const ultimoDigito = digitos.pop() as number;
    const suma = digitos.reduce((acc, valor, indice) => {
      if (indice % 2 === 0) {
        valor *= 2;
        if (valor > 9) valor -= 9;
      }
      return acc + valor;
    }, 0);
    const verificador = (10 - (suma % 10)) % 10;
    return verificador === ultimoDigito;
  }

  // Validador para la edad mínima
  validateAge(minimumAge: number) {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const birthDate = new Date(control.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const isOldEnough =
        age > minimumAge ||
        (age === minimumAge &&
          today >= new Date(birthDate.setFullYear(birthDate.getFullYear() + minimumAge)));
      return isOldEnough ? null : { underage: true };
    };
  }
}
