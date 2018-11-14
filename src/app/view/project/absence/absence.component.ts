import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { AbsenceService } from './absence.service';
import { AbsenceViewData, ProjectMapping, IssueMapping, Issue, TimeCode } from '../../../data/common';
import { AbsenceEntity, IssueTimeCodeEntity } from '../../../data/entity';
import { OneToManySelectorData, OneToManySelectorSettings } from '../../../ui/one-to-many-selector/one-to-many-selector.component';
import { ActivatedRoute } from '@angular/router';
import { TableCellInputComponent } from '../../../ui/table-cell-input/table-cell-input.component';
import { ModalDialogService, SimpleModalComponent } from 'ngx-modal-dialog';
import { LocalDataSource } from 'ng2-smart-table';
import { NgProgress } from 'ngx-progressbar';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import * as _ from 'lodash';

@Component({
  selector: 'app-absence',
  templateUrl: './absence.component.html'
})
export class AbsenceComponent implements OnInit {

  public mappedIssueTableSource: LocalDataSource;
  public mappedIssueTableSettings;

  public mappingData: OneToManySelectorData;
  public mappingSettigns: OneToManySelectorSettings;
  public mapIssuesButtonDisabled = true;
  public saveAbsenceButtonDisabled = true;
  public deleteAbsenceButtonDisabled = true;

  public classificationId: string;
  private absenceEntityId: number;
  private issueMappings: IssueMapping[];

  private selectedTimeCode: TimeCode;
  private selectedIssues: Array<Issue>;

  private unmappedIssues: Issue[];
  private timeCodes: TimeCode[];

  private selectedProjectMapping: ProjectMapping;

  constructor(private activatedRoute: ActivatedRoute, private absenceService: AbsenceService,
    private ngProgress: NgProgress, private toastsManager: ToastsManager,
    private modalService: ModalDialogService, private viewContainerRef: ViewContainerRef) {

    this.mappedIssueTableSettings = this.getMappedIssueTableSettings();

    this.mappingSettigns = {
      parentName: 'Time Codes',
      parentTable: this.getTimeCodeTableSettings(),
      childName: 'Issues',
      childTable: this.getIssueTableSettings()
    };
    this.toastsManager.setRootViewContainerRef(this.viewContainerRef);
  }

  ngOnInit() {
    this.ngProgress.start();
    this.activatedRoute.params.mergeMap((projectMapping: ProjectMapping) => {
      this.selectedProjectMapping = projectMapping;
      return this.absenceService.getViewData(this.selectedProjectMapping);
    }).subscribe((absenceViewData: AbsenceViewData) => {

      this.absenceEntityId = absenceViewData.absenceEntityId;
      this.classificationId = absenceViewData.classificationId;

      this.mappingData = {
        parents: absenceViewData.timeCodes,
        children: absenceViewData.unmappedIssues
      };

      this.issueMappings = absenceViewData.issueMappings;
      this.unmappedIssues = absenceViewData.unmappedIssues;
      this.timeCodes = absenceViewData.timeCodes;

      this.mappedIssueTableSource = new LocalDataSource(absenceViewData.issueMappings);

      this.toggleSaveAbsenceAction();
      this.toggleDeleteAbsenceAction();
      this.ngProgress.done();
    });
  }

  public addMappings() {

    const issueMappings: IssueMapping[] = [];
    for (const selectedIssue of this.selectedIssues) {
      const issueMapping: IssueMapping = {
        issueId: selectedIssue.id,
        issueKey: selectedIssue.key,
        issueSummary: selectedIssue.summary,
        timeCodeUid: this.selectedTimeCode.uid,
        timeCodeId: this.selectedTimeCode.id,
        timeCodeTimeType: this.selectedTimeCode.timeType,
        timeCodeDescription: this.selectedTimeCode.description
      };
      issueMappings.push(issueMapping);
    }

    this.issueMappings = _.clone(this.issueMappings.concat(issueMappings));
    this.mappedIssueTableSource = new LocalDataSource(this.issueMappings);

    _.remove(this.mappingData.children, (issue: Issue) => _.includes(this.selectedIssues, issue));
    this.mappingData = {
      parents: this.mappingData.parents,
      children: this.mappingData.children
    };

    this.emptySelections();
    this.toggleSaveAbsenceAction();
  }

  public saveAbsence() {
    this.ngProgress.start();

    const absenceEntity: AbsenceEntity = {
      id: this.absenceEntityId,
      classificationId: this.classificationId,
      issueTimeCodeEntities: [],
      jiraProjectRexorProjectId: this.selectedProjectMapping.id
    };

    for (const issueMapping of this.issueMappings) {
      const issueTimeCodeEntity: IssueTimeCodeEntity = {
        issueId: issueMapping.issueId,
        timeCodeUid: issueMapping.timeCodeUid,
        absenceId: this.absenceEntityId
      };
      absenceEntity.issueTimeCodeEntities.push(issueTimeCodeEntity);
    }

    this.absenceService.saveAbsenceEntity(absenceEntity)
      .subscribe((savedAbsenceEntity: AbsenceEntity) => {

        this.absenceEntityId = savedAbsenceEntity.id;
        const issueTimeCodeEntityMap: { [key: string]: IssueTimeCodeEntity } = _.keyBy(savedAbsenceEntity.issueTimeCodeEntities, 'issueId');
        for (const issueMapping of this.issueMappings) {
          issueMapping.id = issueTimeCodeEntityMap[issueMapping.issueId].id;
        }

        this.toggleDeleteAbsenceAction();

        this.toastsManager.success('Successfully saved absence mapping.', 'Success.');
        this.ngProgress.done();
      }, (error) => {
        console.log(error);
        this.toastsManager.error('Failed to save absence mapping.', 'Failed.');
        this.ngProgress.done();
      });
  }

