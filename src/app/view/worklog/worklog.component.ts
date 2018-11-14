import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { NgProgress } from 'ngx-progressbar';
import { LocalDataSource } from 'ng2-smart-table';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { WorklogService } from '../worklog/worklog.service';
import { WorklogViewData, JiraProject, JiraUser } from '../../data/common';
import { WorklogEntity } from '../../data/entity';
import { TableCellInputComponent } from '../../ui/table-cell-input/table-cell-input.component';
import { ProjectService } from '../project/project.service';
import 'rxjs/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';
import 'rxjs/observable/empty';
import 'rxjs/observable/forkJoin';
import * as _ from 'lodash';

interface Selection {
    displayName: string;
    key: string;
}

@Component({
    selector: 'app-worklog',
    templateUrl: './worklog.component.html'
})
export class WorklogComponent implements OnInit {

    public selectedWorklogs: WorklogEntity[] = [];

    public transferredWorklogsTableSource: LocalDataSource;
    public worklogsTableSource: LocalDataSource;

    public transferredWorklogsTableSettings;
    public worklogsTableSettings;

    public projects: Selection[] = [];
    public selectedProject: Selection;
    private defaultProjectSelection: Selection;

    public users: Selection[];
    public selectedUser: Selection;
    private defaultUserSelection: Selection;

    public selectedFromDate: string;
    public selectedToDate: string;

    public toogleDatePicker = false;

    public transferedWorklogs: WorklogEntity[] = [];
    public worklogs: WorklogEntity[] = [];

    public selectUserActionDisabled = true;
    public transferWorklogsActionDisabled = true;

    constructor(private worklogService: WorklogService, private projectService: ProjectService,
        private ngProgress: NgProgress, private toastsManager: ToastsManager,
        private viewContainerRef: ViewContainerRef) {

        this.defaultProjectSelection = { displayName: 'All projects', key: '' };
        this.defaultUserSelection = { displayName: 'All users', key: '' };

        this.transferredWorklogsTableSource = new LocalDataSource();
        this.worklogsTableSource = new LocalDataSource();

        this.transferredWorklogsTableSettings = this.getTransferredWorklogsTableSettings();
        this.worklogsTableSettings = this.getWorklogsTableSettings();

        this.toastsManager.setRootViewContainerRef(this.viewContainerRef);
    }

    public ngOnInit() {
        this.ngProgress.start();
        this.selectedProject = this.defaultProjectSelection;
        this.projects.push(this.defaultProjectSelection);
        this.projectService.getJiraProjects().subscribe((jiraProjects: JiraProject[]) => {
            jiraProjects = _.sortBy(jiraProjects, ['key']);
            this.projects = _.concat(this.projects,
                _.map(jiraProjects, (jiraProject) => {
                    return { displayName: jiraProject.key, key: jiraProject.key };
                }));
            this.ngProgress.done();
        });

        this.users = [];
        this.users.push(this.defaultUserSelection);
        this.selectedUser = this.defaultUserSelection;

        const date = new Date();
        this.selectedToDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
        date.setDate(date.getDate() - 30);
        this.selectedFromDate = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
    }

    public selectAllWorklogs() {
        this.selectedWorklogs = _.clone(_.filter(this.worklogs, (worklog) => {
            return worklog.approvalStatus === 'approved';
        }));
        this.worklogsTableSource = new LocalDataSource(this.worklogs);
        this.transferWorklogsActionToggle();
    }

    public deselectAllWorklogs() {
        this.selectedWorklogs = [];
        this.worklogsTableSource = new LocalDataSource(this.worklogs);
        this.transferWorklogsActionToggle();
    }

    public toggleSelectUserAction() {
        this.selectUserActionDisabled = _.isEmpty(this.selectedProject) || _.isEqual(this.selectedProject, this.defaultProjectSelection);
    }

    selectPeriod(event) {
        this.selectedFromDate = event.fromDate.year + '-' + event.fromDate.month + '-' + event.fromDate.day;
        this.selectedToDate = event.toDate.year + '-' + event.toDate.month + '-' + event.toDate.day;
        this.toogleDatePicker = false;
    }

    public onProjectSelect(event) {
        this.selectedProject = event;
        this.selectedUser = this.defaultUserSelection;
        if (_.isEqual(this.selectedProject, this.defaultProjectSelection)) {
            this.toggleSelectUserAction();
        } else {
            this.ngProgress.start();
            this.users = [];
            this.users.push(this.defaultUserSelection);
            this.selectedUser = this.defaultUserSelection;

            this.projectService.getUsers(this.selectedProject.key)
                .subscribe((jiraUsers: JiraUser[]) => {
                    _.forEach(jiraUsers, (jiraUser: JiraUser) => {
                        this.users.push({ displayName: jiraUser.key, key: jiraUser.key });
                    });
                    this.toggleSelectUserAction();
                    this.ngProgress.done();
                });
        }
    }

