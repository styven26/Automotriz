import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VehiculoService } from '../../services/Vehiculo/vehiculo.service';
import { ReactiveFormsModule } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepperModule } from '@angular/material/stepper';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule, NativeDateAdapter } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-citas',
    standalone: true,
    imports: [
        CommonModule,
        MatTreeModule,
        MatIconModule,
        MatDatepickerModule,
        MatNativeDateModule, 
        MatButtonModule,
        MatProgressBarModule,
        MatStepperModule,
        FormsModule,
        MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule
    ],
    templateUrl: './citas.component.html',
    styleUrls: ['./citas.component.css'],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { showError: true },
        },
        {
          provide: NativeDateAdapter, useClass: NativeDateAdapter // <-- Añadir esto
        }
    ]
})
export class CitasComponent implements OnInit {

  previewImage: string | null = null; // Propiedad para la URL de la imagen seleccionada

  // Variables de usuario
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  tiempoRestante: string = '';
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  // Datos del dashboard
  appointmentsCount: number = 0;
  newPatientsCount: number = 0;
  operationsCount: number = 0;
  earnings: number = 0;

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showHistorialMenu: boolean = false;
  showMonitoreoMenu: boolean = false;

  // Control de formularios
  vehicleFormGroup: FormGroup;
  registered = false;      // ← Nueva bandera

  constructor(
    private vehiculoService: VehiculoService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.vehicleFormGroup = this.fb.group({
      id_cliente: [null, Validators.required], // Asociar el cliente autenticado
      marca: ['', Validators.required],
      modelo: ['', Validators.required],
      anio: ['', [Validators.required, Validators.min(1886), Validators.max(new Date().getFullYear())]],
      numero_placa: ['', Validators.required],
      transmision: ['Manual', Validators.required], // Transmisión por defecto
      kilometraje: [null, [Validators.min(0)]],
      fecha_ultimo_servicio: [null],
      tipo_combustible: ['Gasolina', Validators.required], // Tipo de combustible por defecto
      imagen: [null] // Para manejar la imagen cargada
    });        
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result as string; // Guardar la vista previa
      };
      reader.readAsDataURL(file);
  
