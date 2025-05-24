import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredRole = route.data['role'] as string;
    const userRoles = this.authService.getRoles();
    
    if (!requiredRole || userRoles.includes(requiredRole)) {
      return true;
    }
  
    console.log('AuthGuard - Acceso DENEGADO, redirigiendo a login');
    this.router.navigate(['/login']).then(() => {
      console.log('AuthGuard - Redirigido a login');
    });
  
    return false;
  }  

}