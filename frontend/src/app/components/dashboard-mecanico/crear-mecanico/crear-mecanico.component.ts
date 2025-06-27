import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; // Importar CommonModule para usar *ngIf
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // FormsModule y ReactiveFormsModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { AuthService } from '../../../services/auth.service';
import { AdministradorService } from '../../../services/Administrador/administrador.service';
import { MecanicoService } from '../../../services/Mecanico/mecanico.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-crear-mecanico',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatSelectModule,
        MatNativeDateModule,
        MatButtonModule,
        MatIconModule
    ],
    templateUrl: './crear-mecanico.component.html',
    styleUrls: ['./crear-mecanico.component.css']
})
export class CrearMecanicoComponent {

  constructor( private fb: FormBuilder, private http: HttpClient, private admin: AdministradorService, private router: Router, private authService: AuthService, private mecanicoService: MecanicoService ) {}

  sidebarActive: boolean = false;
  tiempoRestante: string = '';
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  filtrosCitas: any = { anio: '', mes: '' };
  filtrosIngresos: any = { anio: '', mes: '' };

  hidePassword: boolean = true;
  hideConfirmPassword: boolean = true;
  isSubmitting: boolean = false; // Control del estado de carga

  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showOrdenMenu: boolean = false;
  showReportes: boolean = false;

  // Rutas del Panel - Listar Mecanico
  navigateListarMecanico() {
    this.router.navigate(['/listar-mecanico']);
  }
  // Rutas del Panel - Dashboard Admin
  navigateDashboardAdmin() {
    this.router.navigate(['/dashboard-admin']);
  }
  // Rutas del Panel - Crear Mecanico
  navigateToCrearMecanico() {
    this.router.navigate(['/crear-mecanico']);
  }
  // Rutas del Panel - Crear Horario
  navigateToCrearHorario() {
    this.router.navigate(['/crear-horario']);
  }
  // Rutas del Panel - Listar Horario
  navigateToListarHorario() {
    this.router.navigate(['/listar-horario']);
  }
  navigateArgregarServicio(): void {
    this.router.navigate(['/crear-tipo']);
  }
  navigateListarServicio(): void {
    this.router.navigate(['/listar-tipo']);
  }
  navigateListarSubtipo(): void {
    this.router.navigate(['/listar-subtipo']);
  }
  navigateListarCitas(): void {
    this.router.navigate(['/citas-admin']);
  }
  navigateListarClientes(): void {
    this.router.navigate(['/listar-clientes']);
  }
  navigateListarOrden(): void {
    this.router.navigate(['/tipo-orden-servicio']);
  }

  // Lista de especialidades disponibles
  especialidades: string[] = [
    'Mecánico General'
  ];

  // Validaciones de cada campo
  registerForm!: FormGroup;

  ngOnInit(): void {

    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Usuario en localStorage después de parsear:', user);
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

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
      especialidad: ['', [Validators.required]], // Validación para especialidad
      fecha_nacimiento: ['', [Validators.required, this.validateAge(18)]],
      genero: ['', Validators.required],
      id_admin: [1, Validators.required],
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    this.iniciarReloj();
  }

  descargarCitasPDF(): void {
    this.admin.descargarReporteCitas(this.filtrosCitas);
  }

