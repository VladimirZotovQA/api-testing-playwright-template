import { expect, test } from '@playwright/test'
import { Login } from '../../dto/login-dto'
import { createOrder, fetchJwt } from '../../helpers/api-helper'
import { LoginRequestBodySchema, TokenSchema } from '../../schema/LoginSchema'
import { GetOrderResponseSchema } from '../../schema/OrderSchema'

let loginDto: Login
export const baseUrl = 'https://backend.tallinn-learning.ee'
export const loginEndpoint = '/login/student'
export const ordersEndpoint = '/orders'

test.describe('Authorization flow', () => {
  test.beforeAll(() => {
    loginDto = new Login(process.env['DL_USERNAME']!, process.env['DL_PASSWORD']!)
  })

  test('TL-12-1 should login and receive authorization token', async ({ request }) => {
    const user: Login = {
      username: process.env['DL_USERNAME']!,
      password: process.env.DL_PASSWORD!,
    }

    const response = await request.post(baseUrl + loginEndpoint, {
      data: LoginRequestBodySchema.parse(user),
    })
    const token = await response.text()
    const validatedToken = TokenSchema.parse(token)
    expect(validatedToken).toBeDefined()
  })

  test('should create order', async ({ request }) => {
    const token = await fetchJwt(request, loginDto)
    const orderId = await createOrder(request, token)
    expect(orderId).toBeDefined()
  })

  test('should get orders with authorization token', async ({ request }) => {
    const token = await fetchJwt(request, loginDto)

    const response = await request.get(baseUrl + ordersEndpoint, {
      headers: {
        accept: '*/*',
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.status()).toBe(200)
    const orders = GetOrderResponseSchema.parse(await response.json())
    console.log('Orders:', JSON.stringify(orders, null, 2))
    expect(orders).toBeTruthy()
  })
})
