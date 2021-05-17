import * as notion from '@graphql-api/notion'
import * as youtube from '@graphql-api/youtube'
import * as stripe from '@graphql-api/stripe'

console.log('STRIPE', stripe)

export const packages = {
  notion,
  youtube,
  stripe
}
