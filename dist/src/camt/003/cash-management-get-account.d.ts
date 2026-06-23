import { type GenericISO20022Message, type ISO20022MessageTypeName } from '../../lib/interfaces';
import type { AccountIdentification, MessageHeader } from '../../lib/types';
export interface CashManagementGetAccountCriterium {
    accountRegExp?: string;
    accountEqualTo?: AccountIdentification;
    currencyEqualTo?: string;
    balanceAsOfDateEqualTo?: Date;
}
export interface CashManagementGetAccountData {
    header: MessageHeader;
    newCriteria: {
        name: string;
        searchCriteria: CashManagementGetAccountCriterium[];
    };
}
export declare class CashManagementGetAccount implements GenericISO20022Message {
    private _data;
    constructor(data: CashManagementGetAccountData);
    get data(): CashManagementGetAccountData;
    static supportedMessages(): ISO20022MessageTypeName[];
    static fromDocumentObject(doc: any): CashManagementGetAccount;
    static fromXML(xml: string): CashManagementGetAccount;
    static fromJSON(json: string): CashManagementGetAccount;
    serialize(): string;
    toJSON(): any;
}
