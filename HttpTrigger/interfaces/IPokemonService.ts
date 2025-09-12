import { Pokemon } from "../domain/Pokemon";

export interface IPokemonService {
    getPokemons(ids: number[], type: string): Promise<string[]>
    getPokemonById(id: number): Promise<Pokemon>
}