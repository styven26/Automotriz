import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent {
  resetForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.resetForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void { 
    if (this.resetForm.valid) {
      this.authService.sendResetLink(this.resetForm.value).subscribe({
        next: () => {
          // Mensaje de éxito
          Swal.fire({
            position: 'top', // Posiciona el mensaje en la parte superior
            icon: 'success',
            title: 'Correo enviado',
            text: 'Enlace de recuperación enviado. Revisa tu Gmail.',
            confirmButtonText: 'Entendido',
            timer: 5000,
          }).then(() => {
            this.router.navigate(['/login']); // Redirige al login después del éxito
          });
        },
        error: (err: any) => {
          // Mensaje de error
          Swal.fire({
            position: 'top', // Posiciona el mensaje en la parte superior
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar el correo. Intenta nuevamente.',
            confirmButtonText: 'Cerrar',
          });
          console.error('Error al enviar el correo:', err);
        }
      });
    } else {
      // Mensaje de validación de formulario
      Swal.fire({
        position: 'top', // Posiciona el mensaje en la parte superior
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor, ingresa un correo electrónico válido.',
        confirmButtonText: 'Cerrar',
      });
    }
  }  

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
