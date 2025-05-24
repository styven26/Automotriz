import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';         // <-- Para *ngIf, *ngFor
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-actualizar-diagnostico',
  standalone: true,
  imports: [],
  templateUrl: './actualizar-diagnostico.component.html',
  styleUrl: './actualizar-diagnostico.component.css'
})
export class ActualizarDiagnosticoComponent {

}
