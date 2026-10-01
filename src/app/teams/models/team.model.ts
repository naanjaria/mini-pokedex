export interface Team {
  id: string;
  trainerId: string;
  name: string;
  pokemonIds: number[];
  createdAt: string;
}

export interface CreateTeamInput {
  trainerId: string;
  name: string;
  pokemonIds: number[];
}

export interface TeamApiModel {
  id: string | number;
  trainer_id: string | number;
  name: string;
  pokemon_ids: number[];
  created_at: string;
}