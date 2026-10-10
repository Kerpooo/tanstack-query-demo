import { beforeEach, describe, expect, it, vi } from 'vitest'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('axios', () => ({ default: { create: () => http } }))

import { usersApi } from './users.api'

const user = { id: 'u1', name: 'Ana', email: 'ana@example.com' }

beforeEach(() => vi.resetAllMocks())

describe('usersApi', () => {
  it('list y get usan GET', async () => {
    http.get.mockResolvedValue({ data: [user] })
    expect(await usersApi.list()).toEqual([user])
    expect(http.get).toHaveBeenCalledWith('/users')

    http.get.mockResolvedValue({ data: user })
    expect(await usersApi.get('u1')).toEqual(user)
    expect(http.get).toHaveBeenCalledWith('/users/u1')
  })

  it('create usa POST con el cuerpo', async () => {
    http.post.mockResolvedValue({ data: user })
    await usersApi.create({ name: 'Ana', email: 'ana@example.com' })
    expect(http.post).toHaveBeenCalledWith('/users', { name: 'Ana', email: 'ana@example.com' })
  })

  it('update usa PATCH y remove usa DELETE', async () => {
    http.patch.mockResolvedValue({ data: user })
    await usersApi.update('u1', { name: 'Ana', email: 'ana@example.com' })
    expect(http.patch).toHaveBeenCalledWith('/users/u1', { name: 'Ana', email: 'ana@example.com' })

    http.delete.mockResolvedValue({})
    await usersApi.remove('u1')
    expect(http.delete).toHaveBeenCalledWith('/users/u1')
  })
})
