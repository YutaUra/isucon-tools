import type { IncomingMessage, ServerResponse } from 'node:http'

export type BackwardResolver<
  Request extends typeof IncomingMessage,
  Response extends typeof ServerResponse,
> = (
  req: InstanceType<Request>,
  res: InstanceType<Response> & { req: InstanceType<Request> },
) => void | Promise<void>

export type Listener<
  Request extends typeof IncomingMessage,
  Response extends typeof ServerResponse,
  Context extends Record<string, unknown> = Record<string, unknown>,
> = (
  req: InstanceType<Request>,
  res: InstanceType<Response> & { req: InstanceType<Request> },
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => void | Promise<void> | BackwardResolver<Request, Response>

interface Handler<
  Request extends typeof IncomingMessage,
  Response extends typeof ServerResponse,
> {
  matcher: (req: InstanceType<Request>) => boolean
  resolver: Listener<Request, Response>
}

export const trimUrl = (url: string) =>
  url.replace(/\/+/g, '/').replace(/(?!^\/)\/+$/g, '')

/**
 * pattern is like "/hoge/:id"
 * regexp is like /^\/hoge\/(?<id>[^/]+)(?:$|\?.*|#.*)/
 */
export const patternToRegExp = (pattern: string) => {
  const regexp = pattern
    .replace(/\/+/g, '/')
    .replace(/\/$|\/\?|\/#/, '')
    .replace(/\/:(?<name>[^/]+)/g, '/(?<$<name>>[^/]+)')
  return new RegExp(`^${regexp}(?:$|\\?.*|#.*)`)
}
export class NodeJSRouter<
  Request extends typeof IncomingMessage = typeof IncomingMessage,
  Response extends typeof ServerResponse = typeof ServerResponse,
> {
  handlers: Handler<Request, Response>[] = []
  addHandler(handler: Handler<Request, Response>) {
    this.handlers.push(handler)
  }

  staticRoute(
    method: string,
    path: string,
    resolver: Listener<Request, Response>,
  ) {
    this.addHandler({
      matcher: (req) =>
        (method === '*' || req.method === method) &&
        (path === '*' || trimUrl(req.url ?? '') === path),
      resolver,
    })
  }

  staticAll(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('*', path, resolver)
  }

  staticGet(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('GET', path, resolver)
  }

  staticPost(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('POST', path, resolver)
  }

  staticPut(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('PUT', path, resolver)
  }

  staticDelete(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('DELETE', path, resolver)
  }

  staticPatch(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('PATCH', path, resolver)
  }

  staticHead(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('HEAD', path, resolver)
  }

  staticOptions(path: string, resolver: Listener<Request, Response>) {
    this.staticRoute('OPTIONS', path, resolver)
  }

  dynamicRoute(
    method: string,
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    const regexp = patternToRegExp(path)
    this.addHandler({
      matcher: (req) =>
        (method === '*' || req.method === method) &&
        regexp.test(trimUrl(req.url ?? '')),
      resolver: (req, res, context) => {
        const match = regexp.exec(trimUrl(req.url ?? ''))
        if (!match) {
          throw new Error('match is null')
        }
        const params = match.groups ?? {}
        return resolver(req, res, { ...context, params })
      },
    })
  }

  dynamicGet(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('GET', path, resolver)
  }

  dynamicPost(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('POST', path, resolver)
  }

  dynamicPut(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('PUT', path, resolver)
  }

  dynamicDelete(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('DELETE', path, resolver)
  }

  dynamicPatch(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('PATCH', path, resolver)
  }

  dynamicHead(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('HEAD', path, resolver)
  }

  dynamicOptions(
    path: string,
    resolver: Listener<Request, Response, { params: Record<string, string> }>,
  ) {
    this.dynamicRoute('OPTIONS', path, resolver)
  }

  httpV1Listener() {
    return async (
      req: InstanceType<Request>,
      res: InstanceType<Response> & { req: InstanceType<Request> },
    ) => {
      const backwardResolvers: BackwardResolver<Request, Response>[] = []
      for (const handler of this.handlers) {
        if (handler.matcher(req)) {
          const backward = await handler.resolver(req, res, {})
          if (backward) {
            backwardResolvers.push(backward)
          }
        }
      }
      for (const backward of backwardResolvers.reverse()) {
        await backward(req, res)
      }

      if (!res.closed) {
        res.writeHead(404, 'Not Found', { 'Content-Type': 'text/plain' })
        res.end('Not Found')
      }
    }
  }
}
