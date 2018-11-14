import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { NgProgress } from 'ngx-progressbar';
import { LocalDataSource } from 'ng2-smart-table';
import { ModalDialogService, SimpleModalComponent } from 'ngx-modal-dialog';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { ProjectViewData, ProjectMapping, JiraProject } from '../../data/common';
import { ProjectService } from './project.service';
import { TableCellInputComponent } from '../../ui/table-cell-input/table-cell-input.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html'
})
export class ProjectComponent implements OnInit {

  public mappedProjectTableSource: LocalDataSource;
  public mappedProjectTableSettings;

  public unmappedProjectTableSource: LocalDataSource;
  public unmappedProjectTableSettings;

  private unmappedProjects: JiraProject[];
  private projectMappings: ProjectMapping[];


  constructor(private router: Router, private projectService: ProjectService,
    private ngProgress: NgProgress, private toastsManager: ToastsManager,
    private modalService: ModalDialogService, private viewContainerRef: ViewContainerRef) {

    this.mappedProjectTableSource = new LocalDataSource();
    this.unmappedProjectTableSource = new LocalDataSource();
    this.mappedProjectTableSettings = this.getMappedProjectTableSettings();
    this.unmappedProjectTableSettings = this.getUnmappedProjectTableSettings();

    this.toastsManager.setRootViewContainerRef(viewContainerRef);
  }

  public ngOnInit() {
    this.ngProgress.start();

    this.projectService.getViewData().subscribe((projectViewData: ProjectViewData) => {

      this.unmappedProjects = projectViewData.unmappedJiraProjects;
      this.projectMappings = projectViewData.projectMappings;

      this.mappedProjectTableSource = new LocalDataSource(projectViewData.projectMappings);
      this.unmappedProjectTableSource = new LocalDataSource(projectViewData.unmappedJiraProjects);

      this.ngProgress.done();
    });
  }

  private onMapIssueTypesClick(projectMapping: ProjectMapping) {
    this.router.navigate([`/project/${projectMapping.id}/${projectMapping.jiraProjectId}/${projectMapping.rexorProjectUid}/issue-type/mapping`]);
  }

  private onSetupAsAbsenceClick(projectMapping: ProjectMapping) {
    this.router.navigate([`/project/${projectMapping.id}/${projectMapping.jiraProjectId}/${projectMapping.rexorProjectUid}/absence`]);
  }

  private onDeleteProjectMappingClick(projectMapping: ProjectMapping) {

    this.modalService.openDialog(this.viewContainerRef, {
      title: 'Delete project mapping',
      childComponent: SimpleModalComponent,
      settings: {
        modalClass: 'modal',
        headerClass: 'modal-header',
        headerTitleClass: 'header-title',
        bodyClass: 'modal-body',
        footerClass: 'modal-footer'
      },
      data: { text: 'Are sure you want to delete project mapping?' },
      actionButtons: [
        {
          text: 'No',
          buttonClass: 'btn btn-secondary',
        },
        {
          text: 'Yes',
          buttonClass: 'btn btn-danger',
          onAction: () => {
            this.ngProgress.start();
            this.projectService.deleteMapping(projectMapping.id).subscribe(deletedProjectMapping => {

              _.remove(this.projectMappings, (mapping: ProjectMapping) => {
                return mapping.id === projectMapping.id;
              });

              this.mappedProjectTableSource = new LocalDataSource(this.projectMappings);

              const unmappedJiraProject: JiraProject = {
                id: projectMapping.jiraProjectId,
                key: projectMapping.jiraProjectKey,
                name: projectMapping.jiraProjectName
              };

              this.unmappedProjects.push(unmappedJiraProject);
              this.unmappedProjectTableSource = new LocalDataSource(this.unmappedProjects);
              this.ngProgress.done();
              this.toastsManager.success('Successfully deleted project mapping.', 'Success.');

            }, () => {
              this.toastsManager.error('Deleting project mapping failed.', 'Failed.');
            });
            return true;
          }
        }]
    });
  }

  private getMappedProjectTableSettings() {
    const self = this;
    return {
      pager: {
        display: true,
        perPage: 30
      },
      noDataMessage: 'No data found',
      mode: 'inline',
      actions: false,
      columns: {
        jiraProjectKey: {
          title: 'Jira Project Key',
          filter: false,
          editable: false
        },
        jiraProjectName: {
          title: 'Jira Project Name',
          filter: false,
          editable: false
        },
        rexorProjectId: {
          title: 'Rexor Project Id',
          filter: false,
          editable: false
        },
        rexorProjectDescription: {
          title: 'Rexor Project Description',
          filter: false,
          editable: false,
          valuePrepareFunction: (cell, row) => {
            if (_.isEmpty(cell)) {
              return 'Not defined.';
            }
            return cell;
          }
        },
        setupAsAbsence: {
          title: '',
          type: 'custom',
          filter: false,
          renderComponent: TableCellInputComponent,
          onComponentInitFunction(instance) {
            instance.type = 'button';
            instance.inputValue = 'Setup as Absence';
            instance.cssClass = 'btn btn-primary text-white';
            instance.click.subscribe((projectMapping) => self.onSetupAsAbsenceClick(projectMapping));
          }

        },
        mapIssueTypes: {
          title: '',
          type: 'custom',
          filter: false,
          renderComponent: TableCellInputComponent,
          onComponentInitFunction(instance) {
            instance.type = 'button';
            instance.inputValue = 'Map Issue Types';
            instance.cssClass = 'btn btn-primary text-white';
            instance.click.subscribe((projectMapping) => self.onMapIssueTypesClick(projectMapping));
          }

        },
        deleteProjectMapping: {
          title: '',
          type: 'custom',
          filter: false,
          renderComponent: TableCellInputComponent,
          onComponentInitFunction(instance) {
            instance.type = 'button';
            instance.inputValue = 'Delete';
            instance.cssClass = 'btn btn-danger text-white';
            instance.click.subscribe((projectMapping: ProjectMapping) => self.onDeleteProjectMappingClick(projectMapping));
          }
        }
      }
    };
  }

  private getUnmappedProjectTableSettings() {
    return {
      pager: {
        display: true,
        perPage: 30
      },
      actions: false,
      noDataMessage: 'No data found',
      columns: {
        key: {
          title: 'Key',
          filter: false,
          editable: false
        },
        name: {
          title: 'Name',
          filter: false,
          editable: false
        }
      }
    };
  }
}

