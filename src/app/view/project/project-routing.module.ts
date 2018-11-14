import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectComponent } from './project.component';
import { ProjectMappingComponent } from './project-mapping/project-mapping.component';
import { IssueTypeMappingComponent } from './issue-type-mapping/issue-type-mapping.component';
import { AbsenceComponent } from './absence/absence.component';

const projectRoutes: Routes = [
    {
        path: '',
        component: ProjectComponent
    },
    {
        path: 'mapping',
        component: ProjectMappingComponent
    },
    {
        path: ':id/:jiraProjectId/:rexorProjectUid/issue-type/mapping',
        component: IssueTypeMappingComponent
    },
    {
        path: ':id/:jiraProjectId/:rexorProjectUid/absence',
        component: AbsenceComponent
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
export class ProjectRoutingModule { }
