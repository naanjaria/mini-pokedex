import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { LoadState } from '../../common/models/load-state.model';
import { Pokemon } from '../models/pokemon.model';
import { PokemonSelectors } from './pokemon.selectors';
import { PokemonStore } from './pokemon.store';

function makePokemon(
  id: number,
  name: string,
  type: string,
  attack: number,
): Pokemon {
  return {
    id,
    name,
    types: [type],
    height: 10,
    weight: 100,
    spriteUrl: null,
    stats: {
      hp: 50,
      attack,
      defense: 50,
      specialAttack: 50,
      specialDefense: 50,
      speed: 50,
    },
    total: 250 + attack,
  };
}

describe('PokemonSelectors', () => {
  it('debounces search, filters by type, and sorts by attack', async () => {
    vi.useFakeTimers();

    const state = new BehaviorSubject<LoadState<Pokemon[]>>({
      status: 'success',
      error: null,
      data: [
        makePokemon(4, 'charmander', 'fire', 52),
        makePokemon(5, 'charmeleon', 'fire', 64),
        makePokemon(25, 'pikachu', 'electric', 55),
      ],
    });

    TestBed.configureTestingModule({
      providers: [
        PokemonSelectors,
        {
          provide: PokemonStore,
          useValue: { state$: state.asObservable() },
        },
      ],
    });

    const selectors = TestBed.inject(PokemonSelectors);
    let names: string[] = [];

    const subscription = selectors.filtered$.subscribe((pokemon) => {
      names = pokemon.map((item) => item.name);
    });

    try {
      selectors.setSearch('char');
      selectors.setType('fire');
      selectors.setSort('attack');

      await vi.advanceTimersByTimeAsync(299);
      expect(names).toEqual([]);

      await vi.advanceTimersByTimeAsync(1);
      expect(names).toEqual(['charmeleon', 'charmander']);

      selectors.setSort('attack');
      expect(names).toEqual(['charmander', 'charmeleon']);

      selectors.setType('water');
      expect(names).toEqual([]);
    } finally {
      subscription.unsubscribe();
      vi.useRealTimers();
    }
  });
});