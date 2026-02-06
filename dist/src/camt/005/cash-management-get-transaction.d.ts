import { GenericISO20022Message, ISO20022MessageTypeName } from '../../lib/interfaces';
import { MessageHeader } from '../../lib/types';
export interface CashManagementGetTransactionCriterium {
    type: string;
    msgIdsEqualTo?: string[];
    dateEqualTo?: Date;
    endToEndIdEqualTo?: string[];
}
export interface CashManagementGetTransactionData {
    header: MessageHeader;
    newCriteria?: {
        name?: string;
        searchCriteria: CashManagementGetTransactionCriterium[];
    };
}
export declare class CashManagementGetTransaction implements GenericISO20022Message {
    private _data;
    constructor(data: CashManagementGetTransactionData);
    get data(): CashManagementGetTransactionData;
    static supportedMessages(): ISO20022MessageTypeName[];
    static fromDocumentOject(doc: any): CashManagementGetTransaction;
    static fromXML(xml: string): CashManagementGetTransaction;
    static fromJSON(json: string): CashManagementGetTransaction;
    serialize(): string;
    toJSON(): any;
}
