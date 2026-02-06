import { GroupStatusInformation, PaymentStatusInformation, TransactionStatusInformation } from './types';
export declare const parseGroupStatusInformation: (originalGroupInfAndStatus: any) => GroupStatusInformation | null;
export declare const parsePaymentStatusInformations: (originalPaymentInfAndStatuses: any) => PaymentStatusInformation[];
export declare const parseTransactionStatusInformations: (allTxnsInfoAndStatuses: any[]) => TransactionStatusInformation[];
