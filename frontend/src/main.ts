import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),  // Proveedor de rutas
    importProvidersFrom(HttpClientModule),  // Módulo para HTTP
    importProvidersFrom(BrowserAnimationsModule), // Importar el módulo de animaciones (si lo necesitas)
  ]
})
.catch(err => console.error(err));