  public deleteAbsence() {
    this.modalService.openDialog(this.viewContainerRef, {
      title: 'Delete Absence Setup',
      childComponent: SimpleModalComponent,
      settings: {
        modalClass: 'modal',
        headerClass: 'modal-header',
        headerTitleClass: 'header-title',
        bodyClass: 'modal-body',
        footerClass: 'modal-footer'
      },
      data: { text: 'Are sure you want to delete Absence setup for this project mapping?' },
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
            this.absenceService.deleteAbsenceEntity(this.absenceEntityId)
              .subscribe(() => {
                this.absenceEntityId = null;
                this.classificationId = null;
                this.issueMappings = [];
                this.mappedIssueTableSource = new LocalDataSource(this.issueMappings);
                this.toggleSaveAbsenceAction();
                this.toggleDeleteAbsenceAction();
                this.toastsManager.success('Successfully deleted absence setup.', 'Success.');
                this.ngProgress.done();
              }, (error) => {
                console.log(error);
                this.toastsManager.error('Failed to delete absence setup.', 'Failed.');
                this.ngProgress.done();
              });
            return true;
          }
        }]
    });
  }

  public updateIssueSelection(issues: Array<Issue>) {
    this.selectedIssues = issues;
    this.toggleAddMappingsAction();
  }

  public updateTimeCodeSelection(timeCode: TimeCode) {
    this.selectedTimeCode = timeCode;
    this.toggleAddMappingsAction();
  }

  public onClassificationIdChange(classificationId) {
    this.classificationId = classificationId;
    this.toggleSaveAbsenceAction();
  }

  private toggleAddMappingsAction() {
    this.mapIssuesButtonDisabled = _.isEmpty(this.selectedIssues) || _.isEmpty(this.selectedTimeCode);
  }

  private toggleSaveAbsenceAction() {
    this.saveAbsenceButtonDisabled = _.isEmpty(this.classificationId) || _.isEmpty(this.issueMappings);
  }

  private toggleDeleteAbsenceAction() {
    this.deleteAbsenceButtonDisabled = this.absenceEntityId === undefined || this.absenceEntityId === null;
  }

  private emptySelections() {
    this.selectedIssues = [];
    this.selectedTimeCode = null;
    this.toggleAddMappingsAction();
  }

  private onRemoveIssueMappingClick(issueMapping: IssueMapping) {
    _.remove(this.issueMappings, (mapping: IssueMapping) => {
      return mapping.issueId === issueMapping.issueId;
    });

    this.mappedIssueTableSource = new LocalDataSource(this.issueMappings);

    const unmappedIssue: Issue = {
      id: issueMapping.issueId,
      key: issueMapping.issueKey,
      summary: issueMapping.issueSummary
    };

    this.unmappedIssues.push(unmappedIssue);

    const self = this;
    this.mappingData = {
      parents: self.timeCodes,
      children: self.unmappedIssues
    };

    this.toggleSaveAbsenceAction();
  }

  private getMappedIssueTableSettings() {
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
        issueId: {
          title: 'Issue Id',
          filter: false,
          editable: false
        },
        issueKey: {
          title: 'Issue Key',
          filter: false,
          editable: false
        },
        issueSummary: {
          title: 'Issue Summary',
          filter: false,
          editable: false
        },
        timeCodeId: {
          title: 'Time Code Id',
          filter: false,
          editable: false
        },
        timeCodeTimeType: {
          title: 'Time Type',
          filter: false,
          editable: false
        },
        timeCodeDescription: {
          title: 'Description',
          filter: false,
          editable: false
        },
        removeIssueMapping: {
          title: '',
          type: 'custom',
          filter: false,
          renderComponent: TableCellInputComponent,
          onComponentInitFunction(instance) {
            instance.type = 'button';
            instance.inputValue = 'Remove';
            instance.cssClass = 'btn btn-danger text-white';
            instance.click.subscribe((issueMapping: IssueMapping) => self.onRemoveIssueMappingClick(issueMapping));
          }
        }
      }
    };
  }

  private getTimeCodeTableSettings() {
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
        timeType: {
          title: 'Time type',
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

  private getIssueTableSettings() {
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
        key: {
          title: 'Key',
          filter: false,
          editable: false
        },
        summary: {
          title: 'Summary',
          filter: false,
          editable: false
        }
      }
    };
  }
}
