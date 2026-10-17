export class AccountDTO {
  owner: string
  currency: string | undefined

  constructor(owner: string, currency?: string) {
    this.owner = owner
    this.currency = currency
  }
}

export type CreatedAccountResp = {
  id: number
  owner: string
  currency: string
  balance: number
  createdAt: string
}

export type CreatedAccountErrorResp = {
  error: string
}


export class TransferDTO {
  toId: number
  amount: number

  constructor(toId: number, amount: number) {
    this.toId = toId
    this.amount = amount
  }
}

export class DepositDTO {
  amount: number

  constructor(amount: number) {
    this.amount = amount
  }
}
