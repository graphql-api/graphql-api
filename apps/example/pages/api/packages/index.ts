import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway'
import { gql } from 'graphql-tag'
import { print } from 'graphql'
import { ApolloServer } from 'apollo-server-micro'
import { packages } from '../../../lib/packages'

const basePath = '/api/packages'

const gateway = new ApolloGateway({
  localServiceList: Object.entries(packages).map(([name, { typeDefs }]) => ({
    typeDefs,
    name,
    url: `${process.env.ADDRESS}${basePath}/${name}`
  })),
  buildService: (definition) => {
    let willSendRequest
    switch (definition.name) {
      case 'notion':
        willSendRequest = function ({ request, context }) {
          const token =
            context.notionToken === 'insert your token here'
              ? process.env.NOTION_TOKEN_TEST
              : context.notionToken
          request.http.headers.set('Authorization', token)
        }
    }

    return new (class extends RemoteGraphQLDataSource {
      willSendRequest = willSendRequest
    })(definition)
  }
})

const server = new ApolloServer({
  gateway,
  subscriptions: false,
  playground: {
    title: 'graphql-api'
  },
  context: ({ req }) => {
    return { notionToken: req?.headers?.['notion-token'] }
  }
})

export default server.createHandler({ path: basePath })

export const config = {
  api: {
    bodyParser: false
  }
}
