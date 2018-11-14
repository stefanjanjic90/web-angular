import { WorklogTransfer } from '../common';

export interface WorklogQueueViewData {
    readyWorklogTransferArray: WorklogTransfer[];
    failedWorklogTransferArray: WorklogTransfer[];
}
