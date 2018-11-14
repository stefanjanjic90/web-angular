import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { IssueTypeMappingService } from './issue-type-mapping.service';
import { IssueTypeViewData, ProjectMapping, IssueTypeMapping, IssueType, ProjectActivity } from '../../../data/common';
import { OneToManySelectorData, OneToManySelectorSettings } from '../../../ui/one-to-many-selector/one-to-many-selector.component';
import { ActivatedRoute } from '@angular/router';
import { TableCellInputComponent } from '../../../ui/table-cell-input/table-cell-input.component';
import { ModalDialogService, SimpleModalComponent } from 'ngx-modal-dialog';
import { LocalDataSource } from 'ng2-smart-table';
import { NgProgress } from 'ngx-progressbar';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import 'rxjs/add/operator/mergeMap';
import * as _ from 'lodash';

@Component({
  selector: 'app-issue-type-mapping',
  templateUrl: './issue-type-mapping.component.html'
})
export class IssueTypeMappingComponent implements OnInit {

  public mappedIssueTypeTableSource: LocalDataSource;
  public mappedIssueTypeTableSettings;

  public mappingData: OneToManySelectorData;
  public mappingSettigns: OneToManySelectorSettings;
  public mapIssueTypesButtonDisabled = true;

  private selectedProjectActivity: ProjectActivity;
  private selectedIssueTypes: Array<IssueType>;

  private selectedProjectMapping: ProjectMapping;
  private issueTypeMappings: IssueTypeMapping[];
  private unmappedIssueTypes: IssueType[];
  private projectActivities: ProjectActivity[];

  constructor(private activatedRoute: ActivatedRoute, private issueTypeMappingService: IssueTypeMappingService,
    private ngProgress: NgProgress, private toastsManager: ToastsManager,
    private modalService: ModalDialogService, private viewContainerRef: ViewContainerRef) {

    this.mappedIssueTypeTableSettings = this.getMappedIssueTypeTableSettings();

    this.mappingSettigns = {
      parentName: 'Project Activities',
      parentTable: this.getProjectActivityTableSettings(),
      childName: 'Issue Types',
      childTable: this.getIssueTypeTableSettings()
    };

    this.toastsManager.setRootViewContainerRef(this.viewContainerRef);
  }

  public ngOnInit() {
    this.ngProgress.start();

    this.activatedRoute.params.mergeMap((projectMapping: ProjectMapping) => {
      this.selectedProjectMapping = projectMapping;
      return this.issueTypeMappingService.getViewData(this.selectedProjectMapping);
    }).subscribe((issueTypeViewData: IssueTypeViewData) => {

      this.mappingData = {
        parents: issueTypeViewData.projectActivities,
        children: issueTypeViewData.unmappedIssueTypes
      };

      this.issueTypeMappings = issueTypeViewData.issueTypeMappings;
      this.unmappedIssueTypes = issueTypeViewData.unmappedIssueTypes;
      this.projectActivities = issueTypeViewData.projectActivities;

      this.mappedIssueTypeTableSource = new LocalDataSource(issueTypeViewData.issueTypeMappings);

      this.ngProgress.done();
    });
  }

  public updateIssueTypeSelection(issueTypes: Array<IssueType>) {
    this.selectedIssueTypes = issueTypes;
    this.toggleAddMappingsAction();
  }

  public updateProjectActivitySelection(projectActivity: ProjectActivity) {
    this.selectedProjectActivity = projectActivity;
    this.toggleAddMappingsAction();
  }

  public addMappings() {
    this.ngProgress.start();
    this.issueTypeMappingService.add(this.selectedProjectMapping, this.selectedProjectActivity, this.selectedIssueTypes)
      .subscribe((issueTypeMappings: IssueTypeMapping[]) => {

        this.issueTypeMappings = _.clone(this.issueTypeMappings.concat(issueTypeMappings));
        this.mappedIssueTypeTableSource = new LocalDataSource(this.issueTypeMappings);

        _.remove(this.mappingData.children, (issueType: IssueType) => _.includes(this.selectedIssueTypes, issueType) );
        this.mappingData = {
          parents: this.mappingData.parents,
          children: this.mappingData.children
        };

        this.emptySelections();
        this.ngProgress.done();
        this.toastsManager.success('Successfully added issue type mapping.', 'Success.');
      }, () => {
        this.toastsManager.error('Issue type mapping adding failed.', 'Failed.');
      });
  }

