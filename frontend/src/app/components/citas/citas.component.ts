import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VehiculoService } from '../../services/Vehiculo/vehiculo.service';
import { OptionService } from '../../services/option.service';
import { ReactiveFormsModule } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepperModule, MatStepper  } from '@angular/material/stepper';
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
        MatStepper,
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
  sidebarActive: boolean = false;
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  tiempoRestante: string = '';
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  transmissions: {id:string,name:string}[] = [];
  fuelTypes:    {id:string,name:string}[] = [];

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
    private optionSvc: OptionService,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.vehicleFormGroup = this.fb.group({
      id_cliente: [null, Validators.required],
      marca: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
      ]],
      modelo: ['', [
        Validators.required,
        Validators.pattern(/^[A-Za-z0-9\s]+$/)
      ]],
      anio: ['', [
        Validators.required,
        Validators.min(1886),
        Validators.max(new Date().getFullYear())
      ]],
      numero_placa: ['', [
        Validators.required,
        Validators.pattern(/^[A-Z0-9\-]+$/)
      ]],
      transmision: [Validators.required],
      tipo_combustible: [Validators.required],
      kilometraje: [null, [
        Validators.required,
        Validators.min(0)
      ]],
      fecha_ultimo_servicio: [null, Validators.required],
      imagen: [null, Validators.required]
    });       
  }

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario autenticado:', user);
  
    if (!user.id) {
      console.error('El id_cliente no existe en localStorage.');
      return;
    }

    this.optionSvc.list().subscribe(opts => {
      this.transmissions = opts.transmissions;
      this.fuelTypes    = opts.fuel_types;
    });
  
    // Asigna el id_cliente al formulario
    this.vehicleFormGroup.patchValue({ id_cliente: user.id });
    console.log('id_cliente asignado al formulario:', user.id);
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';
    this.iniciarReloj();
  }  

  // getters para el template
  get marca(): AbstractControl { return this.vehicleFormGroup.get('marca')!; }
  get modelo(): AbstractControl { return this.vehicleFormGroup.get('modelo')!; }
  get anio(): AbstractControl { return this.vehicleFormGroup.get('anio')!; }
  get numero_placa(): AbstractControl { return this.vehicleFormGroup.get('numero_placa')!; }
  get kilometraje(): AbstractControl { return this.vehicleFormGroup.get('kilometraje')!; }
  get fecha_ultimo_servicio(): AbstractControl { return this.vehicleFormGroup.get('fecha_ultimo_servicio')!;}
  get imagen(): AbstractControl { return this.vehicleFormGroup.get('imagen')!; }

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

  registrarVehiculo(stepper: MatStepper): void {
  // 1) Si el formulario es inválido, marcamos todo como touched para mostrar errores y salimos
  if (this.vehicleFormGroup.invalid) {
    this.vehicleFormGroup.markAllAsTouched();
    Swal.fire({
      icon: 'error',
      title: 'Formulario Inválido',
      text: 'Por favor, completa correctamente todos los campos antes de registrar.',
      confirmButtonText: 'Entendido'
    });
    return;
  }

  // 2) Nos aseguramos de que hay un usuario autenticado
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    console.error('Error: id_cliente no encontrado en localStorage.');
    Swal.fire({
      icon: 'error',
      title: 'Error de autenticación',
      text: 'No se encontró el cliente autenticado. Por favor, inicia sesión nuevamente.',
      confirmButtonText: 'Aceptar'
    });
    return;
  }
  this.vehicleFormGroup.patchValue({ id_cliente: user.id });

  // 3) Diálogo de confirmación para registrar o volver a editar
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Revisa bien los datos antes de registrar el vehículo.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Registrar',
    cancelButtonText: 'Editar'
  }).then(result => {
    if (!result.isConfirmed) {
      // El usuario eligió "Editar", no continuamos
      return;
    }

    // 4) Preparamos FormData con todos los campos (incluida la imagen y la fecha formateada)
    const formData = new FormData();
    // Convertir fecha a 'YYYY-MM-DD'
    const rawDate = this.vehicleFormGroup.value.fecha_ultimo_servicio;
    if (rawDate) {
      const iso = new Date(rawDate).toISOString().split('T')[0];
      this.vehicleFormGroup.patchValue({ fecha_ultimo_servicio: iso });
    }

    Object.entries(this.vehicleFormGroup.value).forEach(([key, val]) => {
      if (val === null || val === undefined) return;

      if (val instanceof File) {
        // imagen u otros archivos
        formData.append(key, val, val.name);
      } else {
        // todo lo demás lo convertimos a string
        formData.append(key, val.toString());
      }
    });

    // 5) Llamada al servicio
    this.vehiculoService.crearVehiculo(formData).subscribe({
      next: response => {
        console.log('Vehículo registrado exitosamente:', response);
        this.registered = true;     // Deshabilita edición
        stepper.next();             // Avanza al siguiente paso
      },
      error: err => {
        console.error('Error al registrar el vehículo:', err);
        // Gestión de errores específicos
        if (err.status === 422 && err.error.errors?.numero_placa) {
          Swal.fire({
            icon: 'error',
            title: 'Placa duplicada',
            text: 'La placa ingresada ya está registrada. Elige otra.',
            confirmButtonText: 'Aceptar'
          });
        } else if (err.status === 400) {
          Swal.fire({
            icon: 'error',
            title: 'Error de validación',
            text: 'Por favor, revisa los datos ingresados.',
            confirmButtonText: 'Aceptar'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error desconocido',
            text: 'Ocurrió un error inesperado. Intenta nuevamente más tarde.',
            confirmButtonText: 'Aceptar'
          });
        }
      }
    });
  });
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
    const expirationTime = Number(localStorage.getItem('token_expiration')) || 0;

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