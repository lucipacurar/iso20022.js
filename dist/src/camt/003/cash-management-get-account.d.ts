import { GenericISO20022Message, ISO20022MessageTypeName } from '../../lib/interfaces';
import { AccountIdentification, MessageHeader } from '../../lib/types';
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
    static fromDocumentOject(doc: any): CashManagementGetAccount;
    static fromXML(xml: string): CashManagementGetAccount;
    static fromJSON(json: string): CashManagementGetAccount;
    serialize(): string;
    toJSON(): any;
}
