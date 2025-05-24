import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.component.html',
  imports: [CommonModule],
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent {

  constructor(private router: Router) {}

  navigateLogin(): void {
    this.router.navigate(['/login']);
  }
}
