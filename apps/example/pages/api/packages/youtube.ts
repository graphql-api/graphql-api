import { ApolloServer } from 'apollo-server-micro'
import { YoutubeDataSource, resolvers, typeDefs } from '@graphql-api/youtube'

import { buildFederatedSchema } from '@apollo/federation'

const schema = buildFederatedSchema({ typeDefs, resolvers })

const server = new ApolloServer({
  schema,
  dataSources: () => ({
    youtube: new YoutubeDataSource({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI
    })
  }),
  playground: true
})

export default server.createHandler({ path: '/api/packages/youtube' })

export const config = {
  api: {
    bodyParser: false
  }
}
