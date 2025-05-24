import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Asegúrate de importar esto
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [RouterModule]  // Aquí es donde agregas el RouterModule
})
export class AppComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
