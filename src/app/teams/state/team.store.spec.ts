import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';
import { TeamStore } from './team.store';

describe('TeamStore', () => {
  it('rolls back an optimistic team when creation fails', async () => {
    const createResponse = new Subject<Team>();

    const existing: Team = {
      id: '1',
      trainerId: '1',
      name: 'Existing team',
      pokemonIds: [25],
      createdAt: '2024-01-15T10:00:00Z',
    };

    const api = {
      getTeams: vi.fn(() => of([existing])),
      createTeam: vi.fn(() => createResponse.asObservable()),
      deleteTeam: vi.fn(() => of(undefined)),
    };

    TestBed.configureTestingModule({
      providers: [
        TeamStore,
        { provide: TeamApiService, useValue: api },
      ],
    });

    const store = TestBed.inject(TeamStore);
    store.load();

    store.create({
      trainerId: '1',
      name: 'New team',
      pokemonIds: [6],
    });

    const optimistic = await firstValueFrom(store.state$);

    expect(optimistic.data.map((team) => team.name)).toEqual([
      'Existing team',
      'New team',
    ]);
    expect(await firstValueFrom(store.saving$)).toBe(true);

    createResponse.error(new Error('Server unavailable'));

    const rolledBack = await firstValueFrom(store.state$);

    expect(rolledBack.data).toEqual([existing]);
    expect(await firstValueFrom(store.saving$)).toBe(false);
    expect(await firstValueFrom(store.message$)).toContain(
      'Could not create',
    );
  });
});