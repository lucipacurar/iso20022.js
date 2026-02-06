import { BusinessError } from '../types';
import { GenericISO20022Message, ISO20022MessageTypeName } from '../../lib/interfaces';
import { Agent, MessageHeader, Party } from '../../lib/types';
import { Currency } from 'dinero.js';
export interface TransactionReport {
    msgId?: string;
    reqExecutionDate?: Date;
    status?: {
        code: string;
        reason?: string;
    };
    debtor: Party;
    debtorAgent: Agent;
    creditor: Party;
    creditorAgent: Agent;
}
export interface PaymentIdentification {
    currency: Currency;
    amount: number;
    endToEndId: string;
    transactionId?: string;
    uetr?: string;
}
export interface TransactionReportOrError {
    paymentId: PaymentIdentification;
    report?: TransactionReport;
    error?: BusinessError;
}
export interface CashManagementReturnTransactionData {
    header: MessageHeader;
    reports: TransactionReportOrError[];
}
export declare class CashManagementReturnTransaction implements GenericISO20022Message {
    private _data;
    constructor(data: CashManagementReturnTransactionData);
    get data(): CashManagementReturnTransactionData;
    static supportedMessages(): ISO20022MessageTypeName[];
    static fromDocumentOject(doc: any): CashManagementReturnTransaction;
    static fromXML(xml: string): CashManagementReturnTransaction;
    static fromJSON(json: string): CashManagementReturnTransaction;
    serialize(): string;
    toJSON(): any;
}
