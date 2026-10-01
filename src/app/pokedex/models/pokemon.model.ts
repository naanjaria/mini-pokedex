export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export type PokemonStatKey = keyof PokemonStats;

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  spriteUrl: string | null;
  types: string[];
  stats: PokemonStats;
  total: number;
}

export interface PokemonAbility {
  name: string;
  shortEffect: string;
  isHidden: boolean;
}

export interface PokemonDetail extends Pokemon {
  abilities: PokemonAbility[];
}