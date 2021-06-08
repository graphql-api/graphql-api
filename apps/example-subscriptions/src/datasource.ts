import { RESTDataSource } from 'apollo-datasource-rest'

export class PokemonAPI extends RESTDataSource {
  constructor() {
    super()
    this.baseURL = 'https://pokeapi.co/api/v2/'
  }

  async getPokemon(id: string) {
    return this.get(`pokemon/${id}`)
  }
}
