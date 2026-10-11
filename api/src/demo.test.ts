import { beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from './test-utils.js'

let app: Awaited<ReturnType<typeof createTestApp>>
beforeEach(async () => {
  app = await createTestApp()
})

describe('/demo', () => {
  it('clock devuelve la hora del servidor en ISO', async () => {
    const body = (await (await app.request('/demo/clock')).json()) as { now: string }
    expect(new Date(body.now).toISOString()).toBe(body.now)
  })

  it('slow espera y responde', async () => {
    const started = Date.now()
    const res = await app.request('/demo/slow?ms=50')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ waited: 50 })
    expect(Date.now() - started).toBeGreaterThanOrEqual(45)
  })

  it('slow rechaza esperas fuera de rango', async () => {
    expect((await app.request('/demo/slow?ms=999999')).status).toBe(400)
  })

  it('flaky falla N veces y luego responde, y se puede repetir', async () => {
    const call = () => app.request('/demo/flaky?key=a&failures=2')
    expect((await call()).status).toBe(500)
    expect((await call()).status).toBe(500)
    const ok = await call()
    expect(ok.status).toBe(200)
    expect(await ok.json()).toEqual({ ok: true, attempt: 3 })
    // tras el éxito la cuenta se reinicia
    expect((await call()).status).toBe(500)
  })

  it('flaky cuenta los intentos por clave', async () => {
    expect((await app.request('/demo/flaky?key=x&failures=1')).status).toBe(500)
    expect((await app.request('/demo/flaky?key=y&failures=1')).status).toBe(500)
    expect((await app.request('/demo/flaky?key=x&failures=1')).status).toBe(200)
  })

  it('fail siempre responde 500', async () => {
    expect((await app.request('/demo/fail')).status).toBe(500)
    expect((await app.request('/demo/fail', { method: 'PATCH' })).status).toBe(500)
  })
})
