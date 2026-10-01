import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subscription } from 'rxjs';

import { LoadState } from '../../common/models/load-state.model';
import { CreateTeamInput, Team } from '../models/team.model';
import { TeamApiService } from '../services/team-api.service';

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly api = inject(TeamApiService);
  private readonly destroyRef = inject(DestroyRef);
  private loadRequest?: Subscription;

  private readonly stateSubject =
    new BehaviorSubject<LoadState<Team[]>>({
      status: 'loading',
      data: [],
      error: null,
    });

  private readonly savingSubject = new BehaviorSubject(false);
  private readonly messageSubject = new BehaviorSubject<string | null>(null);

  readonly state$ = this.stateSubject.asObservable();
  readonly saving$ = this.savingSubject.asObservable();
  readonly message$ = this.messageSubject.asObservable();

  /** Loads teams, keeping existing data available during a refresh. */
  load(): void {
    // Avoid replacing optimistic changes with a concurrent reload.
    if (this.savingSubject.value) {
      return;
    }

    this.loadRequest?.unsubscribe();

    const previous = this.stateSubject.value.data;

    this.stateSubject.next({
      status: 'loading',
      data: previous,
      error: null,
    });

    this.loadRequest = this.api.getTeams().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (teams) => this.setTeams(teams),
      error: () => {
        this.stateSubject.next({
          status: 'error',
          data: previous,
          error: 'Unable to load teams. Check that the mock server is running.',
        });
      },
    });
  }

  /** Shows a new team immediately, replacing it after the server saves it. */
  create(input: CreateTeamInput): void {
    if (
      this.savingSubject.value
      || !['success', 'empty'].includes(this.stateSubject.value.status)
    ) {
      return;
    }

    const previous = this.stateSubject.value.data;

    const temporary: Team = {
      id: `temporary-${crypto.randomUUID()}`,
      trainerId: input.trainerId,
      name: input.name.trim(),
      pokemonIds: [...input.pokemonIds],
      createdAt: new Date().toISOString(),
    };

    // Only one mutation runs at a time, keeping rollback straightforward.
    this.savingSubject.next(true);
    this.messageSubject.next(null);
    this.setTeams([...previous, temporary]);

    this.api.createTeam(input).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (saved) => {
        this.setTeams(
          this.stateSubject.value.data.map((team) =>
            team.id === temporary.id ? saved : team,
          ),
        );
        this.savingSubject.next(false);
        this.messageSubject.next('Team created.');
      },
      error: () => {
        this.setTeams(previous);
        this.savingSubject.next(false);
        this.messageSubject.next(
          'Could not create the team. The temporary team was removed.',
        );
      },
    });
  }

  /** Removes a team immediately and restores it if deletion fails. */
  delete(id: string): void {
    if (
      this.savingSubject.value
      || !['success', 'empty'].includes(this.stateSubject.value.status)
    ) {
      return;
    }

    const previous = this.stateSubject.value.data;

    if (!previous.some((team) => team.id === id)) {
      return;
    }

    this.savingSubject.next(true);
    this.messageSubject.next(null);
    this.setTeams(previous.filter((team) => team.id !== id));

    this.api.deleteTeam(id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.savingSubject.next(false);
        this.messageSubject.next('Team deleted.');
      },
      error: () => {
        this.setTeams(previous);
        this.savingSubject.next(false);
        this.messageSubject.next(
          'Could not delete the team. It has been restored.',
        );
      },
    });
  }

  private setTeams(teams: Team[]): void {
    this.stateSubject.next({
      status: teams.length ? 'success' : 'empty',
      data: teams,
      error: null,
    });
  }
}