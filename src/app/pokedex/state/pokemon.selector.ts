import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
} from 'rxjs';

import {
  Pokemon,
  PokemonStatKey,
} from '../models/pokemon.model';
import { PokemonStore } from './pokemon.store';

type SortKey = PokemonStatKey | 'total';
type SortDirection = 'asc' | 'desc';

interface SortSettings {
  key: SortKey;
  direction: SortDirection;
}

@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  private readonly store = inject(PokemonStore);

  private readonly searchSubject = new BehaviorSubject('');
  private readonly typeSubject = new BehaviorSubject('');
  private readonly sortSubject = new BehaviorSubject<SortSettings>({
    key: 'total',
    direction: 'desc',
  });
  private readonly pageSubject = new BehaviorSubject(0);
  private readonly pageSizeSubject = new BehaviorSubject(10);

  readonly state$ = this.store.state$;

  private readonly pokemon$ = this.state$.pipe(
    map((state) => state.data),
    // Loading-state changes alone should not reprocess the same array.
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly types$ = this.pokemon$.pipe(
    // Build the dropdown options from the cached Pokémon.
    map((pokemon) =>
      [...new Set(pokemon.flatMap((item) => item.types))].sort(),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly searched$ = this.searchSubject.pipe(
    map((value) => value.trim().toLowerCase()),
    // Wait until the user pauses typing before filtering.
    debounceTime(300),
    distinctUntilChanged(),
    // Replace the previous search stream and observe cache updates.
    switchMap((search) =>
      this.pokemon$.pipe(
        map((pokemon) =>
          pokemon.filter((item) => item.name.includes(search)),
        ),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly filtered$ = combineLatest([
    this.searched$,
    this.typeSubject.pipe(distinctUntilChanged()),
    this.sortSubject,
  ]).pipe(
    map(([pokemon, type, sort]) => {
      const filtered = type
        ? pokemon.filter((item) => item.types.includes(type))
        : pokemon;

      // Copy before sorting so the cached array stays unchanged.
      return [...filtered].sort((a, b) => {
        const difference =
          this.statValue(a, sort.key) - this.statValue(b, sort.key);

        // Use ID as a tie-breaker to keep equal-stat rows in a stable order.
        return (
          (sort.direction === 'asc' ? difference : -difference)
          || a.id - b.id
        );
      });
    }),
    // The table and pagination can share the same filtered result.
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly page$ = combineLatest([
    this.filtered$,
    this.pageSubject,
    this.pageSizeSubject,
  ]).pipe(
    map(([pokemon, requestedPage, pageSize]) => {
      const total = pokemon.length;
      const pageCount = Math.ceil(total / pageSize);

      // Filtering may leave fewer pages than the user previously had.
      const pageIndex = Math.min(
        requestedPage,
        Math.max(0, pageCount - 1),
      );
      const start = pageIndex * pageSize;

      return {
        items: pokemon.slice(start, start + pageSize),
        total,
        pageIndex,
        pageSize,
        pageCount,
      };
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Updates the debounced name search and returns to the first page. */
  setSearch(value: string): void {
    this.pageSubject.next(0);
    this.searchSubject.next(value);
  }

  /** Updates the type filter and returns to the first page. */
  setType(value: string): void {
    this.pageSubject.next(0);
    this.typeSubject.next(value);
  }

  /** Sorts descending initially, then toggles direction on repeated clicks. */
  setSort(key: SortKey): void {
    const current = this.sortSubject.value;

    this.sortSubject.next({
      key,
      direction:
        current.key === key && current.direction === 'desc'
          ? 'asc'
          : 'desc',
    });

    this.pageSubject.next(0);
  }

  /** Selects a zero-based page index; negative values become zero. */
  setPage(index: number): void {
    this.pageSubject.next(Math.max(0, Math.floor(index)));
  }

  /** Changes the page size to 10, 25, or 50 and resets pagination. */
  setPageSize(size: number): void {
    if (![10, 25, 50].includes(size)) {
      return;
    }

    this.pageSubject.next(0);
    this.pageSizeSubject.next(size);
  }

  private statValue(pokemon: Pokemon, key: SortKey): number {
    return key === 'total'
      ? pokemon.total
      : pokemon.stats[key];
  }
}