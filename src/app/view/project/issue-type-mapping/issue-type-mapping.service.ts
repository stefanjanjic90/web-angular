import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { IssueTypeViewData, ProjectMapping, IssueType, ProjectActivity, IssueTypeMapping } from '../../../data/common';
import { IssueTypeProjectActivityEntity } from '../../../data/entity';
import { ProjectUrl } from '../project.service';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/map';
import * as _ from 'lodash';
import { environment } from '../../../../environments/environment';

@Injectable()
export class IssueTypeMappingService {

    private issueTypeMappingUrl = '/issue-type-mapping';

    constructor(private http: HttpClient) { }

    public getViewData(projectMapping: ProjectMapping): Observable<IssueTypeViewData> {

        return Observable.forkJoin(
            this.getIssueTypeProjectActivityEntities(projectMapping.id),
            this.getIssueTypes(projectMapping.jiraProjectId),
            this.getProjectActivities(projectMapping.rexorProjectUid)
        ).map(([issueTypeProjectActivityEntities, issueTypes, projectActivities]: [IssueTypeProjectActivityEntity[], IssueType[], ProjectActivity[]]): IssueTypeViewData => {

            const issueTypeMap = _.keyBy(issueTypes, 'id');
            const projectActivityMap = _.keyBy(projectActivities, 'uid');

            const issueTypeMappings: IssueTypeMapping[] = [];
            for (const issueTypeProjectActivityEntity of issueTypeProjectActivityEntities) {

                const issueTypeMapping = this.createIssueTypeMapping(
                    issueTypeProjectActivityEntity.id,
                    issueTypeMap[issueTypeProjectActivityEntity.issueTypeId],
                    projectActivityMap[issueTypeProjectActivityEntity.projectActivityUid]
                );
                issueTypeMappings.push(issueTypeMapping);
                _.unset(issueTypeMap, issueTypeProjectActivityEntity.issueTypeId);
            }

            const unmappedIssueTypes = _.toArray(issueTypeMap);

            return {
                issueTypeMappings: issueTypeMappings,
                unmappedIssueTypes: unmappedIssueTypes,
                projectActivities: projectActivities
            };
        });
    }

    public getIssueTypeProjectActivityEntities(jiraProjectRexorProjectId: number): Observable<IssueTypeProjectActivityEntity[]> {
        let httpParams = new HttpParams();
        httpParams = httpParams.append('jiraProjectRexorProjectId', jiraProjectRexorProjectId.toString());
        return this.http.get(environment.apiBaseUrl + this.issueTypeMappingUrl, { params: httpParams }) as Observable<IssueTypeProjectActivityEntity[]>;
    }

    public add(projectMapping: ProjectMapping, projectActivity: ProjectActivity, issueTypes: IssueType[]): Observable<IssueTypeMapping[]> {

        const issueTypeProjectActivityEntities: IssueTypeProjectActivityEntity[] = [];

        for (const issueType of issueTypes) {
            issueTypeProjectActivityEntities.push({
                projectActivityUid: projectActivity.uid,
                issueTypeId: issueType.id,
                jiraProjectRexorProjectId: projectMapping.id
            });
        }
        return this.http.post(environment.apiBaseUrl + this.issueTypeMappingUrl, issueTypeProjectActivityEntities)
            .map((issueTypeProjectActivityEntities: IssueTypeProjectActivityEntity[]): IssueTypeMapping[] => {

                const issueTypeMap = _.keyBy(issueTypes, 'id');

                const issueTypeMappings: IssueTypeMapping[] = [];
                for (const issueTypeProjectActivityEntity of issueTypeProjectActivityEntities) {

                    const issueTypeMapping = this.createIssueTypeMapping(
                        issueTypeProjectActivityEntity.id,
                        issueTypeMap[issueTypeProjectActivityEntity.issueTypeId],
                        projectActivity
                    );
                    issueTypeMappings.push(issueTypeMapping);
                }

                return issueTypeMappings;
            });
    }

    public delete(id: number): Observable<IssueTypeProjectActivityEntity> {
        return this.http.delete(environment.apiBaseUrl + this.issueTypeMappingUrl + '/' + id) as Observable<IssueTypeProjectActivityEntity>;
    }

    public getProjectActivities(rexorProjectUid: string): Observable<ProjectActivity[]> {
        return this.http.get(ProjectUrl.RexorProject + '/' + rexorProjectUid + '/activity') as Observable<ProjectActivity[]>;
    }
    public getIssueTypes(jiraProjectId: string): Observable<IssueType[]> {
        return this.http.get(ProjectUrl.JiraProject + '/' + jiraProjectId + '/issue-type') as Observable<IssueType[]>;
    }

    private createIssueTypeMapping(id, issueType: IssueType, projectActivity: ProjectActivity): IssueTypeMapping {
        return {
            id: id,
            issueTypeId: issueType.id,
            issueTypeName: issueType.name,
            issueTypeDescription: issueType.description,
            projectActivityUid: projectActivity.uid,
            projectActivityId: projectActivity.id,
            projectActivityDescription: projectActivity.description,
        };
    }
}
