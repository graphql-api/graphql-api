export const resolvers = {
  Query: {
    pokemon: async (_: {}, { id }: any, { dataSources }: any) => {
      return dataSources.pokemonAPI.getPokemon(id)
    }
  }
}
