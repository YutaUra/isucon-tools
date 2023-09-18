import { describe, expect, it } from 'vitest'

import { trimUrl, patternToRegExp } from './nodejs-router'

describe('trimUrl', () => {
  it("trimUrl('/hoge/')", () => {
    expect(trimUrl('/hoge/')).toBe('/hoge')
  })

  it("trimUrl('/hoge')", () => {
    expect(trimUrl('/hoge')).toBe('/hoge')
  })

  it("trimUrl('/')", () => {
    expect(trimUrl('/')).toBe('/')
  })

  it("trimUrl('')", () => {
    expect(trimUrl('')).toBe('')
  })

  it("trimUrl('/hoge/////')", () => {
    expect(trimUrl('/hoge/////')).toBe('/hoge')
  })

  it("trimUrl('/hoge///fuga//')", () => {
    expect(trimUrl('/hoge///fuga//')).toBe('/hoge/fuga')
  })
})

describe('patternToRegExp', () => {
  it("patternToRegExp('/hoge/:id')", () => {
    expect(patternToRegExp('/hoge/:id')).toEqual(
      /^\/hoge\/(?<id>[^/]+)(?:$|\?.*|#.*)/,
    )
  })

  it("patternToRegExp('/hoge/:id/')", () => {
    expect(patternToRegExp('/hoge/:id/')).toEqual(
      /^\/hoge\/(?<id>[^/]+)(?:$|\?.*|#.*)/,
    )
  })

  it("patternToRegExp('/hoge/:id/:name')", () => {
    expect(patternToRegExp('/hoge/:id/:name')).toEqual(
      /^\/hoge\/(?<id>[^/]+)\/(?<name>[^/]+)(?:$|\?.*|#.*)/,
    )
  })

  it("patternToRegExp('/hoge')", () => {
    expect(patternToRegExp('/hoge')).toEqual(/^\/hoge(?:$|\?.*|#.*)/)
  })
})
