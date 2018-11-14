import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { WorklogService } from '../worklog.service';
import { NgProgress } from 'ngx-progressbar';
import { LocalDataSource } from 'ng2-smart-table';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { ModalDialogService, SimpleModalComponent } from 'ngx-modal-dialog';
import { WorklogQueueViewData, WorklogTransfer } from '../../../data/common';
import { TableCellInputComponent } from '../../../ui/table-cell-input/table-cell-input.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-worklog-queue',
  templateUrl: './worklog-queue.component.html'
})
export class WorklogQueueComponent implements OnInit {

  private readyWorklogTransferArray: WorklogTransfer[];
  private failedWorklogTransferArray: WorklogTransfer[];

  public readyWorklogTransferTableSource: LocalDataSource;
  public failedWorklogTransferTableSource: LocalDataSource;

  public readyWorklogTransferTableSettings;
  public failedWorklogTransferTableSettings;

  constructor(private worklogService: WorklogService,
    private ngProgress: NgProgress, private toastsManager: ToastsManager,
    private modalService: ModalDialogService, private viewContainerRef: ViewContainerRef) {

    this.readyWorklogTransferTableSource = new LocalDataSource();
    this.failedWorklogTransferTableSource = new LocalDataSource();

    this.toastsManager.setRootViewContainerRef(this.viewContainerRef);
    this.readyWorklogTransferTableSettings = this.getReadyWorklogTransferTableSettings();
    this.failedWorklogTransferTableSettings = this.getFailedWorklogTransferTableSettings();
  }

  public ngOnInit() {
    this.getViewData();
  }

  public getViewData() {
    this.ngProgress.start();
    this.worklogService.getWorklogQueueViewData().subscribe((worklogQueueViewData: WorklogQueueViewData) => {
      this.readyWorklogTransferArray = worklogQueueViewData.readyWorklogTransferArray;
      this.failedWorklogTransferArray = worklogQueueViewData.failedWorklogTransferArray;

      this.readyWorklogTransferTableSource = new LocalDataSource(this.readyWorklogTransferArray);
      this.failedWorklogTransferTableSource = new LocalDataSource(this.failedWorklogTransferArray);

      this.ngProgress.done();
    }, (error) => {
      this.toastsManager.error('Failed reading queue data.', 'Failed.');
      console.log(error);
      this.ngProgress.done();
    });
  }

  private onDeleteFailedWorklogTransfer(worklogTransfer: WorklogTransfer) {
    this.modalService.openDialog(this.viewContainerRef, {
      title: 'Delete worklog transfer',
      childComponent: SimpleModalComponent,
      settings: {
        modalClass: 'modal',
        headerClass: 'modal-header',
        headerTitleClass: 'header-title',
        bodyClass: 'modal-body',
        footerClass: 'modal-footer'
      },
      data: { text: 'Are sure you want to delete worklog transfer?' },
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
            this.worklogService.deleteFailedWorklogTransfer(worklogTransfer.worklogId).subscribe(deletedWorklogTransfer => {

              _.remove(this.failedWorklogTransferArray, (failedWorklogTransfer: WorklogTransfer) => {
                return failedWorklogTransfer.id === deletedWorklogTransfer.id;
              });
              this.failedWorklogTransferTableSource = new LocalDataSource(this.failedWorklogTransferArray);
              this.ngProgress.done();
              this.toastsManager.success('Successfully deleted worklog transfer.', 'Success.');

            }, (error) => {
              console.log(error);
              this.ngProgress.done();
              this.toastsManager.error('Deleting worklog transfer failed.', 'Failed.');
            });
            return true;
          }
        }]
    });
  }

  private onOpenWorklogTransferLog(worklogTransfer: WorklogTransfer) {
    this.modalService.openDialog(this.viewContainerRef, {
      title: 'Worklog Transfer Log',
      childComponent: SimpleModalComponent,
      settings: {
        modalClass: 'modal',
        headerClass: 'modal-header',
        headerTitleClass: 'header-title',
        bodyClass: 'modal-body',
        footerClass: 'modal-footer'
      },
      data: { text: worklogTransfer.transferLog },
      actionButtons: [
        {
          text: 'Close',
          buttonClass: 'btn btn-secondary',
        }]
    });
  }

  private getReadyWorklogTransferTableSettings() {
    return {
      pager: {
        display: true,
        perPage: 30
      },
      noDataMessage: 'No data found',
      mode: 'inline',
      actions: false,
      columns: {
        worklogId: {
          title: 'Worklog Id',
          filter: false,
          editable: false
        },
        projectKey: {
          title: 'Project Key',
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
        username: {
          title: 'Username',
          filter: false,
          editable: false
        },
        createdBy: {
          title: 'Transfer created by',
          filter: false,
          editable: false
        },
        createdOn: {
          title: 'Transfer created on',
          filter: false,
          editable: false
        }
      }
    };
  }

  private getFailedWorklogTransferTableSettings() {
    const self = this;
    const worklogTransferTableSettings = this.getReadyWorklogTransferTableSettings();

    worklogTransferTableSettings.columns['transferLog'] = {
      title: '',
      type: 'custom',
      filter: false,
      renderComponent: TableCellInputComponent,
      onComponentInitFunction(instance) {
        instance.type = 'button';
        instance.inputValue = 'Log';
        instance.cssClass = 'btn btn-info text-white';
        instance.click.subscribe((worklogTransfer: WorklogTransfer) => self.onOpenWorklogTransferLog(worklogTransfer));
      }
    };

    worklogTransferTableSettings.columns['delete'] = {
      title: '',
      type: 'custom',
      filter: false,
      renderComponent: TableCellInputComponent,
      onComponentInitFunction(instance) {
        instance.type = 'button';
        instance.inputValue = 'Delete';
        instance.cssClass = 'btn btn-danger text-white';
        instance.click.subscribe((worklogTransfer: WorklogTransfer) => self.onDeleteFailedWorklogTransfer(worklogTransfer));
      }
    };

    return worklogTransferTableSettings;
  }
}
