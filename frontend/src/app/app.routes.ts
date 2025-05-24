import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardClientesComponent } from './components/dashboard-clientes/dashboard-clientes.component';
import { DashboardAdminComponent } from './components/dashboard-admin/dashboard-admin.component';
import { DashboardMecanicoComponent } from './components/dashboard-mecanico/dashboard-mecanico.component';
import { DashboardVendedorComponent } from './components/dashboard-vendedor/dashboard-vendedor.component';
import { CrearRepuestosComponent } from './components/dashboard-vendedor/crear-repuestos/crear-repuestos.component';
import { CrearMecanicoComponent } from './components/dashboard-mecanico/crear-mecanico/crear-mecanico.component';
import { ListarRepuestosComponent } from './components/dashboard-vendedor/listar-repuestos/listar-repuestos.component';
import { ListarMecanicoComponent } from './components/dashboard-mecanico/listar-mecanico/listar-mecanico.component';
import { TipoOrdenServicioComponent } from './components/tipo-orden-servicio/tipo-orden-servicio.component';
import { CitasComponent } from './components/citas/citas.component';
import { ListarVehiculoComponent } from './components/vehiculo/listar-vehiculo/listar-vehiculo.component';
import { TiposServiciosComponent } from './components/tipos-servicios/tipos-servicios.component';
import { ListarTiposComponent } from './components/tipos-servicios/listar-tipos/listar-tipos.component';
import { SubtiposServiciosComponent } from './components/subtipos-servicios/subtipos-servicios.component';
import { HorariosComponent } from './components/horarios/horarios.component';
import { ListarHorariosComponent } from './components/horarios/listar-horarios/listar-horarios.component';
import { CalendarioComponent } from './components/calendario/calendario.component';
import { ActualizarCitaComponent } from './components/citas/actualizar-cita/actualizar-cita.component';
import { MecanicoCitaComponent } from './components/dashboard-mecanico/mecanico-cita/mecanico-cita.component';
import { TrabajosComponent } from './components/trabajos/trabajos.component';
import { MonitoreoComponent } from './components/monitoreo/monitoreo.component';
import { HistorialComponent } from './components/historial/historial.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { PasswordResetConfirmComponent } from './components/password-reset-confirm/password-reset-confirm.component';
import { CitasAdminComponent } from './components/dashboard-admin/citas-admin/citas-admin.component';
import { ListarClientesComponent } from './components/dashboard-clientes/listar-clientes/listar-clientes.component';
import { DiagnosticoComponent } from './components/diagnostico/diagnostico.component';

import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: InicioComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'password-reset', component: PasswordResetComponent },
  { path: 'password-reset/confirm', component: PasswordResetConfirmComponent },
  { path: 'dashboard-clientes', component: DashboardClientesComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'dashboard-admin', component: DashboardAdminComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'dashboard-mecanico', component: DashboardMecanicoComponent, canActivate: [AuthGuard], data: { role: 'mecanico' } },
  { path: 'dashboard-vendedor', component: DashboardVendedorComponent, canActivate: [AuthGuard] , data: { role: 'vendedor' } },
  { path: 'crear-repuestos', component: CrearRepuestosComponent, canActivate: [AuthGuard], data: { role: 'vendedor' } },
  { path: 'crear-mecanico', component: CrearMecanicoComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'listar-mecanico', component: ListarMecanicoComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'listar-repuestos', component: ListarRepuestosComponent, canActivate: [AuthGuard], data: { role: 'vendedor' } },
  { path: 'listar-vehiculo', component: ListarVehiculoComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'crear-tipo', component: TiposServiciosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'listar-tipo', component: ListarTiposComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'tipo-orden-servicio', component: TipoOrdenServicioComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'listar-subtipo', component: SubtiposServiciosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'crear-horario', component: HorariosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'listar-horario', component: ListarHorariosComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'registrar-vehiculo', component: CitasComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'calendario', component: CalendarioComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'actualizar-cita', component: ActualizarCitaComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'cita-mecanico', component: MecanicoCitaComponent, canActivate: [AuthGuard], data: { role: 'mecanico' } },
  { path: 'trabajo-mecanico', component: TrabajosComponent, canActivate: [AuthGuard], data: { role: 'mecanico' } },
  { path: 'monitoreo', component: MonitoreoComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'historial', component: HistorialComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },
  { path: 'citas-admin', component: CitasAdminComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'listar-clientes', component: ListarClientesComponent, canActivate: [AuthGuard], data: { role: 'admin' } },
  { path: 'diagnostico', component: DiagnosticoComponent, canActivate: [AuthGuard], data: { role: 'mecanico' } },
];