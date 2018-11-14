import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorklogService } from './worklog.service';
import { NgProgressModule } from 'ngx-progressbar';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { WorklogComponent } from './worklog.component';
import { UiModule } from '../../ui/ui.module';
import { WorklogQueueComponent } from './worklog-queue/worklog-queue.component';
import { WorklogRoutingModule } from './worklog-routing.module';

@NgModule({
    imports: [
        CommonModule,
        WorklogRoutingModule,
        Ng2SmartTableModule,
        NgProgressModule,
        NgbDatepickerModule,
        UiModule,
        FormsModule
    ],
    declarations: [
        WorklogComponent,
        WorklogQueueComponent
    ],
    providers: [
        WorklogService
    ]
})
export class WorklogModule { }