    transferWorklogsActionToggle() {
        this.transferWorklogsActionDisabled = (this.selectedWorklogs.length > 0) ? false : true;
    }

    toogleDatePickerAction() {
        this.toogleDatePicker = !this.toogleDatePicker;
    }

    getVisibilityStyle() {
        return this.toogleDatePicker ? { 'visibility': 'visible' } : { 'visibility': 'hidden' };
    }

    getViewData() {
        this.ngProgress.start();

        this.selectedWorklogs = [];
        this.worklogService.getWorklogViewData(this.selectedFromDate, this.selectedToDate, this.selectedProject.key, this.selectedUser.key).subscribe(
            (viewData: WorklogViewData) => {
                this.transferedWorklogs = viewData.transferedWorklogs;
                this.worklogs = viewData.worklogs;

                this.transferredWorklogsTableSource = new LocalDataSource(viewData.transferedWorklogs);
                this.worklogsTableSource = new LocalDataSource(viewData.worklogs);

                this.ngProgress.done();
                this.toastsManager.info('Successfully fetched worklog data.', 'Info.');
            }, (error) => {
                console.log(error);
                this.ngProgress.done();
                this.toastsManager.error('Failed to fetch worklog data.', 'Failed.');
            });
    }

    transferWorklogs() {
        this.ngProgress.start();
        this.worklogService.transferWorklogs(this.selectedWorklogs)
            .subscribe((response: any) => {

                this.worklogs = _.differenceBy(this.worklogs, this.selectedWorklogs, 'id');
                this.worklogsTableSource = new LocalDataSource(this.worklogs);

                this.selectedWorklogs = [];
                this.transferWorklogsActionToggle();

                this.ngProgress.done();
                this.toastsManager.info(`Successfully sent worklogs for transfer.`, 'Info.');
            }, (error) => {
                this.toastsManager.error(`Unable to send worklogs for transfer`, 'Failed.');
                this.ngProgress.done();
                console.error(error);
            });
    }

    private getTransferredWorklogsTableSettings() {
        return {
            pager: {
                display: true,
                perPage: 100
            },
            noDataMessage: 'No data found',
            mode: 'inline',
            actions: false,
            columns: {
                id: {
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
                timeSpent: {
                    title: 'Time Spent',
                    filter: false,
                    editable: false
                },
                comment: {
                    title: 'Comment',
                    filter: false,
                    editable: false
                },
                workDate: {
                    title: 'Work Date',
                    filter: false,
                    editable: false
                },
                username: {
                    title: 'Username',
                    filter: false,
                    editable: false
                },
                location: {
                    title: 'Location',
                    filter: false,
                    editable: false
                },
            }
        };
    }

    private getWorklogsTableSettings() {
        const self = this;
        return {
            pager: {
                display: true,
                perPage: 100
            },
            actions: false,
            noDataMessage: 'No data found',
            columns: {
                id: {
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
                timeSpent: {
                    title: 'Time Spent',
                    filter: false,
                    editable: false
                },
                comment: {
                    title: 'Comment',
                    filter: false,
                    editable: false
                },
                workDate: {
                    title: 'Work Date',
                    filter: false,
                    editable: false
                },
                username: {
                    title: 'Username',
                    filter: false,
                    editable: false
                },
                location: {
                    title: 'Location',
                    filter: false,
                    editable: false
                },
                approvalStatus: {
                    title: 'Status',
                    filter: false,
                    editable: false
                },
                selectWorklogs: {
                    title: '',
                    type: 'custom',
                    filter: false,
                    renderComponent: TableCellInputComponent,
                    onComponentInitFunction(instance: TableCellInputComponent) {
                        instance.type = 'checkbox';
                        instance.ngInit = (instance: TableCellInputComponent) => {
                            if (_.includes(self.selectedWorklogs, instance.rowData)) {
                                instance.checked = true;
                            }
                            instance.disable = (instance.rowData.approvalStatus === 'approved') ? false : true;
                        };
                        instance.click.subscribe((selectedWorklog: WorklogEntity) => {
                            if (_.includes(self.selectedWorklogs, selectedWorklog)) {
                                _.remove(self.selectedWorklogs, (worklog) =>  _.isEqual(worklog, selectedWorklog) );
                            } else {
                                self.selectedWorklogs.push(selectedWorklog);
                            }
                            self.transferWorklogsActionToggle();
                        });

                    }
                }
            }
        };
    }
}
