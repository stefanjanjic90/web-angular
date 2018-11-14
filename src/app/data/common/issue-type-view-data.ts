import { IssueType, IssueTypeMapping, ProjectActivity } from './index';

export interface IssueTypeViewData {
    issueTypeMappings: IssueTypeMapping[];
    unmappedIssueTypes: IssueType[];
    projectActivities: ProjectActivity[];
}
