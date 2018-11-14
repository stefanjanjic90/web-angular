import { WorklogEntity } from './worklog';
export interface WorklogTransferEntity {
    id: number;
    worklogEntity: WorklogEntity;
    createdBy: string;
    createdOn: Date;
    transferStatusCd: string;
    transferLog?: string;
    transferDate?: Date;
    worklogId?: string;
}
