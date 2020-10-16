export interface IssueRequest {
    id: string;
    amountBTC: string;
    creation: Date;
    vaultBTCAddress: string;
    btcTxId: string;
    confirmations: number;
    completed: boolean;
    merkleProof: string;
    transactionBlockHeight: number;
    rawTransaction: Uint8Array;
}

export interface IssueMap {

    [key: string]: IssueRequest[];
}

export interface Issue {
    address: string;
    step: string;
    amountBTC: string;
    feeBTC: string;
    vaultDotAddress: string;
    vaultBtcAddress: string;
    id: string;
    btcTxId: string;
    issueRequests: Map<string,IssueRequest[]>;
    transactionListeners: string[];
    proofListeners: string[];
    wizardInEditMode: boolean;
}
