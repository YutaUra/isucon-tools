import { createServer } from 'node:http'

import { describe, it, expect } from 'vitest'

import { NodeJSRouter } from './nodejs-router'

describe('NodeJSRouter', () => {
  it('should work', async () => {
    const PORT = 3000
    const router = new NodeJSRouter()
    router.staticGet('/', (_, res) => {
      console.log('GET /')
      res.end('Hello, World!')
    })
    router.staticGet('/hello', (_, res) => {
      console.log('GET /hello')
      res.end('Hello, World!!')
    })
    router.dynamicGet('/hello/:name', (_, res, { params }) => {
      const { name } = params

      console.log(`GET /hello/${name}`)
      res.end(`Hello, ${name}!`)
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const server = createServer(router.httpV1Listener())
    await new Promise((resolve) =>
      server.listen(PORT, () => {
        resolve(null)
      }),
    )

    const res = await fetch(`http://localhost:${PORT}/`)
    const text = await res.text()
    expect(text).toBe('Hello, World!')

    const res2 = await fetch(`http://localhost:${PORT}/hello/`)
    const text2 = await res2.text()
    expect(text2).toBe('Hello, World!!')

    const res3 = await fetch(`http://localhost:${PORT}/not-found/`)
    const text3 = await res3.text()
    expect(text3).toBe('Not Found')

    const res4 = await fetch(`http://localhost:${PORT}/hello/John`)
    const text4 = await res4.text()
    expect(text4).toBe('Hello, John!')

    await new Promise((resolve) => server.close(resolve))
  })
})
