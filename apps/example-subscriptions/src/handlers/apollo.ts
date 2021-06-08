import {
  ApolloServer,
  ApolloError,
  gql,
  GraphQLOptions
} from 'apollo-server-cloudflare'
// const { ApolloServer, gql } = require('apollo-server-cloudflare')
import { graphqlCloudflare } from 'apollo-server-cloudflare/dist/cloudflareApollo'
import { KVCache } from '../kv-cache'
import { PokemonAPI } from '../datasource'
// import { resolvers } from '../resolvers'
// import { typeDefs } from '../typeDefs'
// import { makeExecutableSchema } from 'graphql-tools'

const dataSources = () => ({
  pokemonAPI: new PokemonAPI()
})

const kvCache = { cache: new KVCache() }

const typeDefs = gql`
  type Query {
    test: String
  }
`
// const server = new ApolloServer({
//   schema,
//   introspection: true
// })

const createServer = (graphQLOptions: GraphQLOptions) => {
  console.log(typeDefs, graphQLOptions)
  return new ApolloServer({
    typeDefs,
    resolvers: {
      Query: {
        test: () => 'Hello'
      }
    },
    introspection: true

    // dataSources

    // ...(graphQLOptions.kvCache ? kvCache : {})
  })
}

export const handler = (request: Request, graphQLOptions: any) => {
  const server = createServer(graphQLOptions)
  console.log('CREATED SERVER', server)
  return graphqlCloudflare(() =>
    server.createGraphQLServerOptions(request as any)
  )(request as any)
}
