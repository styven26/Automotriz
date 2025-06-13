import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SubtipoService } from '../../services/Subtiposervicios/subtipo.service'; // Importa el servicio
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule } from '@angular/material/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { TiposService } from '../../services/Tiposervicios/tipos.service'; // define interfaz si quieres
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tipos-servicios',
  standalone: true,
  imports: [CommonModule, MatTreeModule, MatIconModule, MatSelectModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatFormFieldModule, MatProgressBarModule],
  templateUrl: './tipos-servicios.component.html',
  styleUrls: ['./tipos-servicios.component.css']
})
export class TiposServiciosComponent implements OnInit {
  
  // Variables de usuario
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  tiempoRestante: string = '';
  precioFinal: number = 0;

  // Formulario de creación
  tipoSubtipoForm: FormGroup; // Un solo formulario para tipo y subtipo
  tiposExistentes: any[] = []; // Lista de tipos de servicios existentes

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;
  showHorariosMenu: boolean = false;
  showOrdenMenu: boolean = false;

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder,
    private tiposService: TiposService,
    private subtipoService: SubtipoService
  ) {
    // Combinar los controles en un solo formulario reactivo
    this.tipoSubtipoForm = this.fb.group({
      id_servicio: [null], // Si es null, se creará un nuevo servicio
      id_tipo:     [null, Validators.required],  // <— nuevo control
      nombre: ['', Validators.required],         // Campo para el nombre del servicio
      descripcion: ['', Validators.required],      // Campo para la descripción del servicio
      precio_base: ['', [Validators.required, Validators.min(0)]],
      iva: [
        '',
        [
          Validators.required,
          Validators.min(0),
          Validators.max(20),
          Validators.pattern(/^\d+$/)
        ]
      ],
      precio: [{ value: 0, disabled: true }],
    });             
  }

  ngOnInit(): void {
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    this.tiposService.obtenerTiposServicios()
      .subscribe(
        list => this.tiposExistentes = list,
        err  => console.error('Error cargando tipos:', err)
    );

    this.tipoSubtipoForm.valueChanges.subscribe((values) => {
      const precioBase = parseFloat(values.precio_base) || 0;
      const iva = parseFloat(values.iva) || 0;
  
      // Calcular el precio final
      const precioFinal = precioBase + (precioBase * iva) / 100;
  
      // Actualizar el campo "precio" en el formulario
      this.tipoSubtipoForm.get('precio')?.setValue(precioFinal.toFixed(2), { emitEvent: false });
    });

    // Obtener datos del usuario del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
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

  guardarDatos(): void {
    if (this.tipoSubtipoForm.valid) {  
      const datos = {
        id_tipo:     this.tipoSubtipoForm.value.id_tipo,      // <— nuevo
        nombre:      this.tipoSubtipoForm.value.nombre,
        descripcion: this.tipoSubtipoForm.value.descripcion,
        precio_base: this.tipoSubtipoForm.value.precio_base,
        iva:         this.tipoSubtipoForm.value.iva,
        precio:      parseFloat(this.tipoSubtipoForm.get('precio')?.value),
      };
      
      if (this.tipoSubtipoForm.value.id_servicio !== null) {
        // Se seleccionó un servicio existente
        this.crearSubtipo(this.tipoSubtipoForm.value.id_servicio, datos);
      } else {
        // En lugar de solo crear "servicioData",
        // haz directamente la llamada al subtipoService
        this.subtipoService.crearSubtipoServicio(datos).subscribe(
          (respuesta) => {
            console.log('Servicio creado:', respuesta);
            Swal.fire({
              icon: 'success',
              title: '¡Datos guardados con éxito!',
              text: 'El servicio se ha guardado correctamente.',
              confirmButtonText: 'OK',
            }).then(() => {
              this.router.navigate(['/listar-subtipo']);
            });
          },
          (error) => {
            console.error('Error al crear el servicio:', error);
            Swal.fire('Error', 'Hubo un problema al guardar el servicio.', 'error');
          }
        );
      }
    } else {
      Swal.fire('Formulario inválido', 'Revisa los campos e inténtalo de nuevo.', 'error');
    }
  }          
      
  crearSubtipo(idTipo: number, datos: any): void {
    const subtipoData = {
      id_servicio: idTipo,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      precio_base: datos.precio_base,
      iva: datos.iva,
      precio: datos.precio
    };
  
    this.subtipoService.crearSubtipoServicio(subtipoData).subscribe(
      (subtipoRespuesta) => {
        console.log('Servicio creado:', subtipoRespuesta);
        Swal.fire({
          icon: 'success',
          title: '¡Datos guardados con éxito!',
          text: 'El servicio se ha guardado correctamente.',
          confirmButtonText: 'OK',
          customClass: {
            confirmButton: 'btn btn-success btn-rounded',
          },
          buttonsStyling: false,
        }).then(() => {
          this.router.navigate(['/listar-tipo']);
        });
      },
      (error) => {
        console.error('Error al crear el subtipo de servicio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Hubo un problema al guardar el servicio.',
          confirmButtonText: 'Cerrar',
          customClass: {
            confirmButton: 'btn btn-danger',
          },
          buttonsStyling: false,
        });
      }
    );
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
    } else if (menu === 'horarios') {
      this.showHorariosMenu = !this.showHorariosMenu;
    } else if (menu === 'tipos') {
        this.showTiposnMenu = !this.showTiposnMenu;
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

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showMecanicosMenu = false;
    this.showHorariosMenu = false;
    this.showClientesMenu = false;
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
    this.showOrdenMenu = false;
  }

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
}
