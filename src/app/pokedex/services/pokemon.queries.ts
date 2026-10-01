const POKEMON_FIELDS = `
  id
  name
  height
  weight
  pokemon_v2_pokemontypes {
    pokemon_v2_type {
      name
    }
  }
  pokemon_v2_pokemonstats {
    base_stat
    pokemon_v2_stat {
      name
    }
  }
  pokemon_v2_pokemonsprites {
    sprites
  }
`;

export const GET_POKEMON = `
  query GetPokemon($limit: Int!, $offset: Int!) {
    pokemon_v2_pokemon(
      limit: $limit
      offset: $offset
      order_by: { id: asc }
    ) {
      ${POKEMON_FIELDS}
    }
  }
`;

export const GET_POKEMON_DETAIL = `
  query GetPokemonDetail($pokemonId: Int!) {
    pokemon_v2_pokemon(where: { id: { _eq: $pokemonId } }) {
      ${POKEMON_FIELDS}
    }
    pokemon_v2_pokemonability(
      where: { pokemon_id: { _eq: $pokemonId } }
    ) {
      is_hidden
      pokemon_v2_ability {
        name
        pokemon_v2_abilityeffecttexts(
          where: { language_id: { _eq: 9 } }
        ) {
          short_effect
        }
      }
    }
  }
`;