import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ProjectUrl } from '../project.service';
import { ProjectMapping, AbsenceViewData, Issue, TimeCode, IssueMapping } from '../../../data/common';
import { AbsenceEntity } from '../../../data/entity';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';

@Injectable()
export class AbsenceService {

  private absenceUrl = '/absence';

  constructor(private http: HttpClient) { }

  public getViewData(projectMapping: ProjectMapping): Observable<AbsenceViewData> {

    return Observable.forkJoin(
      this.getAbsenceEntity(projectMapping.id),
      this.getIssues(projectMapping.jiraProjectId),
      this.getTimeCodes(projectMapping.rexorProjectUid)
    ).map(([absenceEntity, issues, timeCodes]: [AbsenceEntity, Issue[], TimeCode[]]): AbsenceViewData => {

      let absenceEntityId = this.getDefaultViewValues().absenceEntityId;
      let classificationId = this.getDefaultViewValues().classificationId;

      let unmappedIssues = issues;
      const issueMappings: IssueMapping[] = [];
      if (!_.isEmpty(absenceEntity)) {

        absenceEntityId = absenceEntity.id;
        classificationId = absenceEntity.classificationId;

        const issueMap = _.keyBy(issues, 'id');
        const timeCodeMap = _.keyBy(timeCodes, 'uid');

        for (const issueTimeCodeEntity of absenceEntity.issueTimeCodeEntities) {

          const issueMapping = this.createIssueMapping(
            issueTimeCodeEntity.id,
            issueMap[issueTimeCodeEntity.issueId],
            timeCodeMap[issueTimeCodeEntity.timeCodeUid]
          );
          issueMappings.push(issueMapping);
          _.unset(issueMap, issueTimeCodeEntity.issueId);
        }
        unmappedIssues = _.toArray(issueMap);
      }

      return {
        absenceEntityId: absenceEntityId,
        classificationId: classificationId,
        issueMappings: issueMappings,
        unmappedIssues: unmappedIssues,
        timeCodes: timeCodes
      };
    });
  }

  public getAbsenceEntity(jiraProjectRexorProjectId: number): Observable<AbsenceEntity> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('jiraProjectRexorProjectId', jiraProjectRexorProjectId.toString());
    return this.http.get(environment.apiBaseUrl + this.absenceUrl, { params: httpParams }) as Observable<AbsenceEntity>;
  }

  public saveAbsenceEntity(absenceEntity: AbsenceEntity): Observable<AbsenceEntity> {
    return this.http.post(environment.apiBaseUrl + this.absenceUrl, absenceEntity) as Observable<AbsenceEntity>;
  }

  public deleteAbsenceEntity(id: number): Observable<AbsenceEntity> {
    return this.http.delete(environment.apiBaseUrl + this.absenceUrl + `/${id}`) as Observable<AbsenceEntity>;
  }

  public getTimeCodes(rexorProjectUid: string): Observable<TimeCode[]> {
    return this.http.get(ProjectUrl.RexorProject + '/' + rexorProjectUid + '/time-code') as Observable<TimeCode[]>;
  }

  public getIssues(jiraProjectId: string): Observable<Issue[]> {
    return this.http.get(ProjectUrl.JiraProject + '/' + jiraProjectId + '/issue') as Observable<Issue[]>;
  }

  private getDefaultViewValues() {
    return {
      absenceEntityId: undefined,
      classificationId: 'Absence'
    };
  }

  private createIssueMapping(id, issue: Issue, timeCode: TimeCode): IssueMapping {
    return {
      id: id,
      issueId: issue.id,
      issueKey: issue.key,
      issueSummary: issue.summary,
      timeCodeUid: timeCode.uid,
      timeCodeId: timeCode.id,
      timeCodeTimeType: timeCode.timeType,
      timeCodeDescription: timeCode.description
    };
  }
}
