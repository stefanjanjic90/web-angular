import { WorklogEntity } from '../entity';

export interface WorklogViewData {
    transferedWorklogs: WorklogEntity[];
    worklogs: WorklogEntity[];
}
