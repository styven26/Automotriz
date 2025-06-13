import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Repuesto, RepuestoService } from '../../../services/Repuesto/repuesto.service';
import { AuthService } from '../../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule }     from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ActualizarRepuestosComponent } from '../actualizar-repuestos/actualizar-repuestos.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule }           from '@angular/material/sort';
import { MatTableDataSource }from '@angular/material/table';
import * as XLSX from 'xlsx';
import { forkJoin, of } from 'rxjs';
import { catchError, take, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-listar-repuestos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatPaginator,
    MatSort,
    ReactiveFormsModule,      
    MatFormFieldModule,
    MatInputModule,        
    MatButtonModule,          
    MatIconModule,            
  ],
  templateUrl: './listar-repuestos.component.html',
  styleUrls: ['./listar-repuestos.component.css']
})
export class ListarRepuestosComponent {

  displayedColumns = [
    'created_date',  // nueva
    'created_time',  // nueva
    'nombre',
    'precio_base',
    'iva',
    'precio_final',
    'stock',
    'stock_minimo',
    'acciones'
  ];

  dataSource = new MatTableDataSource<Repuesto>([]);
  filterValue = '';
  duplicateNames: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
    
  rolActivo: string = 'Sin rol'; 
  roles: string[] = [];

  tiempoRestante: string = '';

  // Variables de usuario
  user!: { cedula: string; nombre: string; apellido: string };
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  showRepuestosMenu: boolean = false;

  constructor(private authService: AuthService, private fb: FormBuilder, private dialog: MatDialog, private repService: RepuestoService, private router: Router) {}

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
    this.user = this.authService.getUser();
    this.roles     = this.authService.getRoles();
    this.rolActivo = localStorage.getItem('rol_activo') || '';

      const user = this.authService.getUser();
  
    this.nombreUsuario = user.nombre || 'Sin Nombre';
    this.apellidoUsuario = user.apellido || 'Sin Apellido';

    this.obtenerRepuestos();
    this.loadAll();
    this.iniciarReloj();
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort      = this.sort;
    }
  }

  obtenerRepuestos(): void {
    this.repService .getAll().subscribe({
      next: repuestos => {
        this.dataSource = new MatTableDataSource(repuestos);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort      = this.sort;
      },
      error: err => console.error('Error al obtener repuestos:', err)
    });
  }

  private loadAll() {
    this.repService.getAll().pipe(take(1)).subscribe((lista: Repuesto[]) => {
      this.dataSource.data = lista;
    });
  }

  onFileChange(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const wb    = XLSX.read(e.target.result, { type: 'array' });
      const ws    = wb.Sheets[wb.SheetNames[0]];
      const rows  = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });

      // internos
      const counts = rows.reduce((acc, r) => {
        const n = (r['Nombre']||'').toString().trim();
        if (n) acc[n] = (acc[n]||0) + 1;
        return acc;
      }, {} as Record<string,number>);
      const internalDupes = Object.keys(counts).filter(n => counts[n] > 1);

      // existentes en BD
      this.repService.getAll().pipe(
        take(1),
        map((list: Repuesto[]) =>
          new Set(list.map(r => r.nombre.trim().toLowerCase()))
        )
      ).subscribe((existingSet: Set<string>) => {
        const dbDupes = Array.from(
          new Set(
            rows
              .map(r=>r['Nombre']?.toString().trim().toLowerCase())
              .filter(n => existingSet.has(n))
          )
        ).map(n => n.charAt(0).toUpperCase() + n.slice(1));

        // filtramos los únicos
        const seen = new Set<string>();
        const uniques = rows.filter(r => {
          const n  = r['Nombre'].toString().trim();
          const ln = n.toLowerCase();
          if (!n || counts[n] > 1 || existingSet.has(ln) || seen.has(ln)) {
            return false;
          }
          seen.add(ln);
          return true;
        });

        this.duplicateNames = [...internalDupes, ...dbDupes];

        if (!uniques.length) {
          Swal.fire('Nada que importar', 'No quedan filas únicas.', 'info');
          input.value = '';
          return;
        }

        Swal.fire({
          icon: 'question',
          title: 'Confirmar Importación',
          html: `
            Se importarán <b>${uniques.length}</b> repuestos.<br>
            <b>${this.duplicateNames.length}</b> duplicados omitidos.
          `,
          showCancelButton: true,
          confirmButtonText: 'Importar',
          cancelButtonText: 'Cancelar'
        }).then(res => {
          if (!res.isConfirmed) {
            input.value = '';
            return;
          }

          const calls = uniques.map(r => {
            const f = r['Fecha de Creación']?.toString().trim();
            const h = r['Hora de Creación']?.toString().trim();
            const created = (f && h)
              ? new Date(`${f} ${h}`).toISOString()
              : undefined;

            const rep: Repuesto = {
              cedula:        this.user.cedula,
              nombre:        r['Nombre'].toString().trim(),
              precio_base:   parseFloat(r['Precio Base'])    || 0,
              iva:            parseInt(r['IVA (%)'], 10)     || 0,
              precio_final:  parseFloat(r['Precio Final'])   || 0,
              stock:         parseInt(r['Stock'], 10)        || 0,
              stock_minimo:  parseInt(r['Stock Mínimo'], 10) || 0,
              created_at:    created
            };
            return this.repService.create(rep).pipe(
              catchError(err => {
                console.error('Error en create()', rep.nombre, err);
                return of(null);
              })
            );
          });

          forkJoin(calls).subscribe(results => {
            const ok = results.filter(r => r !== null).length;
            this.loadAll();
            Swal.fire(
              '¡Listo!',
              `✔ ${ok} creados.<br>❌ ${this.duplicateNames.length} omitidos.`,
              'success'
            );
          });
          input.value = '';
        });
      });
    };

    reader.readAsArrayBuffer(file);
  }

  editarRepuesto(r: Repuesto): void {
    const dialogRef = this.dialog.open(ActualizarRepuestosComponent, {
      data: r
    });

    dialogRef.afterClosed().subscribe(actualizado => {
      if (actualizado) {
        this.repService .update(r.id_repuesto!, actualizado).subscribe(
          () => this.obtenerRepuestos(),
          err => console.error('Error actualizando repuesto:', err)
        );
      }
    });
  }

  eliminarRepuesto(r: Repuesto): void {
    Swal.fire({
      title: '¿Eliminar repuesto?',
      text: `Vas a borrar "${r.nombre}". ¡No podrás deshacerlo!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-danger btn-rounded',
        cancelButton: 'btn btn-secondary btn-rounded'
      },
      buttonsStyling: false
    }).then(result => {
      if (result.isConfirmed) {
        this.repService .delete(r.id_repuesto!).subscribe(
          () => {
            Swal.fire({
              icon: 'success',
              title: 'Eliminado',
              text: 'Repuesto eliminado correctamente.',
              confirmButtonText: 'OK',
              customClass: { confirmButton: 'btn btn-success btn-rounded' },
              buttonsStyling: false
            });
            this.obtenerRepuestos();
          },
          err => {
            console.error('Error eliminando repuesto:', err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo eliminar el repuesto.',
              confirmButtonText: 'OK',
              customClass: { confirmButton: 'btn btn-danger btn-rounded' },
              buttonsStyling: false
            });
          }
        );
      }
    });
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    this.dataSource.filter = this.filterValue;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
    if (menu === 'repuestos') {
      this.showRepuestosMenu = !this.showRepuestosMenu;
    }
  }

  // Resetea todos los menús (ciérralos)
  resetMenus(): void {
    this.showRepuestosMenu = false;
  }
}