  private onDeleteIssueTypeMappingClick(issueTypeMapping: IssueTypeMapping) {
    this.modalService.openDialog(this.viewContainerRef, {
      title: 'Delete issue type mapping',
      childComponent: SimpleModalComponent,
      settings: {
        modalClass: 'modal',
        headerClass: 'modal-header',
        headerTitleClass: 'header-title',
        bodyClass: 'modal-body',
        footerClass: 'modal-footer'
      },
      data: { text: 'Are sure you want to delete issue type mapping?' },
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
            this.issueTypeMappingService.delete(issueTypeMapping.id).subscribe(deletedIssueTypeMapping => {

              _.remove(this.issueTypeMappings, (mapping: IssueTypeMapping) => {
                return mapping.id === issueTypeMapping.id;
              });

              this.mappedIssueTypeTableSource = new LocalDataSource(this.issueTypeMappings);

              const unmappedIssueType: IssueType = {
                id: issueTypeMapping.issueTypeId,
                name: issueTypeMapping.issueTypeName,
                description: issueTypeMapping.issueTypeDescription
              };

              this.unmappedIssueTypes.push(unmappedIssueType);

              const self = this;
              this.mappingData = {
                parents: self.projectActivities,
                children: self.unmappedIssueTypes
              };

              this.ngProgress.done();
              this.toastsManager.success('Successfully deleted issue type mapping.', 'Success.');

            }, () => {
              this.toastsManager.error('Deleting project issue type failed.', 'Failed.');
            });
            return true;
          }
        }]
    });
  }

  private emptySelections() {
    this.selectedIssueTypes = [];
    this.selectedProjectActivity = null;
    this.toggleAddMappingsAction();
  }

  private toggleAddMappingsAction() {
    this.mapIssueTypesButtonDisabled = _.isEmpty(this.selectedIssueTypes) || _.isEmpty(this.selectedProjectActivity);
  }

  private getIssueTypeTableSettings() {
    return {
      pager: {
        display: true,
        perPage: 30
      },
      actions: false,
      noDataMessage: 'No data found',
      columns: {
        name: {
          title: 'Name',
          filter: false,
          editable: false
        },
        description: {
          title: 'Description',
          filter: false,
          editable: false
        }
      }
    };
  }

  private getProjectActivityTableSettings() {
    return {
      pager: {
        display: true,
        perPage: 30
      },
      actions: false,
      noDataMessage: 'No data found',
      columns: {
        id: {
          title: 'Id',
          filter: false,
          editable: false
        },
        description: {
          title: 'Description',
          filter: false,
          editable: false
        }
      }
    };
  }

  private getMappedIssueTypeTableSettings() {
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
        issueTypeName: {
          title: 'Issue Type Name',
          filter: false,
          editable: false
        },
        issueTypeDescription: {
          title: 'Issue Type Description',
          filter: false,
          editable: false
        },
        projectActivityId: {
          title: 'Project Activity Id',
          filter: false,
          editable: false
        },
        projectActivityDescription: {
          title: 'Project Activity Description',
          filter: false,
          editable: false
        },
        deleteIssueTypeMapping: {
          title: '',
          type: 'custom',
          filter: false,
          renderComponent: TableCellInputComponent,
          onComponentInitFunction(instance) {
            instance.type = 'button';
            instance.inputValue = 'Delete';
            instance.cssClass = 'btn btn-danger text-white';
            instance.click.subscribe((issueTypeMapping: IssueTypeMapping) => self.onDeleteIssueTypeMappingClick(issueTypeMapping));
          }
        }
      }
    };
  }
}
