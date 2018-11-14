import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WorklogComponent } from './worklog.component';
import { WorklogQueueComponent } from './worklog-queue/worklog-queue.component';

const projectRoutes: Routes = [
    {
        path: '',
        component: WorklogComponent
    },
    {
        path: 'queue',
        component: WorklogQueueComponent
    }
];
@NgModule({
    imports: [
        RouterModule.forChild(projectRoutes)
    ],
    exports: [
        RouterModule
    ]
})
export class WorklogRoutingModule { }
