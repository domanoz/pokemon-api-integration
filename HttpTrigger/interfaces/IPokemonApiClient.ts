export interface IPokemonApiClient {
    getPokemonById(id: number): Promise<IPokeApiPokemonResponse>
}

export interface IPokeApiPokemonResponse {
    readonly id: number
    readonly name: string
    readonly types: IPokeApiType[]
}

export interface IPokeApiType {
    readonly type: {
        readonly name: string
        readonly url: string
    }
}