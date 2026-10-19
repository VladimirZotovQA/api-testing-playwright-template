import { StatusCodes } from 'http-status-codes'
import { APIResponse, expect, test } from '@playwright/test'
import {
  AccountDTO,
  CreatedAccountResp,
  CreatedAccountErrorResp,
  DepositDTO,
  TransferDTO,
} from '../../dto/account-dto'

const baseUrl = 'https://shop.tl-academy.ee'
const authHeader = {
  'X-API-Key': 'my-api-key',
}
const wrongHeader = {
  'X-API-Key': 'wrong-api-key',
}

test.describe('API critical path', () => {
  test('TL-11-9 GET /api/accounts/{id} with valid id', async ({ request }) => {
    const createResponse = await request.post(baseUrl + '/api/accounts/', {
      headers: authHeader,
      data: new AccountDTO('Test Owner'),
    })
    const createdAccount: CreatedAccountResp = await createResponse.json()

    const response = await request.get(baseUrl + '/api/accounts/' + createdAccount.id, {
      headers: authHeader,
    })

    expect(response.status()).toBe(StatusCodes.OK)
  })

  test('TL-11-1 POST /api/account with valid data', async ({ request }) => {
    const account = new AccountDTO('Test Owner')
    const response: APIResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: account,
    })
    const respBody: CreatedAccountResp = await response.json()

    expect(response.status()).not.toBe(StatusCodes.FORBIDDEN)
    expect(response.status()).toBe(StatusCodes.CREATED)
    expect(respBody.owner).toBe(account.owner)
  })

  test('TL-11-3 GET /api/accounts list accounts', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts', {
      headers: authHeader,
    })

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.OK)
  })

  test('TL-11-5 POST /api/accounts/{id}/deposit Deposit Money', async ({ request }) => {
    const createResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Test Owner'),
    })
    const createdAccount: CreatedAccountResp = await createResponse.json()
    const depositDTO = new DepositDTO(100)
    const response = await request.post(
      baseUrl + '/api/accounts/' + createdAccount.id + '/deposit',
      {
        headers: authHeader,
        data: depositDTO,
      },
    )
    const respBody: CreatedAccountResp = await response.json()

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.OK)
    expect(respBody.balance).toBe(100)
  })

  test('TL-11-6 POST /api/accounts/{id}/transfer Transfer Money', async ({ request }) => {
    const senderResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Sender'),
    })
    const sender: CreatedAccountResp = await senderResponse.json()

    const recipientResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Recipient'),
    })
    const recipient: CreatedAccountResp = await recipientResponse.json()

    const depositResponse = await request.post(
      baseUrl + '/api/accounts/' + sender.id + '/deposit',
      {
        headers: authHeader,
        data: new DepositDTO(100),
      },
    )
    expect(depositResponse.status()).toBe(StatusCodes.OK)

    const response = await request.post(baseUrl + '/api/accounts/' + sender.id + '/transfer', {
      headers: authHeader,
      data: new TransferDTO(recipient.id, 100),
    })

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.OK)
  })
})

