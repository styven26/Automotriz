import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule }           from '@angular/common';
import { MatListModule }          from '@angular/material/list';
import { MatButtonModule }        from '@angular/material/button';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatInputModule }         from '@angular/material/input';
import { Repuesto } from '../../services/Repuesto/repuesto.service';
import { FormsModule }            from '@angular/forms';

export interface AlertDialogData {
  repuestos: Repuesto[];
}

@Component({
  selector: 'app-alert-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title class="alert-dialog-title">
      Repuestos en Alerta ({{ filtered.length }} de {{ data.repuestos.length }})
    </h2>

    <mat-dialog-content class="alert-dialog-content">
      <mat-form-field class="alert-search" appearance="outline">
        <mat-label>Filtrar por nombre</mat-label>
        <input matInput [(ngModel)]="filterText" placeholder="Escribe para filtrar" />
      </mat-form-field>

      <mat-list>
        <mat-list-item *ngFor="let r of filtered" class="alert-item">
          <div class="alert-name"> {{ r.nombre }} </div>
          <div class="alert-stock"> Stock: {{ r.stock }} </div>
        </mat-list-item>
        <p *ngIf="filtered.length === 0" class="no-results">
          No se encontraron repuestos.
        </p>
      </mat-list>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .alert-dialog-content { max-height:400px; overflow:auto; padding:0 24px; }
    .alert-dialog-title   { font-size:1.25rem; font-weight:600; }
    .alert-search          { width:100%; margin-bottom:0.5rem; }
    .no-results            { text-align:center; color:rgba(0,0,0,0.54); margin-top:1rem; }

    /* nuevo layout de cada ítem */
    .alert-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    .alert-name  { font-weight:500; }
    .alert-stock { color: rgba(0,0,0,0.6); }
  `]
})
export class AlertListDialogComponent {
  filterText = '';
  constructor(
    private dialogRef: MatDialogRef<AlertListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AlertDialogData
  ) {}

  get filtered() {
    const txt = this.filterText.trim().toLowerCase();
    return txt
      ? this.data.repuestos.filter(r => r.nombre.toLowerCase().includes(txt))
      : this.data.repuestos;
  }
  close() { this.dialogRef.close(); }
}