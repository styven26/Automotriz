import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-password-reset-confirm',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './password-reset-confirm.component.html',
  styleUrls: ['./password-reset-confirm.component.css']
})
export class PasswordResetConfirmComponent {
  resetForm: FormGroup;
  token: string | null;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token'); // Captura el token desde la URL
    this.resetForm = this.fb.group(
      {
        password: [
          '', 
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/) // Contraseña fuerte
          ]
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validator: this.passwordsMatch }
    );
  }

  onSubmit(): void { 
    if (this.resetForm.valid && this.token) {
      const data = {
        token: this.token,
        password: this.resetForm.value.password,
        password_confirmation: this.resetForm.value.confirmPassword,
      };

      this.authService.resetPassword(data).subscribe({
        next: () => {
          // Mensaje de éxito
          Swal.fire({
            position: 'top', // Posiciona el mensaje en la parte superior
            icon: 'success',
            title: '¡Contraseña Restablecida!',
            text: 'Tu contraseña se ha restablecido correctamente. Ahora puedes iniciar sesión.',
            confirmButtonText: 'Ir al inicio de sesión',
            timer: 5000,
          }).then(() => {
            this.router.navigate(['/login']); // Redirige al login después del éxito
          });
        },
        error: (err) => {
          // Mensaje de error
          Swal.fire({
            position: 'top', // Posiciona el mensaje en la parte superior
            icon: 'error',
            title: 'Error',
            text: 'No se pudo restablecer la contraseña. Verifica el token e intenta nuevamente.',
            confirmButtonText: 'Cerrar',
          });
          console.error('Error al restablecer la contraseña:', err);
        },
      });
    } else {
      // Mensaje si el formulario es inválido
      Swal.fire({
        position: 'top', // Posiciona el mensaje en la parte superior
        icon: 'warning',
        title: 'Formulario Inválido',
        text: 'Por favor, completa todos los campos correctamente antes de enviar.',
        confirmButtonText: 'Cerrar',
      });
    }
  }

  passwordsMatch(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { mismatch: true };
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
