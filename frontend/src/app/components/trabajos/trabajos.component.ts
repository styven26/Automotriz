import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { RepuestoService, Repuesto } from '../../services/Repuesto/repuesto.service';
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

  tiempoRestante: string = '';
  trabajos: Orden[] = [];
  inventario: Repuesto[] = [];
  pageSize = 2;       // items por página
  currentPage = 0;
  public Math = Math;

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

  constructor(private authService: AuthService, private router: Router,  private serviciosService:SubtipoService, private repuestoService: RepuestoService, private detalleRepuestoService: DetalleRepuestoService, private diagnosticoService: DiagnosticoService, private ordenService: OrdenService) {}

  // Funciones de navegación del menú
  ngOnInit(): void {  
    this.roles = JSON.parse(sessionStorage.getItem('roles') ?? '[]');
    this.rolActivo = sessionStorage.getItem('rol_activo') ?? '';

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  
    this.nombreUsuario = user.nombre || '';
    this.apellidoUsuario = user.apellido || '';
    
    this.trabajos = []; // Inicializa como un array vacío
    this.cargarTrabajos();
    this.iniciarReloj();
    this.loadInventario();
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
    const opciones = this.inventario
      .map(r => ({
        id: r.id_repuesto,
        texto: `${r.nombre} (stock: ${r.stock})`,
        stock: r.stock,
        precio: r.precio_final
      }))
      .filter(r => r.stock > 0);

    if (opciones.length === 0) {
      // Devuelve un Promise<any> aquí
      return Swal.fire(
        'Sin inventario',
        'No hay repuestos en stock. El cliente deberá buscar el repuesto.',
        'info'
      );
    }

    const optsHtml = opciones
      .map(o => `<option value="${o.id}"
                        data-precio="${o.precio}"
                        data-stock="${o.stock}">
                    ${o.texto}
                  </option>`)
      .join('');

    // ¡AÑADE return aquí!
    return Swal.fire({
      title: `<h3 style="
          font-family: Roboto, sans-serif;
          font-size: 30px;
          font-weight: 900;
          text-align: center;
        ">
          <strong>Selecciona Repuesto</strong>
      </h3>`,
      html: `
        <select
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
        if (!sel.value) Swal.showValidationMessage('Debes seleccionar un repuesto');
        const precio = parseFloat(sel.selectedOptions[0].dataset['precio']!);
        const stock  = parseInt(sel.selectedOptions[0].dataset['stock']!, 10);
        if (qty < 1 || qty > stock) {
          Swal.showValidationMessage(`Cantidad entre 1 y ${stock}`);
        }
        return { id_repuesto: +sel.value, cantidad: qty, precio };
      }
    }).then(res => {
      if (!res.isConfirmed) return;
      const { id_repuesto, cantidad, precio } = res.value!;
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
        error: e => Swal.fire('Error', e.error?.error || 'No guardó','error')
      });
    });
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
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
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
  
  finalizarTrabajo(trabajo: Orden): void {
    this.ordenService.finalizarAutomatico(trabajo.id_orden)
      .subscribe({
        next: () => {
          Swal.fire('Éxito','Orden finalizada automáticamente.','success');
          this.cargarTrabajos();
        },
        error: err => Swal.fire('Error', err.error?.error || 'No se pudo finalizar.','error')
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