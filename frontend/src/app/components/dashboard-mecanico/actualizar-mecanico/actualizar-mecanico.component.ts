import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
  especialidades: string[] = ['Mecánico General'];
  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;

  constructor(
    private fb: FormBuilder,
    private mecanicoService: MecanicoService,
    public dialogRef: MatDialogRef<ActualizarMecanicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // 1. Si el teléfono tiene +593, se lo quitamos para que el control solo tenga 9 dígitos
    let rawPhone = data.telefono || '';
    if (rawPhone.startsWith('+593')) {
      rawPhone = rawPhone.slice(4); // Elimina los primeros 4 caracteres (+593)
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
      especialidad: [data.especialidad, [Validators.required]],
      fecha_nacimiento: [
        data.fecha_nacimiento,
        [Validators.required, this.validateAge(18)]
      ],
      genero: [data.genero, [Validators.required]],
      id_admin: [data.id_admin || 1, Validators.required],
    });
  }  

  guardarCambios(): void {
    if (this.mecanicoForm.valid) {
      // 1. Obtenemos los datos del formulario
      const formValues = this.mecanicoForm.value;
  
      // 2. Concatenamos +593 al teléfono
      const telefonoCompleto = '+593' + formValues.telefono;
  
      // 3. Creamos el objeto final a enviar
      const datosActualizados = {
        ...formValues,
        telefono: telefonoCompleto
      };
  
      // 4. Llamamos al servicio
      this.mecanicoService.actualizarMecanico(this.data.cedula, datosActualizados).subscribe(
        response => {
          Swal.fire({
            icon: 'success',
            title: '¡Mecánico actualizado!',
            text: 'El mecánico se ha actualizado con éxito.',
            confirmButtonText: 'OK',
            customClass: {
              confirmButton: 'btn btn-success btn-rounded'
            },
            buttonsStyling: false
          });
          this.dialogRef.close(this.mecanicoForm.value);
        },
        error => {
          // Verificamos si el backend nos envía algo como: error.error.cedula
          if (error.error && error.error.cedula) {
            // Marcamos el control 'cedula' con el error 'taken'
            this.mecanicoForm.get('cedula')?.setErrors({ taken: true });
          }
  
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al actualizar el mecánico.',
            confirmButtonText: 'Cerrar',
            customClass: {
              confirmButton: 'btn btn-danger'
            },
            buttonsStyling: false
          });
        }
      );
    }
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
