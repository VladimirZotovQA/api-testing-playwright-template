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

test.describe('API critical path', () => {
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

  test('TL-11-4 GET /api/accounts one account', async ({ request }) => {
    const response = await request.get(baseUrl + '/api/accounts/2', {
      headers: authHeader,
    })

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.OK)
  })

  test('TL-11-5 POST /api/accounts/{id}/deposit Deposit Money', async ({ request }) => {
    const depositDTO = new DepositDTO(100)
    const response: APIResponse = await request.post(baseUrl + '/api/accounts/2/deposit', {
      headers: authHeader,
      data: depositDTO,
    })
    const respBody: CreatedAccountResp = await response.json()

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    expect(response.status()).toBe(StatusCodes.OK)
    expect(respBody.balance).toBeGreaterThanOrEqual(0)
  })

  test('TL-11-6 POST /api/accounts/{id}/transfer Transfer Money', async ({ request }) => {
    const depositDTO = new DepositDTO(100)
    await request.post(baseUrl + '/api/accounts/1/deposit', {
      headers: authHeader,
      data: depositDTO,
    })

    const transferDTO = new TransferDTO(3, 100)
    const response: APIResponse = await request.post(baseUrl + '/api/accounts/1/transfer', {
      headers: authHeader,
      data: transferDTO,
    })

    expect(response.status()).not.toBe(StatusCodes.UNAUTHORIZED)
    console.log(await response.json())
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
})
