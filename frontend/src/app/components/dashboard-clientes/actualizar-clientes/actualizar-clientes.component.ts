import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AdministradorService } from '../../../services/Administrador/administrador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actualizar-clientes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  templateUrl: './actualizar-clientes.component.html',
  styleUrls: ['./actualizar-clientes.component.css']
})
export class ActualizarClientesComponent {
  clienteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private adminService: AdministradorService,
    public dialogRef: MatDialogRef<ActualizarClientesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Si el teléfono viene con +593, lo quitamos
    let rawPhone = data.telefono || '';
    if (rawPhone.startsWith('+593')) {
      rawPhone = rawPhone.slice(4);
    }

    // 2) Convertir cadena "YYYY-MM-DD" a objeto Date
    let initialDate: Date | null = null;
    if (typeof data.fecha_nacimiento === 'string') {
      const [y, m, d] = data.fecha_nacimiento
        .split('-')
        .map((v: string) => parseInt(v, 10));   // ← aquí aclaramos (v: string)
      initialDate = new Date(y, m - 1, d);
    }

    this.clienteForm = this.fb.group({
      nombre: [
        data.nombre,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ],
      apellido: [
        data.apellido,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ],
      cedula: [
        data.cedula,
        [
          Validators.required,
          Validators.pattern(/^\d{10}$/),
          this.validateCedula()
        ]
      ],
      correo: [
        data.correo,
        [Validators.required, Validators.email]
      ],
      telefono: [
        rawPhone,
        [
          Validators.required,
          Validators.pattern(/^\d{9}$/)
        ]
      ],
      direccion_domicilio: [
        data.direccion_domicilio,
        [
          Validators.required,
          Validators.minLength(5)
        ]
      ],
      fecha_nacimiento: [
        initialDate,
        [Validators.required, this.validateAge(18)]
      ]
    });
  }

  // Facilitar acceso a controles
  get f(): { [key: string]: AbstractControl } {
    return this.clienteForm.controls;
  }

  guardarCambios(): void {
    if (this.clienteForm.invalid) return;

    const vals = this.clienteForm.value;
    // reconstruir teléfono
    vals.telefono = '+593' + vals.telefono;

    // formatear la fecha de vuelta a "YYYY-MM-DD"
    const fecha: any = this.clienteForm.get('fecha_nacimiento')!.value;
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      const y = fecha.getFullYear();
      const m = String(fecha.getMonth() + 1).padStart(2, '0');
      const d = String(fecha.getDate()).padStart(2, '0');
      vals.fecha_nacimiento = `${y}-${m}-${d}`;
    }

    // enviamos solo el objeto limpio
    this.dialogRef.close(vals);
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  // Validador de cédula ecuatoriana
  validateCedula() {
    return (control: AbstractControl) => {
      const ced = control.value;
      if (!this.validarCedulaEcuatoriana(ced)) {
        return { invalidCedula: true };
      }
      return null;
    };
  }

  validarCedulaEcuatoriana(ced: string): boolean {
    if (!/^\d{10}$/.test(ced)) return false;
    const region = +ced.slice(0, 2);
    if (region < 1 || region > 24) return false;
    const dígitos = ced.split('').map(n => +n);
    const último = dígitos.pop()!;
    const sum = dígitos.reduce((acc, v, i) => {
      let mv = v * (i % 2 === 0 ? 2 : 1);
      if (mv > 9) mv -= 9;
      return acc + mv;
    }, 0);
    const verif = (10 - (sum % 10)) % 10;
    return verif === último;
  }

  // Validador de edad mínima
  validateAge(minAge: number) {
    return (control: AbstractControl) => {
      const bd = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - bd.getFullYear();
      const m = today.getMonth() - bd.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
        age--;
      }
      return age >= minAge ? null : { underage: true };
    };
  }
}
