export interface WorklogTransfer {
    id: number;
    worklogId: string;
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
    createdBy: string;
    createdOn: Date;
    transferStatusCd: string;
    transferLog?: string;
    transferDate?: Date;
}