  descargarFinancieroPDF(): void {
    this.admin.descargarReporteFinanciero(this.filtrosIngresos);
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

  onSubmit(): void {
    if (this.registerForm.valid) {
      const formValues = this.registerForm.value;
  
      // Convertir fecha_nacimiento al formato YYYY-MM-DD
      const fechaNacimientoFormatted = new Date(formValues.fecha_nacimiento).toISOString().split('T')[0];
  
      const requestData = {
        ...formValues,
        fecha_nacimiento: fechaNacimientoFormatted, // Asignar la fecha formateada
        password_confirmation: formValues.confirmPassword, // Confirmación de contraseña
      };
  
      // Llamar al servicio para crear el mecánico
      this.mecanicoService.crearMecanico(requestData).subscribe(
        (response) => {
          // Mostrar mensaje de éxito
          Swal.fire({
            icon: 'success',
            title: 'Mecánico creado',
            text: 'El mecánico ha sido creado exitosamente.',
            showConfirmButton: true, // Mostrar el botón de confirmación
            confirmButtonText: 'OK', // Texto del botón
            customClass: {
              confirmButton: 'btn btn-success btn-rounded', // Personalizar el botón
            },
          });          
          this.router.navigate(['/listar-mecanico']); // Redirigir a una ruta de éxito
        },
        (error) => {
          this.handleError(error); // Manejo de errores
        }
      );
    }
  }  
  
  // Manejo de errores centralizado
  private handleError(error: any): void {
    console.error('Error al crear mecánico:', error);
  
    let errorMessage = 'Ocurrió un error al intentar crear el mecánico.';
  
    if (error.error) {
      // Manejo de errores específicos
      if (error.error.correo) {
        this.registerForm.get('correo')?.setErrors({ taken: true });
        errorMessage = 'El correo ya está registrado.';
      }
      if (error.error.cedula) {
        this.registerForm.get('cedula')?.setErrors({ taken: true });
        errorMessage = 'La cédula ya está registrada.';
      }
      if (error.error.password) {
        this.registerForm.get('password')?.setErrors({ required: true });
        errorMessage = 'La contraseña no cumple los requisitos.';
      }
    }
  
    // Mostrar mensaje de error
    Swal.fire({
      icon: 'error',
      title: 'Error al crear mecánico',
      text: errorMessage,
      showConfirmButton: true,
    });
  }  

  logout(): void { 
    this.authService.logout(); // Llama al método de logout en AuthService

    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Recarga la página después de la redirección
    });
  }

  // Validador para asegurar que las contraseñas coincidan
  passwordMatchValidator(form: FormGroup): any {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  // Validador para asegurarse de que la persona tenga al menos la edad mínima (18 años)
  validateAge(minimumAge: number) {
    return (control: AbstractControl): { [key: string]: boolean } | null => {
      const birthDate = new Date(control.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const isOldEnough = age > minimumAge || (age === minimumAge && today >= new Date(birthDate.setFullYear(birthDate.getFullYear() + minimumAge)));
      return isOldEnough ? null : { underage: true };
    };
  }

  // Métodos auxiliares para obtener los errores de validación
  get fechaNacimientoErrors() {
    const errors = this.registerForm.get('fecha_nacimiento')?.errors;
    if (errors?.['required']) {
      return 'La fecha de nacimiento es obligatoria.';
    } else if (errors?.['underage']) {
      return 'El mecánico debe tener al menos 18 años.';
    }
    return null;
  }

  get generoErrors() {
    const errors = this.registerForm.get('genero')?.errors;
    if (errors?.['required']) {
      return 'El género es obligatorio.';
    }
    return null;
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

  toggleMenu(menu: string): void {
    this.resetMenus(); // Cierra otros menús
    if (menu === 'mecanicos') {
      this.showMecanicosMenu = !this.showMecanicosMenu;
    } else if (menu === 'horarios') {
      this.showHorariosMenu = !this.showHorariosMenu;
    } else if (menu === 'tipos') {
        this.showTiposnMenu = !this.showTiposnMenu;
    } else if (menu === 'reportes') {
      this.showReportes = !this.showReportes;
    } else if (menu === 'subtipos') {
      this.showSubtiposnMenu = !this.showSubtiposnMenu;
    } else if (menu === 'citas') {
      this.showCitasMenu = !this.showCitasMenu;
    } else if (menu === 'configuracion') {
      this.showConfiguracionMenu = !this.showConfiguracionMenu;
    } else if (menu === 'clientes') {
      this.showClientesMenu= !this.showClientesMenu;
    } else if (menu === 'orden') {
      this.showOrdenMenu= !this.showOrdenMenu;
    } 
  }

  resetMenus(): void {
    this.showMecanicosMenu = false;
    this.showClientesMenu = false;
    this.showHorariosMenu = false;
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showOrdenMenu = false;
    this.showSubtiposnMenu = false;
    this.showReportes = false;
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

  // Método auxiliar para mostrar los errores de la especialidad
  get especialidadErrors() {
    const errors = this.registerForm.get('especialidad')?.errors;
    if (errors?.['required']) {
      return 'La especialidad es obligatoria.';
    }
    return null;
  }
}