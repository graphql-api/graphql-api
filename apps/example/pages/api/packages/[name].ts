import { NextApiRequest, NextApiResponse } from 'next'
import { ApolloServer } from 'apollo-server-micro'
import upperFirst from 'lodash/upperFirst'
import { buildFederatedSchema } from '@apollo/federation'
import { DocumentNode } from 'apollo-link'
import { GraphQLResolverMap } from 'apollo-graphql'
import { DataSource } from 'apollo-datasource'
import { packages } from '../../../lib/packages'

class ExtendedDatasource extends DataSource<any> {
  constructor(args: any) {
    super()
  }
}

const createHandler = ({
  name,
  typeDefs,
  resolvers,
  dataSource,
  dataSourceParams
}: {
  name: string
  typeDefs: DocumentNode
  resolvers: GraphQLResolverMap
  dataSource: typeof ExtendedDatasource
  dataSourceParams
}) => {
  const schema = buildFederatedSchema({ typeDefs, resolvers })

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      return { auth: req.headers?.['authorization'] }
    },
    dataSources: () => ({
      [name]: new dataSource(dataSourceParams)
    }),
    playground: true
  })

  return server.createHandler({ path: `/api/packages/${name}` })
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const name: string = req.query.name as string
  const pkg = packages[name]
  const dataSource = pkg[`${upperFirst(name)}DataSource`]
  return createHandler({ name, ...packages[name], dataSource })(req, res)
}

export const config = {
  api: {
    bodyParser: false
  }
}
