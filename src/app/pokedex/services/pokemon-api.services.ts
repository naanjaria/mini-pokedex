import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, retry, timer } from 'rxjs';

import { POKEMON_API_URL } from '../../common/constants/api.constants';
import { GraphqlResponse } from '../../common/models/load-state.model';
import {
  Pokemon,
  PokemonDetail,
  PokemonStats,
} from '../models/pokemon.model';
import {
  GET_POKEMON,
  GET_POKEMON_DETAIL,
} from './pokemon.queries';

interface PokemonApiModel {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: Array<{
    pokemon_v2_type: { name: string };
  }>;
  pokemon_v2_pokemonstats: Array<{
    base_stat: number;
    pokemon_v2_stat: { name: string };
  }>;
  pokemon_v2_pokemonsprites: Array<{
    sprites: unknown;
  }>;
}

interface PokemonListResponse {
  pokemon_v2_pokemon: PokemonApiModel[];
}

interface PokemonDetailResponse extends PokemonListResponse {
  pokemon_v2_pokemonability: Array<{
    is_hidden: boolean;
    pokemon_v2_ability: {
      name: string;
      pokemon_v2_abilityeffecttexts: Array<{
        short_effect: string;
      }>;
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  private readonly http = inject(HttpClient);

  /** Fetches an ordered page of Pokémon with types, stats, and sprites. */
  getPokemonPage(
    limit: number = 100,
    offset: number = 0,
  ): Observable<Pokemon[]> {
    return this.query<PokemonListResponse>(
      GET_POKEMON,
      { limit, offset },
    ).pipe(
      map((data) =>
        data.pokemon_v2_pokemon.map((pokemon) =>
          this.mapPokemon(pokemon),
        ),
      ),
    );
  }

  /** Fetches one Pokémon and its abilities, or null if it does not exist. */
  getPokemonDetail(id: number): Observable<PokemonDetail | null> {
    return this.query<PokemonDetailResponse>(
      GET_POKEMON_DETAIL,
      { pokemonId: id },
    ).pipe(
      map((data) => {
        const pokemon = data.pokemon_v2_pokemon[0];

        if (!pokemon) {
          return null;
        }

        return {
          ...this.mapPokemon(pokemon),
          abilities: data.pokemon_v2_pokemonability.map((entry) => ({
            name: entry.pokemon_v2_ability.name,
            isHidden: entry.is_hidden,
            shortEffect:
              entry.pokemon_v2_ability
                .pokemon_v2_abilityeffecttexts[0]?.short_effect
              ?? 'No description available.',
          })),
        };
      }),
    );
  }

  private query<T>(
    query: string,
    variables: Record<string, number>,
  ): Observable<T> {
    return this.http.post<GraphqlResponse<T>>(
      POKEMON_API_URL,
      { query, variables },
    ).pipe(
      map((response) => {
        // GraphQL can report errors even when HTTP returns status 200.
        if (response.errors?.length || response.data == null) {
          throw new Error('Unable to load Pokémon. Please try again.');
        }

        return response.data;
      }),
      retry({
        count: 2,
        delay: (_error, retryCount) => timer(retryCount * 1000),
      }),
    );
  }

  private mapPokemon(pokemon: PokemonApiModel): Pokemon {
    const values = new Map(
      pokemon.pokemon_v2_pokemonstats.map((entry) => [
        entry.pokemon_v2_stat.name,
        entry.base_stat,
      ]),
    );

    const stats: PokemonStats = {
      hp: values.get('hp') ?? 0,
      attack: values.get('attack') ?? 0,
      defense: values.get('defense') ?? 0,
      specialAttack: values.get('special-attack') ?? 0,
      specialDefense: values.get('special-defense') ?? 0,
      speed: values.get('speed') ?? 0,
    };

    return {
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      types: pokemon.pokemon_v2_pokemontypes.map(
        (entry) => entry.pokemon_v2_type.name,
      ),
      spriteUrl: this.getSpriteUrl(
        pokemon.pokemon_v2_pokemonsprites[0]?.sprites,
      ),
      stats,
      total: Object.values(stats).reduce(
        (total, value) => total + value,
        0,
      ),
    };
  }

  private getSpriteUrl(value: unknown): string | null {
    let sprites: unknown = value;

    // Handle sprites returned either as a JSON string or an object.
    if (typeof sprites === 'string') {
      try {
        sprites = JSON.parse(sprites);
      } catch {
        return null;
      }
    }

    if (
      typeof sprites === 'object'
      && sprites !== null
      && 'front_default' in sprites
      && typeof sprites.front_default === 'string'
    ) {
      return sprites.front_default;
    }

    return null;
  }
}