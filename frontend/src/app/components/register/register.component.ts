import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';  
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import moment from 'moment'; // Asegúrate de instalar moment.js para manejar fechas
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';  // Para que funcione el selector de fecha

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    CommonModule, 
    ReactiveFormsModule,  
    RouterModule, 
    HttpClientModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule,
    MatDatepickerModule,   // Agregar el Datepicker
    MatNativeDateModule
  ]
})

export class RegisterComponent {

  hidePassword = true;
  hideConfirmPassword = true;
  
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)  // Solo letras y espacios
      ]],
      apellido: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)  // Solo letras y espacios
      ]],
      cedula: ['', [
        Validators.required, 
        Validators.pattern(/^\d{10}$/), // Validar que sean 10 dígitos
        this.validateCedula()  // Validación personalizada para la cédula ecuatoriana
      ]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: ['', [
        Validators.required, 
        Validators.pattern(/^\d{9}$/)  // Validar solo 9 dígitos
      ]],
      direccion_domicilio: ['', [
        Validators.required,
        Validators.minLength(5)  // Validar que la dirección tenga al menos 5 caracteres
      ]],
      fecha_nacimiento: ['', [
        Validators.required,
        this.validateAge  // Validación personalizada para la edad mínima de 18 años
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Validador para asegurar que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup): any {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Validador personalizado para la edad mínima (mayor de 18 años)
  validateAge(control: any): { [key: string]: boolean } | null {
    const fechaNacimiento = moment(control.value);
    const edadMinima = moment().subtract(18, 'years');
    return fechaNacimiento.isAfter(edadMinima) ? { ageInvalid: true } : null;
  }

  onSubmit(): void { 
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();  // Marcar todos los campos como tocados si el formulario es inválido
      return;  // Detener la ejecución si el formulario no es válido
    }
    
    const { nombre, apellido, correo, password, fecha_nacimiento } = this.registerForm.value;
    const cedula = this.registerForm.get('cedula')?.value;
    const telefono = this.registerForm.get('telefono')?.value;
    const direccion_domicilio = this.registerForm.get('direccion_domicilio')?.value;

    // Llamar al servicio AuthService para enviar los datos al backend
    this.authService.register({
      nombre,
      apellido,
      correo,
      cedula,
      telefono,
      direccion_domicilio,
      password,
      password_confirmation: this.registerForm.get('confirmPassword')?.value,  // Laravel requiere confirmación
      fecha_nacimiento
    }).subscribe(
      response => {
        console.log('Usuario registrado con éxito:', response);
        this.router.navigate(['/login']);
      },
      error => {
        console.log('Error en el registro:', error);
        // Detectar si el error es que el correo ya existe
        if (error.error?.correo) {
          this.registerForm.get('correo')?.setErrors({ taken: true });
        }
        // Detectar si el error es que la cédula ya existe
        if (error.error?.cedula) {
          this.registerForm.get('cedula')?.setErrors({ taken: true });
        }
        if (error.error?.password) {
          this.registerForm.get('password')?.setErrors({ required: true });
        }
      }
    );
  }

  // Validador personalizado para la cédula ecuatoriana
  validateCedula(): any {
    return (control: any): { [key: string]: boolean } | null => {
      const cedula = control.value;
      if (!this.validarCedulaEcuatoriana(cedula)) {
        return { invalidCedula: true };
      }
      return null;
    };
  }
  
  // Validación de la cédula ecuatoriana
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

  // Método auxiliar para mostrar los mensajes de error de la cédula
  get cedulaErrors() {
    const errors = this.registerForm.get('cedula')?.errors;
    if (errors?.['required']) {
      return 'La cédula es obligatoria.';
    } else if (errors?.['pattern']) {
      return 'La cédula debe tener 10 dígitos.';
    }
    return null;
  }

  // Método auxiliar para mostrar los mensajes de error del campo `fecha_nacimiento`
  get fechaNacimientoErrors() {
    const errors = this.registerForm.get('fecha_nacimiento')?.errors;
    if (errors?.['required']) {
      return 'La fecha de nacimiento es obligatoria.';
    } else if (errors?.['ageInvalid']) {
      return 'Debes tener al menos 18 años para registrarte.';
    }
    return null;
  }

  // Método auxiliar para mostrar los mensajes de error del teléfono
  get phoneErrors() {
    const errors = this.registerForm.get('telefono')?.errors;
    if (errors?.['required']) {
      return 'El número de teléfono es obligatorio.';
    } else if (errors?.['pattern']) {
      return 'El número de teléfono debe contener solo 9 dígitos.';
    }
    return null;
  }

  // Método auxiliar para mostrar los mensajes de error del nombre
  get nameErrors() {
    const errors = this.registerForm.get('nombre')?.errors;
    if (errors?.['required']) {
      return 'El nombre es obligatorio.';
    } else if (errors?.['pattern']) {
      return 'El nombre solo puede contener letras y espacios.';
    } else if (errors?.['minlength']) {
      return 'El nombre debe tener al menos 3 caracteres.';
    }
    return null;
  }

  // Método auxiliar para mostrar los mensajes de error del apellido
  get lastNameErrors() {
    const errors = this.registerForm.get('apellido')?.errors;
    if (errors?.['required']) {
      return 'El apellido es obligatorio.';
    } else if (errors?.['pattern']) {
      return 'El apellido solo puede contener letras y espacios.';
    } else if (errors?.['minlength']) {
      return 'El apellido debe tener al menos 3 caracteres.';
    }
    return null;
  }

  // Método auxiliar para mostrar los mensajes de error de la dirección
  get direccionErrors() {
    const errors = this.registerForm.get('direccion_domicilio')?.errors;
    if (errors?.['required']) {
      return 'La dirección es obligatoria.';
    } else if (errors?.['minlength']) {
      return 'La dirección debe tener al menos 5 caracteres.';
    }
    return null;
  }

  // Método auxiliar para mostrar los mensajes de error de las contraseñas
  get passwordErrors() {
    const errors = this.registerForm.get('password')?.errors;
    if (errors?.['required']) {
      return 'La contraseña es obligatoria.';
    } else if (errors?.['minlength']) {
      return 'La contraseña debe tener al menos 8 caracteres.';
    } else if (errors?.['pattern']) {
      return 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.';
    }
    return null;
  }

  get confirmPasswordErrors() {
    const errors = this.registerForm.errors;
    if (errors?.['mismatch']) {
      return 'Las contraseñas no coinciden.';
    }
    return null;
  }
}
