import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { NgbdDatepickerRangeComponent } from './range-date-picker/range-date-piciker.component';
import { OneToManySelectorComponent } from './one-to-many-selector/one-to-many-selector.component';
import { TableCellInputComponent } from './table-cell-input/table-cell-input.component';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    Ng2SmartTableModule,
    NgbDatepickerModule
  ],
  entryComponents: [
    TableCellInputComponent
  ],
  declarations: [
    OneToManySelectorComponent,
    TableCellInputComponent,
    NgbdDatepickerRangeComponent
  ],
  exports: [
    OneToManySelectorComponent,
    TableCellInputComponent,
    NgbdDatepickerRangeComponent
  ]
})
export class UiModule { }
