import { handler as apollo } from './handlers/apollo'
import { handler as playground } from './handlers/playground'
import { setCorsHeaders as setCors } from './utils/setCors'

const graphQLOptions = {
  // Set the path for the GraphQL server
  baseEndpoint: '/',

  // Set the path for the GraphQL playground
  // This option can be removed to disable the playground route
  playgroundEndpoint: '/___graphql',

  // When a request's path isn't matched, forward it to the origin
  forwardUnmatchedRequestsToOrigin: true,

  // Enable debug mode to return script errors directly in browser
  debug: true,

  // Enable CORS headers on GraphQL requests
  // Set to `true` for defaults (see `utils/setCors`),
  // or pass an object to configure each header
  cors: true,
  // cors: {
  //   allowCredentials: 'true',
  //   allowHeaders: 'Content-type',
  //   allowOrigin: '*',
  //   allowMethods: 'GET, POST, PUT',
  // },

  // Enable KV caching for external REST data source requests
  // Note that you'll need to add a KV namespace called
  // WORKERS_GRAPHQL_CACHE in your wrangler.toml file for this to
  // work! See the project README for more information.
  kvCache: false
}

const handleRequest = async (request: Request) => {
  const url = new URL(request.url)
  try {
    if (url.pathname === graphQLOptions.baseEndpoint) {
      const response =
        request.method === 'OPTIONS'
          ? new Response('', { status: 204 })
          : await apollo(request, graphQLOptions)
      if (graphQLOptions.cors) {
        console.log('SERVER', response)
        setCors(response, graphQLOptions.cors)
      }

      return response
    } else if (
      graphQLOptions.playgroundEndpoint &&
      url.pathname === graphQLOptions.playgroundEndpoint
    ) {
      return playground(request, graphQLOptions)
    } else if (graphQLOptions.forwardUnmatchedRequestsToOrigin) {
      return fetch(request)
    } else {
      return new Response('Not found', { status: 404 })
    }
  } catch (err) {
    console.log('ERROR ?', JSON.stringify(err))

    return new Response(
      graphQLOptions.debug ? (err as any) : 'Something went wrong',
      {
        status: 500
      }
    )
  }
}

addEventListener('fetch', (event: { request: Request; respondWith: any }) => {
  event.respondWith(handleRequest(event.request))
})
