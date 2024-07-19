import { hc } from 'hono/client'
import { describe, expect, expectTypeOf, it } from 'vitest'
import { OpenAPIHono, createRoute, z } from '../src/index'

describe('createRoute', () => {
  it.each([
    { path: '/users', expected: '/users' },
    { path: '/users/{id}', expected: '/users/:id' },
    {
      path: '/users/{uid}/posts/{postId}',
      expected: '/users/:uid/posts/:postId',
    },
  ])('createRoute(%j)', ({ path, expected }) => {
    const ParamsSchema = z.object({
      id: z
        .string()
        .min(3)
        .openapi({
          param: {
            name: 'id',
            in: 'path',
          },
          example: '1212121',
        }),
    })

    const config = {
      method: 'get',
      path: path,
      request: {
        params: ParamsSchema,
      },
      responses: {},
    } as const
    const route = createRoute(config)

    const app = new OpenAPIHono().openapiNoResponse(route, (c) => {
      return c.json({
        foo: 'bar',
        profile: {
          age: 1,
          list: [1, '2', 3],
        },
      })
    })

    expect(route).toEqual(config)
    expect(route.getRoutingPath()).toBe(expected)
    expectTypeOf(route.getRoutingPath()).toEqualTypeOf<typeof expected>()

    // #region Not part of the test, but you can manually see RPC here:

    const client = hc<typeof app>('http://localhost:3000/api')

    async function wow() {
      const response = await client.something.$get({ param: { id: '123' } })

      const result = await response.json()

      return result
    }
    // #endregion
  })
})
