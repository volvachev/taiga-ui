export const enum TuiPaymentSystem {
    Visa = 'visa',
    Electron = 'electron',
    Mastercard = 'mastercard',
    Maestro = 'maestro',
    Mir = 'mir',
}

// TODO: after upgrade to TS 4.1 change it line to
// export type TuiPaymentSystemLiteral = `${TuiPaymentSystem}`;
export type TuiPaymentSystemLiteral =
    | 'visa'
    | 'electron'
    | 'mastercard'
    | 'maestro'
    | 'mir';
