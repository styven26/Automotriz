import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RepuestoService } from '../../../services/Repuesto/repuesto.service';
import { AuthService } from '../../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-crear-repuestos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,      
    MatFormFieldModule,
    MatInputModule,        
    MatButtonModule,          
    MatIconModule,            
  ],
  templateUrl: './crear-repuestos.component.html',
  styleUrls: ['./crear-repuestos.component.css']
})
export class CrearRepuestosComponent implements OnInit {
    
    repuestoForm!: FormGroup;
  
    rolActivo: string = 'Sin rol'; 
    roles: string[] = [];
  
    tiempoRestante: string = '';
  
    // Variables de usuario
    nombreUsuario: string = '';
    apellidoUsuario: string = '';
    showRepuestosMenu: boolean = false;
  
    constructor(private authService: AuthService, private fb: FormBuilder, private repuestoService: RepuestoService, private router: Router) {}
  
    // Funciones de navegación del menú
    navigateDashboard() {
      this.router.navigate(['/dashboard-vendedor']);
    }
    navigateCrearRepuestos() {
      this.router.navigate(['/crear-repuestos']);
    }
    navigateListarRepuestos() {
      this.router.navigate(['/listar-repuestos']);
    }
  
    ngOnInit(): void {
      this.roles     = this.authService.getRoles();
      this.rolActivo = sessionStorage.getItem('rol_activo') || '';
  
       const user = this.authService.getUser();
    
      this.nombreUsuario = user.nombre || 'Sin Nombre';
      this.apellidoUsuario = user.apellido || 'Sin Apellido';

      this.repuestoForm = this.fb.group({
        nombre:      ['', [Validators.required, Validators.maxLength(50)]],
        precio_base: [0,  [Validators.required, Validators.min(0)]],
        iva:         [0,  [Validators.required, Validators.min(0), Validators.max(100)]],
        stock:       [0,  [Validators.required, Validators.min(0)]],
        stock_minimo:[1,  [Validators.required, Validators.min(0)]],
      });

      this.iniciarReloj();
    }

   onSubmit(): void {
    if (this.repuestoForm.invalid) {
      console.warn('Formulario inválido:', this.repuestoForm.value);
      Swal.fire({
        icon: 'warning',
        title: 'Formulario inválido',
        text: 'Por favor completa todos los campos correctamente.'
      });
      return;
    }

    console.log('Enviando repuesto...', this.repuestoForm.value);
    this.repuestoService.create(this.repuestoForm.value)
      .subscribe({
        next: rep => {
          console.log('Repuesto creado exitosamente:', rep);
          Swal.fire({
            icon: 'success',
            title: '¡Repuesto Creado!',
            text: `El repuesto "${rep.nombre}" ha sido agregado correctamente.`
          }).then(() => {
            // Reset y redirige tras cerrar el alerta
            this.repuestoForm.reset({
              nombre: '',
              precio_base: 0,
              iva: 0,
              stock: 0,
              stock_minimo: 1
            });
            this.router.navigate(['/listar-repuestos']);
          });
        },
        error: err => {
          console.error('Error creando repuesto:', err);
          Swal.fire({
            icon: 'error',
            title: 'Error al crear',
            text: err?.error?.message || 'No se pudo crear el repuesto. Intenta de nuevo.'
          });
        }
      });
    }
  
    // dashboard-vendedor-repuestos.component.ts
    cambiarRol(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      const nuevoRol = selectElement.value;
  
      this.authService.cambiarRol(nuevoRol).subscribe({
        next: (response) => {
          console.log('Rol cambiado con éxito:', response);
          this.rolActivo = response.rol_activo;
          this.redirectUser(response.rol_activo);
        },
        error: (error) => {
          console.error('Error al cambiar de rol:', error);
        },
      });
    }
    
    private redirectUser(rolActivo: string): void {
      switch (rolActivo) {
        case 'admin':
          this.router.navigate(['/dashboard-admin']);
          break;
        case 'mecanico':
          this.router.navigate(['/dashboard-mecanico']);
          break;
        case 'vendedor':
          this.router.navigate(['/dashboard-vendedor']);
          break;
        case 'cliente':
          this.router.navigate(['/dashboard-clientes']);
          break;
        default:
          this.router.navigate(['/login']);
      }
    }
  
    iniciarReloj(): void {
      const expirationTime = Number(sessionStorage.getItem('token_expiration')) || 0;
  
      if (!expirationTime) {
        this.tiempoRestante = '00:00';
        this.logout();
        return;
      }
  
      const timer = setInterval(() => {
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = expirationTime - currentTime;
  
        if (remainingTime <= 0) {
          this.tiempoRestante = '00:00';
          clearInterval(timer); // Detiene el reloj
          this.logout(); // Redirige al login
        } else {
          this.tiempoRestante = this.formatearTiempo(remainingTime);
        }
      }, 1000);
    }
  
    formatearTiempo(segundos: number): string {
      const minutos = Math.floor(segundos / 60);
      const segundosRestantes = segundos % 60;
      return `${this.pad(minutos)}:${this.pad(segundosRestantes)}`;
    }
  
    pad(num: number): string {
      return num.toString().padStart(2, '0');
    }
  
    // Función de cierre de sesión
    logout(): void { 
      this.authService.logout(); // Llama al método de logout en AuthService
  
      this.router.navigate(['/login']).then(() => {
        window.location.reload(); // Recarga la página después de la redirección
      });
    }
  
    // Función para alternar los menús
    toggleMenu(menu: string): void {
      this.resetMenus(); // Cierra otros menús
      if (menu === 'repuestos') {
        this.showRepuestosMenu = !this.showRepuestosMenu;
      }
    }
  
    // Resetea todos los menús (ciérralos)
    resetMenus(): void {
      this.showRepuestosMenu = false;
    }
  }
  