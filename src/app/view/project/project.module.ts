import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiModule } from '../../ui/ui.module';
import { ProjectRoutingModule } from './project-routing.module';
import { ProjectComponent } from './project.component';
import { ProjectMappingComponent } from './project-mapping/project-mapping.component';
import { IssueTypeMappingComponent } from './issue-type-mapping/issue-type-mapping.component';
import { AbsenceComponent } from './absence/absence.component';
import { ProjectService } from './project.service';
import { IssueTypeMappingService } from './issue-type-mapping/issue-type-mapping.service';
import { AbsenceService } from './absence/absence.service';
import { TableCellInputComponent } from '../../ui/table-cell-input/table-cell-input.component';
import { NgProgressModule } from 'ngx-progressbar';
import { Ng2SmartTableModule } from 'ng2-smart-table';



@NgModule({
    imports: [
        CommonModule,
        UiModule,
        FormsModule,
        ProjectRoutingModule,
        Ng2SmartTableModule,
        NgProgressModule
    ],
    entryComponents: [
        TableCellInputComponent
    ],
    declarations: [
        ProjectComponent,
        ProjectMappingComponent,
        IssueTypeMappingComponent,
        AbsenceComponent
    ],
    providers: [
        ProjectService,
        IssueTypeMappingService,
        AbsenceService
    ]
})
export class ProjectModule { }
