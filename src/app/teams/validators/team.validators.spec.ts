import { TestBed } from '@angular/core/testing';
import { FormControl, ValidationErrors } from '@angular/forms';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { LoadState } from '../../common/models/load-state.model';
import { Team } from '../models/team.model';
import { TeamStore } from '../state/team.store';
import { uniqueTeamNameValidator } from './team.validators';

describe('uniqueTeamNameValidator', () => {
  it('rejects duplicate names and accepts a unique name after the delay', async () => {
    vi.useFakeTimers();

    const state = new BehaviorSubject<LoadState<Team[]>>({
      status: 'success',
      error: null,
      data: [
        {
          id: '1',
          trainerId: '1',
          name: 'Kanto Starters',
          pokemonIds: [25],
          createdAt: '2024-01-15T10:00:00Z',
        },
      ],
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TeamStore,
          useValue: { state$: state.asObservable() },
        },
      ],
    });

    const validator = uniqueTeamNameValidator(
      TestBed.inject(TeamStore),
    );

    try {
      const duplicate = firstValueFrom(
        validator(new FormControl('  KANTO STARTERS  ')) as
          Observable<ValidationErrors | null>,
      );

      await vi.advanceTimersByTimeAsync(300);
      expect(await duplicate).toEqual({ nameTaken: true });

      const unique = firstValueFrom(
        validator(new FormControl('New squad')) as
          Observable<ValidationErrors | null>,
      );

      await vi.advanceTimersByTimeAsync(300);
      expect(await unique).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});