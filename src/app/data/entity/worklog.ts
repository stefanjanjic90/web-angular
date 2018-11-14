export interface WorklogEntity {
    id: string;
    username: string;
    timeSpent: number;
    comment: string;
    approvalStatus: string;
    workDate: string;
    issueKey: string;
    issueSummary: string;
    issueTypeId: string;
    projectKey: string;
    location: string;
}
