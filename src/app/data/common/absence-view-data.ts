import { IssueMapping } from './issue-mapping';
import { Issue } from './issue';
import { TimeCode } from './time-code';

export interface AbsenceViewData {
    absenceEntityId: number;
    classificationId: string;
    issueMappings: IssueMapping[];
    unmappedIssues: Issue[];
    timeCodes: TimeCode[];
}
