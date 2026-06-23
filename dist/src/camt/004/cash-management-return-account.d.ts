import type { Currency } from '../../lib/currencies';
import { type GenericISO20022Message, type ISO20022MessageTypeName } from '../../lib/interfaces';
import type { AccountIdentification, CashAccountType, MessageHeader } from '../../lib/types';
import type { BalanceInReport, BusinessError } from '../types';
export interface AccountReport {
    currency: Currency;
    name?: string;
    type?: CashAccountType | string;
    balances: BalanceInReport[];
}
export interface AccountReportOrError {
    accountId: AccountIdentification;
    report?: AccountReport;
    error?: BusinessError;
}
export interface CashManagementReturnAccountData {
    header: MessageHeader;
    reports: AccountReportOrError[];
}
export declare class CashManagementReturnAccount implements GenericISO20022Message {
    private _data;
    constructor(data: CashManagementReturnAccountData);
    get data(): CashManagementReturnAccountData;
    static supportedMessages(): ISO20022MessageTypeName[];
    static fromDocumentObject(doc: any): CashManagementReturnAccount;
    static fromXML(xml: string): CashManagementReturnAccount;
    static fromJSON(json: string): CashManagementReturnAccount;
    serialize(): string;
    toJSON(): any;
}
