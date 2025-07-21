import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { RepuestoService, Repuesto } from '../../services/Repuesto/repuesto.service';
import { DetalleServicioService } from '../../services/DetalleServicio/detalleservicio.service';
import { DetalleRepuestoService } from '../../services/DetalleRepuesto/detallerepuesto.service';
import { OrdenService, Orden } from '../../services/Orden/orden.service';
import { SubtipoService } from '../../services/Subtiposervicios/subtipo.service';
import { DiagnosticoService } from '../../services/Diagnostico/diagnostico.service';
import { IgxCardModule, IgxButtonModule, IgxRippleModule, IgxIconModule } from 'igniteui-angular';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-trabajos',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        IgxCardModule,
        IgxButtonModule,
        IgxRippleModule,
        IgxIconModule
    ],
    templateUrl: './trabajos.component.html',
    styleUrls: ['./trabajos.component.css']
})
export class TrabajosComponent {

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  sidebarActive: boolean = false; // Controla el estado del menú lateral
  tiempoRestante: string = '';
  trabajos: Orden[] = [];
  inventario: Repuesto[] = [];
  pageSize = 2;       // items por página
  currentPage = 0;
  public Math = Math;

  // Guarda el trabajo seleccionado para usar después
  private selectedTrabajo!: Orden;
  private selectedRepuestoId!: number;

  // Para el formulario de actualización (ejemplo simple)
  selectedTrabajoId: number | null = null;

