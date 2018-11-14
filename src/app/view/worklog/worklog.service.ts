import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WorklogViewData, WorklogQueueViewData, WorklogTransfer } from '../../data/common';
import { WorklogEntity, WorklogTransferEntity, WorklogTimeTransactionEntity } from '../../data/entity';
import { Observable, ObservableInput } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import * as _ from 'lodash';

export namespace WorklogUrl {
    export const Transfer = environment.apiBaseUrl + '/worklog/transfer';
    export const Worklogs = environment.apiBaseUrl + '/worklog';
    export const Transfered = environment.apiBaseUrl + '/worklog/transferred';
}

export const TransferStatusCd = {
    Ready: 'ready',
    Complete: 'complete',
    Failed: 'failed'
};

@Injectable()
export class WorklogService {

    constructor(private http: HttpClient) { }

    public transferWorklogs(worklogs: WorklogEntity[]): Observable<object> {
        return this.http.post(WorklogUrl.Transfer, worklogs);
    }

    public getWorklogViewData(dateFrom: string, dateTo: string, projectKey: string, username: string): Observable<WorklogViewData> {

        return this.getWorklogs(dateFrom, dateTo, projectKey)
            .mergeMap((worklogs: WorklogEntity[]): ObservableInput<{}> => {

                if (!_.isEmpty(username)) {
                    worklogs = _.filter(worklogs, (worklog: WorklogEntity) => {
                        return worklog.username === username;
                    });
                }

                const worklogIds: string[] = _.map(worklogs, 'id');

                let worklogTimeTransactionObservable: Observable<WorklogTimeTransactionEntity[]>;
                let readyWorklogTransfersObservable: Observable<WorklogTransferEntity[]>;
                let failedWorklogTransfersObservable: Observable<WorklogTransferEntity[]>;

                if (_.isEmpty(worklogIds)) {
                    worklogTimeTransactionObservable = Observable.of([]);
                    readyWorklogTransfersObservable = Observable.of([]);
                    failedWorklogTransfersObservable = Observable.of([]);
                } else {
                    worklogTimeTransactionObservable = this.getTransferedWorklogs(worklogIds);
                    readyWorklogTransfersObservable = this.getWorklogTransfers(TransferStatusCd.Ready);
                    failedWorklogTransfersObservable = this.getWorklogTransfers(TransferStatusCd.Failed);
                }

                return Observable.forkJoin([
                    Observable.of(worklogs),
                    worklogTimeTransactionObservable,
                    readyWorklogTransfersObservable,
                    failedWorklogTransfersObservable
                ]);

            }).map(([worklogs, worklogTimeTransactionEntities, readyWorklogTransferEntities, failedWorklogTransfersEntities]: [WorklogEntity[], WorklogTimeTransactionEntity[], WorklogTransferEntity[], WorklogTransferEntity[]]): WorklogViewData => {

                const worklogMap = _.keyBy(worklogs, 'id');

                // filter out alredy transfered worklogs
                const transferedWorklogs: WorklogEntity[] = this.filterWorklogMap(worklogMap, worklogTimeTransactionEntities, 'worklogId');
                // filter out worklogs that are queued for transfer (in ready state)
                this.filterWorklogMap(worklogMap, readyWorklogTransferEntities, 'worklogId');
                // filter out failed worklog transfers
                this.filterWorklogMap(worklogMap, failedWorklogTransfersEntities, 'worklogId');

                return {
                    transferedWorklogs: transferedWorklogs,
                    worklogs: _.values(worklogMap)
                };
            });
    }

    public getWorklogQueueViewData(): Observable<WorklogQueueViewData> {
        return Observable.forkJoin([
            this.getWorklogTransfers(TransferStatusCd.Ready),
            this.getWorklogTransfers(TransferStatusCd.Failed)
        ]).map(([readyWorklogTransferEntities, failedWorklogTransfersEntities]: [WorklogTransferEntity[], WorklogTransferEntity[]]) => {
            return {
                readyWorklogTransferArray: this.flattenWorklogTransferEntities(readyWorklogTransferEntities),
                failedWorklogTransferArray: this.flattenWorklogTransferEntities(failedWorklogTransfersEntities)
            };
        });
    }

    public deleteFailedWorklogTransfer(worklogId: string): Observable<WorklogTransferEntity> {
        return this.http.delete(WorklogUrl.Transfer + '/' + worklogId) as Observable<WorklogTransferEntity>;
    }

    private flattenWorklogTransferEntities(worklogTransferEntities: WorklogTransferEntity[]): WorklogTransfer[] {
        const worklogTransferArray: WorklogTransfer[] = [];
        for (const worklogTransferEntity of worklogTransferEntities) {
            const worklogTransfer: WorklogTransfer = {
                id: worklogTransferEntity.id,
                worklogId: worklogTransferEntity.worklogEntity.id,
                username: worklogTransferEntity.worklogEntity.username,
                timeSpent: worklogTransferEntity.worklogEntity.timeSpent,
                comment: worklogTransferEntity.worklogEntity.comment,
                approvalStatus: worklogTransferEntity.worklogEntity.approvalStatus,
                workDate: worklogTransferEntity.worklogEntity.workDate,
                issueKey: worklogTransferEntity.worklogEntity.issueKey,
                issueSummary: worklogTransferEntity.worklogEntity.issueSummary,
                issueTypeId: worklogTransferEntity.worklogEntity.issueTypeId,
                projectKey: worklogTransferEntity.worklogEntity.projectKey,
                location: worklogTransferEntity.worklogEntity.location,
                createdBy: worklogTransferEntity.createdBy,
                createdOn: worklogTransferEntity.createdOn,
                transferStatusCd: worklogTransferEntity.transferStatusCd,
                transferLog: worklogTransferEntity.transferLog,
                transferDate: worklogTransferEntity.transferDate
            };
            worklogTransferArray.push(worklogTransfer);
        }
        return worklogTransferArray;
    }

    private filterWorklogMap(worklogMap: { [key: string]: WorklogEntity }, filterArray: { [key: string]: any }[], filterKey?: string): WorklogEntity[] {
        const removedWorklogs = [];
        for (const filterObject of filterArray) {
            if (_.has(worklogMap, filterObject[filterKey])) {
                const worklog = worklogMap[filterObject[filterKey]];
                removedWorklogs.push(worklog);
                _.unset(worklogMap, filterObject[filterKey]);
            }
        }
        return removedWorklogs;
    }

    private getWorklogs(dateFrom: string, dateTo: string, projectKey: string): Observable<object> {

        let httpParams = new HttpParams();
        httpParams = httpParams.append('dateFrom', dateFrom).append('dateTo', dateTo);
        httpParams = !_.isEmpty(projectKey) ? httpParams.append('projectKey', projectKey) : httpParams;

        return this.http.get(WorklogUrl.Worklogs, { params: httpParams });
    }

    private getTransferedWorklogs(worklogIds: string[]): Observable<WorklogTimeTransactionEntity[]> {
        return this.http.post(WorklogUrl.Transfered, worklogIds) as Observable<WorklogTimeTransactionEntity[]>;
    }

    private getWorklogTransfers(transferStatusCd: string): Observable<WorklogTransferEntity[]> {
        let httpParams = new HttpParams();
        httpParams = httpParams.append('transferStatusCd', transferStatusCd);
        return this.http.get(WorklogUrl.Transfer, { params: httpParams }) as Observable<WorklogTransferEntity[]>;
    }
}