test.describe('API negative test', () => {
  test('TL-11-2 POST /api/account with invalid currency', async ({ request }) => {
    const account = new AccountDTO('Test Owner', 'PLN')
    const response: APIResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: account,
    })

    const respBody: CreatedAccountErrorResp = await response.json()
    console.log(respBody)
    expect(response.status()).not.toBe(StatusCodes.FORBIDDEN)
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(respBody.error).not.toBeUndefined()
    expect(respBody.error.length).toBeGreaterThan(0)
  })

  test('TL-11-7 GET /api/accounts authorization without key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/')

    expect(response.status()).toBe(StatusCodes.UNAUTHORIZED)
  })

  test('TL-11-8 GET /api/accounts with wrong key', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts', {
      headers: wrongHeader,
    })

    expect(response.status()).toBe(StatusCodes.UNAUTHORIZED)
  })

  test('TL-11-10 GET /api/accounts/{id} with non-existing id', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/6767', {
      headers: authHeader,
    })

    const body: CreatedAccountErrorResp = await response.json()

    expect(response.status()).toBe(StatusCodes.NOT_FOUND)
    expect(body.error).toBe('Account not found')
  })

  test('TL-11-11 GET /api/accounts/{id} with invalid id', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/sixseven', {
      headers: authHeader,
    })

    const body: CreatedAccountErrorResp = await response.json()

    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Invalid account id')
  })

  test('TL-11-12 POST /api/accounts/{id}/deposit with amount 0', async ({ request }) => {
    const createResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Test Owner'),
    })
    const createdAccount: CreatedAccountResp = await createResponse.json()
    const depositDTO = new DepositDTO(0)
    const response = await request.post(
      baseUrl + '/api/accounts/' + createdAccount.id + '/deposit',
      {
        headers: authHeader,
        data: depositDTO,
      },
    )

    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Amount must be a number greater than 0')
  })

  test('TL-11-13 POST /api/accounts/{id}/deposit with amount -10', async ({ request }) => {
    const createResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Test Owner'),
    })
    const createdAccount: CreatedAccountResp = await createResponse.json()
    const depositDTO = new DepositDTO(-10)
    const response = await request.post(
      baseUrl + '/api/accounts/' + createdAccount.id + '/deposit',
      {
        headers: authHeader,
        data: depositDTO,
      },
    )

    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Amount must be a number greater than 0')
  })

  test('TL-11-14 POST /api/accounts/{id}/deposit with amount 1.234', async ({ request }) => {
    const createResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Test Owner'),
    })
    const createdAccount: CreatedAccountResp = await createResponse.json()
    const depositDTO = new DepositDTO(1.234)
    const response = await request.post(
      baseUrl + '/api/accounts/' + createdAccount.id + '/deposit',
      {
        headers: authHeader,
        data: depositDTO,
      },
    )

    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Amount must have at most 2 decimal places')
  })

  test('TL-11-15 POST /api/accounts/{id}/deposit with amount as string', async ({ request }) => {
    const createResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Test Owner'),
    })
    const createdAccount: CreatedAccountResp = await createResponse.json()

    // raw object on purpose: DTO does not allow string amount
    const response = await request.post(
      baseUrl + '/api/accounts/' + createdAccount.id + '/deposit',
      {
        headers: authHeader,
        data: { amount: '10' },
      },
    )

    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Amount must be a number greater than 0')
  })

  test('TL-11-6 POST /api/accounts/{id}/transfer Transfer Money', async ({ request }) => {
    const senderResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Sender'),
    })
    const sender: CreatedAccountResp = await senderResponse.json()

    const recipientResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Recipient'),
    })
    const recipient: CreatedAccountResp = await recipientResponse.json()

    const depositResponse = await request.post(
      baseUrl + '/api/accounts/' + sender.id + '/deposit',
      {
        headers: authHeader,
        data: new DepositDTO(100),
      },
    )
    expect(depositResponse.status()).toBe(StatusCodes.OK)

    const response = await request.post(baseUrl + '/api/accounts/' + sender.id + '/transfer', {
      headers: authHeader,
      data: new TransferDTO(recipient.id, 100),
    })

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.OK)
  })

  test('TL-11-16 POST /api/accounts/{id}/transfer insufficient funds', async ({ request }) => {
    const senderResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Sender'),
    })
    const sender: CreatedAccountResp = await senderResponse.json()

    const recipientResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Recipient'),
    })
    const recipient: CreatedAccountResp = await recipientResponse.json()

    const response = await request.post(baseUrl + '/api/accounts/' + sender.id + '/transfer', {
      headers: authHeader,
      data: new TransferDTO(recipient.id, 100),
    })
    const body: CreatedAccountErrorResp = await response.json()

    expect(response.status()).toBe(StatusCodes.CONFLICT)
    expect(body.error).toBe('Insufficient funds')
  })

  test('TL-11-17 POST /api/accounts/{id}/transfer Cannot transfer to the same account', async ({
    request,
  }) => {
    test.fail(true, 'BUG: API allows transfer to the same account, returns 200 instead of 400')
    const senderResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Sender'),
    })
    const sender: CreatedAccountResp = await senderResponse.json()

    const depositResponse = await request.post(
      baseUrl + '/api/accounts/' + sender.id + '/deposit',
      {
        headers: authHeader,
        data: new DepositDTO(100),
      },
    )
    expect(depositResponse.status()).toBe(StatusCodes.OK)

    const response = await request.post(baseUrl + '/api/accounts/' + sender.id + '/transfer', {
      headers: authHeader,
      data: new TransferDTO(sender.id, 100),
    })
    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Cannot transfer to the same account')
  })

  test('TL-11-18 POST /api/accounts/{id}/transfer Currencies of the accounts do not match', async ({
    request,
  }) => {
    test.fail(
      true,
      'BUG: API allows transfer between different currencies, returns 200 instead of 400',
    )
    const senderResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Sender'),
    })
    const sender: CreatedAccountResp = await senderResponse.json()

    const recipientResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Recipient', 'USD'),
    })
    const recipient: CreatedAccountResp = await recipientResponse.json()

    const depositResponse = await request.post(
      baseUrl + '/api/accounts/' + sender.id + '/deposit',
      {
        headers: authHeader,
        data: new DepositDTO(100),
      },
    )
    expect(depositResponse.status()).toBe(StatusCodes.OK)

    const response = await request.post(baseUrl + '/api/accounts/' + sender.id + '/transfer', {
      headers: authHeader,
      data: new TransferDTO(recipient.id, 100),
    })

    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.BAD_REQUEST)
    expect(body.error).toBe('Currencies of the accounts do not match')
  })

  test('TL-11-19 POST /api/accounts/{id}/transfer recipient account not found', async ({
    request,
  }) => {
    const senderResponse = await request.post(baseUrl + '/api/accounts', {
      headers: authHeader,
      data: new AccountDTO('Sender'),
    })
    const sender: CreatedAccountResp = await senderResponse.json()

    const depositResponse = await request.post(
      baseUrl + '/api/accounts/' + sender.id + '/deposit',
      {
        headers: authHeader,
        data: new DepositDTO(100),
      },
    )
    expect(depositResponse.status()).toBe(StatusCodes.OK)

    const response = await request.post(baseUrl + '/api/accounts/' + sender.id + '/transfer', {
      headers: authHeader,
      data: new TransferDTO(6767, 100),
    })

    const body: CreatedAccountErrorResp = await response.json()
    expect(response.status()).toBe(StatusCodes.NOT_FOUND)
    expect(body.error).toBe('Recipient account not found')
  })
})
