import { IssueTimeCodeEntity } from './issue-time-code';

export interface AbsenceEntity {
    id?: number;
    classificationId: string;
    issueTimeCodeEntities: IssueTimeCodeEntity[];
    jiraProjectRexorProjectId: number;
}