      this.vehicleFormGroup.patchValue({
        imagen: file,
      });
    }
  }

  ngOnInit(): void {
    this.roles = JSON.parse(sessionStorage.getItem('roles') ?? '[]');
    this.rolActivo = sessionStorage.getItem('rol_activo') ?? '';
    
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    console.log('Usuario autenticado:', user);
  
    if (!user.id) {
      console.error('El id_cliente no existe en sessionStorage.');
      return;
    }
  
    // Asigna el id_cliente al formulario
    this.vehicleFormGroup.patchValue({ id_cliente: user.id });
    console.log('id_cliente asignado al formulario:', user.id);
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';
    this.iniciarReloj();
  }  

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
      case 'cliente':
        this.router.navigate(['/dashboard-clientes']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }

  registrarVehiculo(stepper: any): void {
    // Obtener el usuario autenticado desde sessionStorage
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
    // Verificar que el usuario esté autenticado
    if (!user.id) {
      console.error('Error: id_cliente no encontrado en sessionStorage.');
      Swal.fire({
        icon: 'error',
        title: 'Error de autenticación',
        text: 'No se encontró el cliente autenticado. Por favor, inicia sesión nuevamente.',
        confirmButtonText: 'Aceptar',
      });
      return;
    }
  
    // Asignar el id_cliente al formulario
    this.vehicleFormGroup.patchValue({ id_cliente: user.id });
  
    // Validar el formulario antes de enviar los datos
    if (this.vehicleFormGroup.valid) {
      // Crear un objeto FormData para manejar el envío del archivo
      const formData = new FormData();

      // Preparamos la fecha_ultimo_servicio para que sea 'YYYY-MM-DD'
      let fechaRaw = this.vehicleFormGroup.value.fecha_ultimo_servicio;
      if (fechaRaw) {
        // Convierte a objeto Date y a formato 'YYYY-MM-DD'
        const dateObj = new Date(fechaRaw);
        const isoString = dateObj.toISOString().split('T')[0]; 
        this.vehicleFormGroup.patchValue({ fecha_ultimo_servicio: isoString });
      }

      Object.keys(this.vehicleFormGroup.value).forEach((key) => {
        const value = this.vehicleFormGroup.value[key];
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });
  
      // Llamar al servicio para registrar el vehículo
      this.vehiculoService.crearVehiculo(formData).subscribe(
        (response) => {
          console.log('Vehículo registrado exitosamente:', response);
          this.registered = true;      // ← marcamos registro completo            
          stepper.next();
        },
        (error) => {
          console.error('Error al registrar el vehículo:', error);
  
          // Manejar errores específicos del servidor
          if (error.status === 422 && error.error.errors?.numero_placa) {
            Swal.fire({
              icon: 'error',
              title: 'Placa Duplicada',
              text: 'La placa ingresada ya está registrada. Por favor, elige otra.',
              confirmButtonText: 'Aceptar',
            });
          } else if (error.status === 400) {
            Swal.fire({
              icon: 'error',
              title: 'Error de Validación',
              text: 'Por favor, revisa los datos ingresados.',
              confirmButtonText: 'Aceptar',
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error Desconocido',
              text: 'Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.',
              confirmButtonText: 'Aceptar',
            });
          }
        }
      );
    } else {
      // Si el formulario no es válido, mostrar errores en la consola y al usuario
      console.log('Formulario no válido, revisa los errores.');
      Object.keys(this.vehicleFormGroup.controls).forEach((key) => {
        const controlErrors = this.vehicleFormGroup.get(key)?.errors;
        if (controlErrors) {
          console.error(`Error en el campo "${key}":`, controlErrors);
        }
      });
  
      Swal.fire({
        icon: 'error',
        title: 'Formulario Inválido',
        text: 'Por favor, completa todos los campos correctamente antes de enviar.',
        confirmButtonText: 'Aceptar',
      });
    }
  }  

  finalizarRegistro(): void {
    this.router.navigate(['/calendario']);  // Navega al dashboard del cliente después de registrar
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
    if (menu === 'mecanicos') {
      this.showMecanicosMenu = !this.showMecanicosMenu;
    } else if (menu === 'clientes') {
      this.showClientesMenu = !this.showClientesMenu;
    } else if (menu === 'citas') {
      this.showCitasMenu = !this.showCitasMenu;
    } else if (menu === 'monitoreo') {
      this.showMonitoreoMenu = !this.showMonitoreoMenu;
    } else if (menu === 'historial') {
      this.showHistorialMenu = !this.showHistorialMenu;
    } else if (menu === 'configuracion') {
      this.showConfiguracionMenu = !this.showConfiguracionMenu;
    }
  }

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showMecanicosMenu = false;
    this.showClientesMenu = false;
    this.showCitasMenu = false;
    this.showHistorialMenu = false;
    this.showConfiguracionMenu = false;
    this.showMonitoreoMenu = false;
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

  verificarPlaca(): void {
    const numeroPlaca = this.vehicleFormGroup.get('numero_placa')?.value;
  
    if (!numeroPlaca) {
      return; // No realiza la verificación si no hay valor ingresado
    }
  
    this.vehiculoService.verificarPlaca(numeroPlaca).subscribe(
      (response) => {
        if (response.existe) {
          Swal.fire({
            icon: 'error',
            title: 'Placa ya registrada',
            text: 'El número de placa ingresado ya existe. Por favor, usa otro.',
            confirmButtonText: 'Aceptar',
          });
        }
      },
      (error) => {
        console.error('Error al verificar la placa:', error);
      }
    );
  }    

  navigateDashboarCliente(): void {
    this.router.navigate(['/dashboard-clientes']);
  }
  navigateCitas(): void {
    this.router.navigate(['/calendario']);
  }
  navigateVehiculoCliente() {
    this.router.navigate(['/registrar-vehiculo']);
  }
  navigateListarVehiculos() {
    this.router.navigate(['/listar-vehiculo']);
  }
  navigateMonitoreo() {
    this.router.navigate(['/monitoreo']);
  }
  navigateHistorial() {
    this.router.navigate(['/historial']);
  }
}