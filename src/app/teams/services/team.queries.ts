const TEAM_FIELDS = `
  id
  trainer_id
  name
  pokemon_ids
  created_at
`;

export const GET_TEAMS = `
  query GetTeams {
    allTeams {
      ${TEAM_FIELDS}
    }
  }
`;

export const CREATE_TEAM = `
  mutation CreateTeam(
    $trainerId: ID!
    $name: String!
    $pokemonIds: [Int]!
    $createdAt: String!
  ) {
    createTeam(
      trainer_id: $trainerId
      name: $name
      pokemon_ids: $pokemonIds
      created_at: $createdAt
    ) {
      ${TEAM_FIELDS}
    }
  }
`;

export const DELETE_TEAM = `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id) {
      id
    }
  }
`;