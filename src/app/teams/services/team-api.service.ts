import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { TEAM_API_URL } from '../../common/constants/api.constants';
import {
  GraphqlResponse,
} from '../../common/models/load-state.model';
import {
  CreateTeamInput,
  Team,
  TeamApiModel,
} from '../models/team.model';
import {
  CREATE_TEAM,
  DELETE_TEAM,
  GET_TEAMS,
} from './team.queries';

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);

  /** Fetches teams from the local GraphQL server. */
  getTeams(): Observable<Team[]> {
    return this.request<{ allTeams: TeamApiModel[] }>(
      GET_TEAMS,
    ).pipe(
      map((data) =>
        data.allTeams.map((team) => this.mapTeam(team)),
      ),
    );
  }

  /** Creates a team and returns the saved record with its server ID. */
  createTeam(input: CreateTeamInput): Observable<Team> {
    return this.request<{ createTeam: TeamApiModel }>(
      CREATE_TEAM,
      {
        trainerId: input.trainerId,
        name: input.name.trim(),
        pokemonIds: input.pokemonIds,
        createdAt: new Date().toISOString(),
      },
    ).pipe(
      map((data) => this.mapTeam(data.createTeam)),
    );
  }

  /** Deletes a team using its server ID. */
  deleteTeam(id: string): Observable<void> {
    return this.request<{
      deleteTeam: { id: string | number } | null;
    }>(
      DELETE_TEAM,
      { id },
    ).pipe(
      map((data) => {
        if (!data.deleteTeam) {
          throw new Error('The team could not be deleted.');
        }

        return undefined;
      }),
    );
  }

  private request<T>(
    query: string,
    variables: Record<string, unknown> = {},
  ): Observable<T> {
    return this.http.post<GraphqlResponse<T>>(
      TEAM_API_URL,
      { query, variables },
    ).pipe(
      map((response) => {
        // GraphQL errors can arrive with an HTTP 200 response.
        if (response.errors?.length || response.data == null) {
          throw new Error('The team request failed. Please try again.');
        }

        return response.data;
      }),
    );
  }

  private mapTeam(team: TeamApiModel): Team {
    // Normalize server field names and IDs for the rest of the app.
    return {
      id: String(team.id),
      trainerId: String(team.trainer_id),
      name: team.name,
      pokemonIds: team.pokemon_ids,
      createdAt: team.created_at,
    };
  }
}