import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import * as _ from 'lodash';
import { ProjectViewData, ProjectMapping, JiraProject, RexorProject, JiraUser } from '../../data/common';
import { JiraProjectRexorProjectEntity } from '../../data/entity';
import { environment } from '../../../environments/environment';

export namespace ProjectUrl {
    export const Mapping = environment.apiBaseUrl + '/' + 'project-mapping';
    export const JiraProject = environment.apiBaseUrl + '/' + 'jira-project';
    export const RexorProject = environment.apiBaseUrl + '/' + 'rexor-project';
}
export namespace UserUrl {
    export const JiraUser = environment.apiBaseUrl + '/' + 'jira-user';
}

@Injectable()
export class ProjectService {

    constructor(private http: HttpClient) { }

    public getViewData(): Observable<ProjectViewData> {
        return Observable.forkJoin(
            this.getJiraProjectRexorProjectEntities(),
            this.getJiraProjects(),
            this.getRexorProjects()
        ).map(([jiraProjectRexorProjectEntities, jiraProjects, rexorProjects]: [JiraProjectRexorProjectEntity[], JiraProject[], RexorProject[]]): ProjectViewData => {

            const jiraProjectMap = _.keyBy(jiraProjects, 'id');
            const rexorProjectMap = _.keyBy(rexorProjects, 'uid');

            const projectMappings: ProjectMapping[] = [];
            for (const jiraProjectRexorProjectEntity of jiraProjectRexorProjectEntities) {

                const projectMapping = this.createProjectMapping(
                    jiraProjectRexorProjectEntity.id,
                    jiraProjectMap[jiraProjectRexorProjectEntity.jiraProjectId],
                    rexorProjectMap[jiraProjectRexorProjectEntity.rexorProjectUid]
                );
                projectMappings.push(projectMapping);
                _.unset(jiraProjectMap, jiraProjectRexorProjectEntity.jiraProjectId);
            }

            const unmappedJiraProjects = _.toArray(jiraProjectMap);

            return {
                projectMappings: projectMappings,
                unmappedJiraProjects: unmappedJiraProjects,
                rexorProjects: rexorProjects
            };
        });
    }

    public getMapping(id: number): Observable<JiraProjectRexorProjectEntity> {
        return this.http.get(ProjectUrl.Mapping + '/' + id) as Observable<JiraProjectRexorProjectEntity>;
    }

    public addMappings(rexorProject: RexorProject, jiraProjects: JiraProject[]): Observable<object> {
        const jiraProjectRexorProjectEntities: JiraProjectRexorProjectEntity[] = [];
        for (const jiraProject of jiraProjects) {
            jiraProjectRexorProjectEntities.push({
                rexorProjectUid: rexorProject.uid,
                jiraProjectId: jiraProject.id
            });
        }
        return this.http.post(ProjectUrl.Mapping, jiraProjectRexorProjectEntities);
    }

    public deleteMapping(id: number): Observable<JiraProjectRexorProjectEntity> {
        return this.http.delete(ProjectUrl.Mapping + '/' + id) as Observable<JiraProjectRexorProjectEntity>;
    }

    public getJiraProjectRexorProjectEntities(): Observable<JiraProjectRexorProjectEntity[]> {
        return this.http.get(ProjectUrl.Mapping) as Observable<JiraProjectRexorProjectEntity[]>;
    }

    public getJiraProjects(): Observable<JiraProject[]> {
        return this.http.get(ProjectUrl.JiraProject) as Observable<JiraProject[]>;
    }

    public getRexorProjects(): Observable<RexorProject[]> {
        return this.http.get(ProjectUrl.RexorProject) as Observable<RexorProject[]>;
    }

    private createProjectMapping(id, jiraProject: JiraProject, rexorProject: RexorProject): ProjectMapping {

        const projectMapping: ProjectMapping = {
            id: id,
            jiraProjectId: jiraProject.id,
            jiraProjectKey: jiraProject.key,
            jiraProjectName: jiraProject.name,
            rexorProjectId: rexorProject.id,
            rexorProjectUid: rexorProject.uid,
            rexorProjectDescription: rexorProject.description,
            rexorProjectStatus: rexorProject.status,
            rexorProjectCompanyId: rexorProject.companyId
        };

        return projectMapping;
    }
    public getUsers(projectKey: string): Observable<JiraUser[]> {
        return this.http.get(UserUrl.JiraUser + `/${projectKey}`) as Observable<JiraUser[]>;
    }
}
