import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  EMPTY,
  Subscription,
  expand,
  reduce,
} from 'rxjs';

import { LoadState } from '../../common/models/load-state.model';
import { Pokemon } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';

@Injectable({ providedIn: 'root' })
export class PokemonStore {
  private readonly api = inject(PokemonApiService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  private readonly stateSubject =
    new BehaviorSubject<LoadState<Pokemon[]>>({
      status: 'loading',
      data: [],
      error: null,
    });

  // Consumers can observe state, but only the store can change it.
  readonly state$ = this.stateSubject.asObservable();

  /**
   * Loads Pokémon in API pages and caches the completed list.
   * Pass force=true to refresh an existing cache.
   */
  load(force = false): void {
    const current = this.stateSubject.value;

    // Reuse the cache when the user returns to the Pokédex.
    if (!force && current.status === 'success') {
      return;
    }

    // Cancel the previous load so it cannot overwrite a newer result.
    this.request?.unsubscribe();

    // Keep existing data available while refreshing.
    this.stateSubject.next({
      status: 'loading',
      data: current.data,
      error: null,
    });

    // API batches are separate from the table's 10/25/50-row pages.
    const batchSize = 100;
    let offset = 0;

    this.request = this.api.getPokemonPage(batchSize, offset).pipe(
      expand((page) => {
        // A short page means we have reached the end of the API list.
        if (page.length < batchSize) {
          return EMPTY;
        }

        offset += batchSize;
        return this.api.getPokemonPage(batchSize, offset);
      }),
      // Publish the complete list once all API pages have loaded.
      reduce(
        (all: Pokemon[], page: Pokemon[]) => [...all, ...page],
        [] as Pokemon[],
      ),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (pokemon) => {
        this.stateSubject.next({
          status: pokemon.length ? 'success' : 'empty',
          data: pokemon,
          error: null,
        });
      },
      error: () => {
        // A failed refresh should not discard the previous cache.
        this.stateSubject.next({
          status: 'error',
          data: current.data,
          error: 'Unable to load Pokémon. Check your connection and retry.',
        });
      },
    });
  }

  /** Starts a fresh load after a failed request. */
  retry(): void {
    this.load(true);
  }
}