  // Control de submenús
  showMecanicosMenu: boolean = false;
  showClientesMenu: boolean = false;
  showCitasMenu: boolean = false;
  showConfiguracionMenu: boolean = false;
  showTiposnMenu: boolean = false;
  showSubtiposnMenu: boolean = false;

  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];
  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  constructor(private authService: AuthService, private router: Router,  private detalleServicioService: DetalleServicioService, private serviciosService:SubtipoService, private repuestoService: RepuestoService, private detalleRepuestoService: DetalleRepuestoService, private diagnosticoService: DiagnosticoService, private ordenService: OrdenService) {}

  // Funciones de navegación del menú
  ngOnInit(): void {  
    this.roles = JSON.parse(localStorage.getItem('roles') ?? '[]');
    this.rolActivo = localStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(localStorage.getItem('user') || '{}');
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';
    
    this.trabajos = []; // Inicializa como un array vacío
    this.cargarTrabajos();
    this.iniciarReloj();
    this.loadInventario();
  }

  triggerFileSelector(trabajo: Orden) {
    this.selectedTrabajo = trabajo;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    input.value = ''; // ← Reinicia input file para evitar problemas al volver a seleccionar

    if (!this.selectedTrabajo || !this.selectedTrabajo.cita || !this.selectedTrabajo.cita.cliente) {
      Swal.fire('Error', 'No hay trabajo seleccionado para enviar la foto', 'error');
      return;
    }

    const cliente = this.selectedTrabajo.cita.cliente;
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`;

    // 1) Si el navegador soporta compartir archivos…
    if (navigator.canShare?.({ files: [file] })) {
      const textoCompartir = 
        `Hola ${nombreCompleto},\n` +
        `Por favor adquiere el repuesto y revisa la foto aquí:`;

      navigator.share({
        files: [file],
        text: textoCompartir
      }).catch(err => {
        console.error('Error al compartir:', err);
        Swal.fire('Error', 'No se pudo compartir la foto', 'error');
      });

      return;
    }

    // 2) Fallback: subir imagen al servidor y compartir por WhatsApp
    const formData = new FormData();
    formData.append('foto', file);

    this.ordenService
      .enviarFotoWhatsAppPorOrden(this.selectedTrabajo.id_orden, formData)
      .subscribe({
        next: ({ url }) => {
          const mensaje = 
            `Hola ${nombreCompleto},\n` +
            `Por favor adquiere el repuesto y revisa la foto aquí:\n${url}`;

          const telefono = cliente.telefono.replace(/[^0-9]/g, '');
          const waLink = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
          window.open(waLink, '_blank');
        },
        error: err => {
          console.error(err);
          Swal.fire('Error', 'No se pudo subir la foto', 'error');
        }
      });
  }

  abrirModalCantidad(
    detalle: { id_detalle: number; cantidad: number },
    nombreServicio?: string
  ) {
    const cantidadActual = detalle.cantidad ?? 1;
    const label = nombreServicio
      ? `¿Cuántas unidades de "${nombreServicio}"?`
      : '¿Qué cantidad?';

    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 0 20px;
        max-height: 25vh;
        overflow-y: auto;
      ">
        <label style="
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          text-align: center;
        ">
          ${label}
        </label>
        <input
          id="swal-input-cantidad"
          type="number"
          class="swal2-input"
          style="
            width: 80%;
            padding: 0.75rem 1rem;
            font-family: 'Poppins', sans-serif;
            font-size: 1rem;
            line-height: 1.4;
            border: 1px solid #ccc;
            border-radius: 0.375rem;
            box-sizing: border-box;
          "
          min="1"
          value="${cantidadActual}"
          placeholder="Cantidad"
        />
      </div>
    `;

    Swal.fire({
      title: `<h3 style="
        font-family: Roboto, sans-serif;
        font-size: 30px;
        font-weight: 900;
        text-align: center;
        margin-bottom: 15px;
      "><strong>${label}</strong></h3>`,
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: `<span style="
        font-family: Roboto, sans-serif;
        border-radius: 50px;
        padding: 8px 24px;
      ">Guardar</span>`,
      cancelButtonText: `<span style="
        font-family: Roboto, sans-serif;
        border-radius: 50px;
        padding: 8px 24px;
      ">Cancelar</span>`,
      customClass: {
        confirmButton: 'rounded-button',
        cancelButton: 'rounded-button'
      },
      preConfirm: () => {
        const input = document.getElementById('swal-input-cantidad') as HTMLInputElement;
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) {
          Swal.showValidationMessage('Introduce un número válido (>=1)');
        }
        return { cantidad: val };
      }
    }).then(result => {
      if (result.isConfirmed && result.value?.cantidad != null) {
        this.detalleServicioService
          .updateCantidad(detalle.id_detalle, result.value.cantidad)
          .subscribe({
            next: () => {
              Swal.fire('¡Listo!', 'Cantidad actualizada', 'success');
              this.cargarTrabajos();
            },
            error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
          });
      }
    });
  }

  /** en trabajos.component.ts */
  abrirModalCantidadRepuesto(
    dr: { id_detalle_repuesto: number; cantidad: number },
    nombreRepuesto?: string
  ) {
    const cantidadActual = dr.cantidad ?? 1;
    const label = nombreRepuesto
      ? `¿Cuántas unidades de "${nombreRepuesto}"?`
      : '¿Qué cantidad?';

    const html = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 0 20px;
        max-height: 25vh;
        overflow-y: auto;
      ">
        <label style="
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          text-align: center;
        ">
          ${label}
        </label>
        <input
          id="swal-input-cantidad-repuesto"
          type="number"
          class="swal2-input"
          style="
            width: 80%;
            padding: 0.75rem 1rem;
            font-family: 'Poppins', sans-serif;
            font-size: 1rem;
            line-height: 1.4;
            border: 1px solid #ccc;
            border-radius: 0.375rem;
            box-sizing: border-box;
          "
          min="1"
          value="${cantidadActual}"
          placeholder="Cantidad"
        />
      </div>
    `;

    Swal.fire({
      title: `<h3 style="
        font-family: Roboto, sans-serif;
        font-size: 30px;
        font-weight: 900;
        text-align: center;
        margin-bottom: 15px;
      "><strong>${label}</strong></h3>`,
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: `<span style="
        font-family: Roboto, sans-serif;
        border-radius: 50px;
        padding: 8px 24px;
      ">Guardar</span>`,
      cancelButtonText: `<span style="
        font-family: Roboto, sans-serif;
        border-radius: 50px;
        padding: 8px 24px;
      ">Cancelar</span>`,
      customClass: {
        confirmButton: 'rounded-button',
        cancelButton:  'rounded-button'
      },
      preConfirm: () => {
        const input = document.getElementById('swal-input-cantidad-repuesto') as HTMLInputElement;
        const val = parseInt(input.value, 10);
        if (isNaN(val) || val < 1) {
          Swal.showValidationMessage('Introduce un número válido (>=1)');
        }
        return { cantidad: val };
      }
    }).then(result => {
      if (result.isConfirmed && result.value?.cantidad != null) {
        this.detalleRepuestoService
          .update(dr.id_detalle_repuesto, { cantidad: result.value.cantidad })
          .subscribe({
            next: () => {
              Swal.fire('¡Listo!', 'Cantidad de repuesto actualizada', 'success');
              this.cargarTrabajos();
            },
            error: () => Swal.fire('Error', 'No se pudo actualizar', 'error')
          });
      }
    });
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

  get pagedTrabajos(): Orden[] {
    const start = this.currentPage * this.pageSize;
    return this.trabajos.slice(start, start + this.pageSize);
  }
  get totalPages(): number {
    return Math.ceil(this.trabajos.length / this.pageSize);
  }

  goTo(page: number) {
    if (page < 0 || page >= this.totalPages) { return; }
    this.currentPage = page;
  }

  descargarReporte(): void {
    this.ordenService.descargarReporte();
  }

  private cargarTrabajos(): void {
    this.ordenService.listarConfirmadas()
      .subscribe({
        next: ordenes => {
          this.trabajos = ordenes;
          // ahora cada orden.trabajo.detalle_repuestos ya viene poblado
        },
        error: err => console.error(err)
      });
  }

  trackById(index:number, trabajo:Orden) {
    return trabajo.id_orden;
  }

  private loadInventario() {
    this.repuestoService.getAll().subscribe(
      inv => this.inventario = inv,
      _ => Swal.fire('Error','No cargó inventario','error')
    );
  }

  // Firma explícita para que TS sepa que devuelve un Promise<any>
  consultarInventario(trabajo: Orden): Promise<any> {
    // 1) Calculamos "disponible" = stock – stock_minimo
    const opciones = this.inventario
      .map(r => {
        const disponible = r.stock - (r.stock_minimo ?? 0);
        return {
          id: r.id_repuesto,
          texto: `${r.nombre} (disponible: ${disponible})`,
          disponible,
          precio: r.precio_final
        };
      })
      // 2) Sólo los que realmente tengan > 0 disponibles
      .filter(o => o.disponible > 0);

    // 3) Si no hay ninguno, avisamos y salimos
    if (opciones.length === 0) {
      return Swal.fire(
        'Sin inventario',
        'No hay repuestos disponibles por encima del mínimo. El cliente deberá buscar el repuesto.',
        'info'
      );
    }

    // 4) HTML de las <option> con data-disponible y data-precio
    const optsHtml = opciones.map(o => `
      <option
        value="${o.id}"
        data-precio="${o.precio}"
        data-disponible="${o.disponible}"
      >
        ${o.texto}
      </option>
    `).join('');

    // 5) Mostramos el SweetAlert con select + input cantidad, usando tus estilos inline
    return Swal.fire({
      title: `<h3 style="
          font-family: Roboto, sans-serif;
          font-size: 30px;
          font-weight: 900;
          text-align: center;
        ">
          <strong>Selecciona Repuesto</strong>
      </h3>`,
      html: ` <select
          id="swal-repuesto"
          class="swal2-select"
          style="width:80%; padding:0.75rem 1rem; font-size:1rem; line-height:1.4; border:1px solid #ccc; border-radius:0.375rem; box-sizing:border-box; appearance:none; background-image:url('data:image/svg+xml;charset=UTF-8,%3Csvg width=&quot;10&quot; height=&quot;6&quot; viewBox=&quot;0 0 10 6&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;%3E%3Cpath d=&quot;M0 0l5 6 5-6H0z&quot; fill=&quot;%23666&quot;/%3E%3C/svg%3E'); background-repeat:no-repeat; background-position:right 1rem center; background-size:0.65rem auto; margin-bottom:1.5rem;"
        >
          <option value="" disabled selected>-- elige repuesto --</option>
          ${optsHtml}
        </select>
        <label
          for="swal-cantidad"
          style="display:block; margin-bottom:0.5rem; font-size:1.2rem; font-weight:600;"
        >
          Cantidad
        </label>
        <input
          id="swal-cantidad"
          type="number"
          class="swal2-input"
          placeholder="Cantidad"
          min="1"
          value="1"
          style="width:80%; padding:0.75rem 1rem; font-size:1rem; line-height:1.4; border:1px solid #ccc; border-radius:0.375rem; box-sizing:border-box; margin-bottom:1rem;"
        />
      `,
      focusConfirm: false,
      preConfirm: () => {
        const sel = document.getElementById('swal-repuesto') as HTMLSelectElement;
        const qty = parseInt((document.getElementById('swal-cantidad') as HTMLInputElement).value, 10);

        if (!sel.value) {
          Swal.showValidationMessage('Debes seleccionar un repuesto');
          return;
        }

        const precio     = parseFloat(sel.selectedOptions[0].dataset['precio']!);
        const disponible = parseInt(sel.selectedOptions[0].dataset['disponible']!, 10);

        if (isNaN(qty) || qty < 1 || qty > disponible) {
          Swal.showValidationMessage(`Cantidad entre 1 y ${disponible}`);
          return;
        }

        return {
          id_repuesto: +sel.value,
          cantidad:    qty,
          precio
        };
      }
    }).then(res => {
      if (!res.isConfirmed || !res.value) {
        return;
      }
      const { id_repuesto, cantidad, precio } = res.value;
      this.detalleRepuestoService.create({
        id_repuesto,
        id_orden: trabajo.id_orden,
        cantidad,
        precio
      }).subscribe({
        next: () => {
          Swal.fire('Éxito','Repuesto registrado','success');
          this.cargarTrabajos();
          this.loadInventario();
        },
        error: e => {
          Swal.fire('Error', e.error?.error || 'No guardó','error');
        }
      });
    });
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
    if (menu === 'trabajos') {
      this.showTiposnMenu = !this.showTiposnMenu;
    } else if (menu === 'citas') {
      this.showCitasMenu = !this.showCitasMenu;
    } else if (menu === 'configuracion') {
      this.showConfiguracionMenu = !this.showConfiguracionMenu;
    }
  }

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showCitasMenu = false;
    this.showConfiguracionMenu = false;
    this.showTiposnMenu = false;
    this.showSubtiposnMenu = false;
  }

  // Verifica si el trabajo contiene el subtipo "Diagnóstico"
  isDiagnostico(trabajo: Orden): boolean {
    return trabajo.detalles_servicios.some(d => d.servicio.nombre === 'Diagnóstico');
  }

  // Verifica si el mecánico autenticado es el asignado a este trabajo
  esMecanicoAsignado(trabajo: Orden): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return trabajo.cita.cedula_mecanico === user.cedula;
  }

  abrirModalDiagnostico(trabajo: any): void {
    // Se consulta la lista de subtipos de servicios disponibles en el taller.
    this.serviciosService.obtenerSubtiposServicios().subscribe(
      (subtipos: any[]) => {
        // 1. Filtrar para excluir el subtipo cuyo nombre sea "Diagnóstico".
        subtipos = subtipos.filter(sub => sub.nombre.toLowerCase() !== 'diagnóstico');
  
        // 2. Si no quedan subtipos tras filtrar, muestra un mensaje y detiene la ejecución.
        if (!subtipos || subtipos.length === 0) {
          Swal.fire('Información', 'No hay servicios disponibles en el taller (excluyendo "Diagnóstico").', 'info');
          return;
        }
  
        // 3. Construir el HTML con checkboxes (en lugar de un select multiple).
        let optionsHtml = `<div style="text-align: left; padding: 0 20px;">`;
        subtipos.forEach((subtipo) => {
          optionsHtml += `
            <div style="margin-bottom: 8px;">
              <input 
                type="checkbox" 
                id="servicio-${subtipo.id}" 
                value="${subtipo.id}" 
                style="margin-right: 6px;" 
              />
              <label 
                for="servicio-${subtipo.id}" 
                style="font-family: 'Poppins', sans-serif; font-size: 16px;"
              >
                ${subtipo.nombre}
              </label>
            </div>
          `;
        });
        optionsHtml += `</div>`;
  
        // 4. Mostrar el modal de SweetAlert con el textarea y los checkboxes.
        Swal.fire({
          title: `
            <h4 style="
              font-family: Roboto, sans-serif;
              font-size: 30px;
              font-weight: bold;
              text-align: center;
            ">
              <strong>Registrar Diagnóstico</strong>
            </h4>
          `,
          html: `
            <div style="margin-bottom: 10px; text-align: center;">
              <textarea
                id="descripcion"
                placeholder="Describa el problema encontrado"
                style="
                  width: 100%;
                  height: 80px;
                  font-family: 'Poppins', sans-serif;
                  font-size: 15px;
                  padding: 8px;
                  /* Agrega margen inferior */
                  margin: 0 0 20px 0; 
                  border-radius: 5px;
                  border: 1px solid #ccc;
                  resize: none;
                "
              ></textarea>
            </div>
            <div style="text-align: center; font-family: 'Poppins', sans-serif; margin: 0 0 20px 0; font-weight: bold; font-size: 16px; margin-bottom: 5px;">
              Servicios Recomendados
            </div>
            ${optionsHtml}
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: `<span style="font-family: Roboto, sans-serif; border-radius: 50px;">Guardar</span>`,
          cancelButtonText: `<span style="font-family: Roboto, sans-serif; border-radius: 50px;">Cancelar</span>`,
          customClass: {
            confirmButton: 'rounded-button',
            cancelButton: 'rounded-button',
          },
          preConfirm: () => {
            const descripcionInput = (document.getElementById('descripcion') as HTMLTextAreaElement)?.value.trim();
            
            // Validación mínima de descripción
            if (!descripcionInput) {
              Swal.showValidationMessage('La descripción no puede estar vacía');
              return;
            }
            
            // Recoger los checkboxes seleccionados
            const serviciosRecomendados: number[] = [];
            subtipos.forEach(subtipo => {
              const checkbox = document.getElementById(`servicio-${subtipo.id}`) as HTMLInputElement;
              if (checkbox && checkbox.checked) {
                serviciosRecomendados.push(Number(checkbox.value));
              }
            });
  
            return {
              descripcion: descripcionInput,
              serviciosRecomendados
            };
          }
        }).then(result => {
          if (result.isConfirmed) {
            const { descripcion, serviciosRecomendados } = result.value;
            this.guardarDiagnostico(trabajo.id_orden, descripcion, serviciosRecomendados);
          }
        });
      },
      error => {
        Swal.fire('Error', 'No se pudo obtener la lista de servicios.', 'error');
      }
    );
  }     
  
  guardarDiagnostico(citaId: number, descripcion: string, serviciosRecomendados: any[]): void {
    this.diagnosticoService.registrarDiagnostico(citaId, descripcion, serviciosRecomendados)
      .subscribe({
        next: (resp) => {
          Swal.fire('Éxito', 'Diagnóstico guardado.', 'success');
          // Recargar la lista de trabajos/citas para reflejar el nuevo estado.
          this.cargarTrabajos();
        },
        error: (err) => {
          Swal.fire('Error', 'No se pudo guardar el diagnóstico.', 'error');
          console.error(err);
        }
      });
  }    

  abrirModalActualizar(trabajo: Orden): void {
    const detalles = trabajo.detalles_servicios || [];
    if (!detalles.length) {
      Swal.fire('Error','No hay detalles de servicio asociados a esta orden.','error');
      return;
    }

    const inputsHtml = `
    <div style="
      max-height: 40vh;      /* altura máxima del contenedor */
      overflow-y: auto;      /* scroll vertical si supera esa altura */
      padding-right: 10px;    /* espacio para el scrollbar */
    ">
      ${detalles.map((d, i) => `
        <div style="margin-bottom:20px; text-align:center;">
          <label style="font-family:'Poppins',sans-serif; margin-bottom:5px; display:block;">
            🔧 ${d.servicio.nombre}
          </label>
          <input
            id="swal-progreso-${i}"
            data-id-detalle="${d.id_detalle}"
            class="swal2-input"
            type="number"
            value="${d.progreso}"
            min="${d.progreso}"
            max="100"
            step="1"
          />
        </div>
      `).join('')}
    </div>
  `;

    Swal.fire({
      title: `<h3 style="
          font-family: Roboto, sans-serif;
          font-size: 30px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 15px;
        ">
          <strong>Actualizar Progresos</strong>
      </h3>`,
      html: inputsHtml,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: `<span style="
        font-family:Roboto,sans-serif;
        border-radius:50px;
        padding:15px 30px;
      ">Guardar</span>`,
      cancelButtonText: `<span style="
        font-family:Roboto,sans-serif;
        border-radius:50px;
        padding:15px 30px;
      ">Cancelar</span>`,
      customClass: { confirmButton: 'rounded-button', cancelButton: 'rounded-button' },
      preConfirm: () => {
        const progresos: { id_detalle: number; progreso: number }[] = [];
        detalles.forEach((_, i) => {
          const input = document.getElementById(`swal-progreso-${i}`) as HTMLInputElement;
          const idDet = input.getAttribute('data-id-detalle');
          const id_detalle = idDet ? Number(idDet) : 0;
          const prog       = parseFloat(input.value);
          const minPrevio  = parseFloat(input.min);
          if (prog < minPrevio) Swal.showValidationMessage(`No puedes bajar de ${minPrevio}%`);
          if (prog < 0 || prog > 100) Swal.showValidationMessage('Debe estar entre 0 y 100');
          progresos.push({ id_detalle, progreso: prog });
        });
        return { progresos };
      }
    }).then(res => {
      if (res.isConfirmed) {
        this.ordenService.actualizarProgreso(trabajo.id_orden, res.value.progresos)
          .subscribe({
            next: () => {
              Swal.fire('Éxito','Progresos actualizados.','success');
              this.cargarTrabajos();
            },
            error: e => Swal.fire('Error','No se pudo actualizar.','error')
          });
      }
    });
  }

  /** Devuelve true si ya pasó (o ha llegado) la hora de inicio */
  public isCitaIniciada(trabajo: Orden): boolean {
    const inicio = new Date(`${trabajo.cita.fecha}T${trabajo.cita.hora}`);
    return new Date() >= inicio;
  }

  /** Muestra un Swal si aún no es la hora de la cita */
  public validarHoraCita(trabajo: Orden): boolean {
    if (!this.isCitaIniciada(trabajo)) {
      Swal.fire({
        icon: 'info',
        title: 'Aún no es la hora de la cita',
        text: `La cita comienza a las ${trabajo.cita.hora} del ${trabajo.cita.fecha}.`,
        confirmButtonText: 'Entendido'
      });
      return false;
    }
    return true;
  }
  
  finalizarTrabajo(trabajo: Orden): void {
    this.ordenService.finalizarAutomatico(trabajo.id_orden)
      .subscribe({
        next: () => {
          Swal.fire('Éxito','Orden finalizada automáticamente.','success');
          this.cargarTrabajos();
        },
        error: err => {
          // Primero intentamos mostrar `mensaje`, si no existe mostramos `error`
          const msg = err.error?.mensaje ?? err.error?.error ?? 'No se pudo finalizar.';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg
          });
        }
      });
  }

  actualizarProgresoOrden(idOrden: number, progresos: { id_detalle: number; progreso: number }[]): void {
    this.ordenService.actualizarProgreso(idOrden, progresos).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Progresos actualizados.', 'success');
        this.cargarTrabajos();  // Recarga la lista de órdenes
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudo actualizar el progreso.', 'error');
        console.error(err);
      }
    });
  } 
  
  calcularEtapa(progreso: number): string {
    if (progreso <= 20) {
        return 'Diagnóstico';
    } else if (progreso <= 99) {
        return 'Reparación';
    } else {
        return 'Finalización';
    }
  }  

  abrirModalDescripcion(trabajo: Orden): void {
    const detalles = trabajo.detalles_servicios || [];
    if (!detalles.length) {
      Swal.fire('Error','No hay detalles de servicio asociados a esta orden.','error');
      return;
    }

    // Generamos el HTML y lo metemos en un wrapper fijo
    const inputsHtml = `
      <div style="
        max-height: 40vh;
        overflow-y: auto;
        padding-right: 10px;
      ">
        ${detalles.map((d, i) => `
          <div style="margin-bottom:20px;text-align:center;">
            <label style="font-family:'Poppins',sans-serif;margin-bottom:5px;display:block;">
              🔧 ${d.servicio.nombre}
            </label>
            <textarea
              id="swal-descripcion-${i}"
              data-id-detalle="${d.id_detalle}"
              class="swal2-textarea"
              placeholder="Descripción"
              style="font-family:'Poppins',sans-serif;">${d.descripcion || ''}</textarea>
          </div>
        `).join('')}
      </div>
    `;

    Swal.fire({
      title: `<h3 style="
          font-family: Roboto, sans-serif;
          font-size: 30px;
          font-weight: 900;
          text-align: center;
          margin-bottom: 15px;
        ">
          <strong>Actualizar Descripciones</strong>
      </h3>`,
      html: inputsHtml,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: `<span style="
        font-family:Roboto,sans-serif;
        border-radius:50px;
        padding:15px 30px;
      ">Guardar</span>`,
      cancelButtonText: `<span style="
        font-family:Roboto,sans-serif;
        border-radius:50px;
        padding:15px 30px;
      ">Cancelar</span>`,
      customClass: {
        confirmButton: 'rounded-button',
        cancelButton:  'rounded-button'
      },
      preConfirm: () => {
        const descripciones: { id_detalle: number; descripcion: string }[] = [];
        detalles.forEach((_, i) => {
          const ta = document.getElementById(`swal-descripcion-${i}`) as HTMLTextAreaElement;
          const id_detalle = Number(ta.dataset['idDetalle']!);
          const v = ta.value.trim();
          if (!v) {
            Swal.showValidationMessage('La descripción no puede estar vacía');
          }
          descripciones.push({ id_detalle, descripcion: v });
        });
        return { descripciones };
      }
    }).then(res => {
      if (res.isConfirmed) {
        this.ordenService.actualizarDescripciones(trabajo.id_orden, res.value.descripciones)
          .subscribe({
            next: () => {
              Swal.fire('Éxito','Descripciones actualizadas.','success');
              this.cargarTrabajos();
            },
            error: () => Swal.fire('Error','No se pudieron actualizar.','error')
          });
      }
    });
  }  
  
  /** Método para invocar el servicio y recargar la lista */
  private actualizarDescripcionesOrden(idOrden: number, descripciones: { id_detalle: number; descripcion: string }[]): void {
    this.ordenService.actualizarDescripciones(idOrden, descripciones).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Descripciones actualizadas.', 'success');
        this.cargarTrabajos();  // Recarga la lista de órdenes
      },
      error: (err) => {
        Swal.fire('Error', 'No se pudieron actualizar las descripciones.', 'error');
        console.error(err);
      }
    });
  }      
  
  // Funciones de navegación
  navigateDashboard(): void {
    this.router.navigate(['/dashboard-mecanico']);
  }
  navigateCitasMecanico(): void {
    this.router.navigate(['/cita-mecanico']);
  }
  navigateTrabajos(): void {
    this.router.navigate(['/trabajo-mecanico']);
  }
  navigateDiagnostico(): void {
    this.router.navigate(['/diagnostico']);
  }
}