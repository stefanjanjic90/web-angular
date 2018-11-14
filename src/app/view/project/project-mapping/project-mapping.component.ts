import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ProjectService } from '../project.service';
import { NgProgress } from 'ngx-progressbar';
import { OneToManySelectorData, OneToManySelectorSettings } from '../../../ui/one-to-many-selector/one-to-many-selector.component';
import { ProjectViewData, JiraProject, RexorProject } from '../../../data/common';
import { JiraProjectRexorProjectEntity } from '../../../data/entity';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import * as _ from 'lodash';

@Component({
  selector: 'app-project-mapping',
  templateUrl: './project-mapping.component.html'
})
export class ProjectMappingComponent implements OnInit {

  public mappingData: OneToManySelectorData;
  public mappingSettigns: OneToManySelectorSettings;
  public mapProjectsButtonDisabled = true;

  private selectedRexorProject: RexorProject;
  private selectedJiraProjects: Array<JiraProject>;

  constructor(private projectService: ProjectService, private ngProgress: NgProgress,
    private toastsManager: ToastsManager, private viewContainerRef: ViewContainerRef) {
    this.mappingSettigns = {
      parentName: 'Rexor Project',
      parentTable: this.getRexorProjectTableSettings(),
      childName: 'Jira Project',
      childTable: this.getJiraProjectTableSettings()
    };

    this.toastsManager.setRootViewContainerRef(this.viewContainerRef);
  }

  public ngOnInit() {
    this.ngProgress.start();
    this.projectService.getViewData().subscribe((projectViewData: ProjectViewData) => {
      this.mappingData = {
        parents: projectViewData.rexorProjects,
        children: projectViewData.unmappedJiraProjects
      };

      this.ngProgress.done();
    });

  }

  public updateJiraProjecstSelection(projects: Array<JiraProject>) {
    this.selectedJiraProjects = projects;
    this.toggleAddMappingsAction();
  }

  public updateRexorProjectSelection(project: RexorProject) {
    this.selectedRexorProject = project;
    this.toggleAddMappingsAction();
  }

  public addMappings() {
    this.ngProgress.start();
    this.projectService.addMappings(this.selectedRexorProject, this.selectedJiraProjects)
      .subscribe((jiraProjectRexorProjectEntities: JiraProjectRexorProjectEntity[]) => {

        _.remove(this.mappingData.children, (jiraProject: JiraProject) => _.includes(this.selectedJiraProjects, jiraProject) );
        this.mappingData = {
          parents: this.mappingData.parents,
          children: this.mappingData.children
        };

        this.ngProgress.done();
        this.toastsManager.success('Successfully added project mapping.', 'Success.');

      }, () => {
        this.toastsManager.error('Project mapping adding failed.', 'Failed.');
      });
  }

  private toggleAddMappingsAction() {
    this.mapProjectsButtonDisabled = _.isEmpty(this.selectedJiraProjects) || _.isEmpty(this.selectedRexorProject);
  }

  private getJiraProjectTableSettings() {
    return {
      pager: {
        display: true,
        perPage: 30
      },
      actions: false,
      noDataMessage: 'No data found',
      columns: {
        key: {
          title: 'Jira Project Key',
          filter: false,
          editable: false
        },
        name: {
          title: 'Jira Project Name',
          filter: false,
          editable: false
        }
      }
    };
  }

  private getRexorProjectTableSettings() {
    return {
      pager: {
        display: true,
        perPage: 30
      },
      actions: false,
      noDataMessage: 'No data found',
      columns: {
        id: {
          title: 'Rexor Project Id',
          filter: false,
          editable: false
        },
        description: {
          title: 'Rexor Project Description',
          filter: false,
          editable: false,
          valuePrepareFunction: (cell, row) => {
            if (_.isEmpty(cell)) {
              return 'Not defined.';
            }
            return cell;
          }
        }
      }
    };
  }
}
