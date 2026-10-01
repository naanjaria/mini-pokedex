import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  PokemonStore,
} from '../../../pokedex/state/pokemon.store';
import { TeamStore } from '../../state/team.store';

const SELECTED_TEAM_KEY = 'mini-pokedex-selected-team';

@Component({
  selector: 'app-team-list',
  standalone: true,
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent implements OnInit {
  readonly store = inject(TeamStore);
  readonly pokemonStore = inject(PokemonStore);

  readonly state = toSignal(this.store.state$, {
    requireSync: true,
  });

  readonly saving = toSignal(this.store.saving$, {
    requireSync: true,
  });

  readonly message = toSignal(this.store.message$, {
    requireSync: true,
  });

  readonly pokemonState = toSignal(this.pokemonStore.state$, {
    requireSync: true,
  });

  readonly selectedTeamId = signal<string | null>(
    this.readSavedTeamId(),
  );

  readonly selectedTeam = computed(() =>
    this.state().data.find(
      (team) => team.id === this.selectedTeamId(),
    ) ?? null,
  );

  readonly members = computed(() => {
    const team = this.selectedTeam();

    if (!team) {
      return [];
    }

    const pokemonById = new Map(
      this.pokemonState().data.map((pokemon) => [
        pokemon.id,
        pokemon,
      ]),
    );

    return team.pokemonIds.flatMap((id) => {
      const pokemon = pokemonById.get(id);
      return pokemon ? [pokemon] : [];
    });
  });

  readonly totalBaseStats = computed(() =>
    this.members().reduce(
      (total, pokemon) => total + pokemon.total,
      0,
    ),
  );

  readonly typeDistribution = computed(() => {
    const counts = new Map<string, number>();

    // A dual-type Pokémon contributes once to each of its types.
    for (const pokemon of this.members()) {
      for (const type of pokemon.types) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => a.type.localeCompare(b.type));
  });

  constructor() {
    effect(() => {
      const id = this.selectedTeamId();

      // Storage may be unavailable in restricted browser sessions.
      try {
        if (id) {
          localStorage.setItem(SELECTED_TEAM_KEY, id);
        } else {
          localStorage.removeItem(SELECTED_TEAM_KEY);
        }
      } catch {
        // Team selection still works without persistence.
      }
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  private readSavedTeamId(): string | null {
    try {
      return localStorage.getItem(SELECTED_TEAM_KEY);
    } catch {
      return null;
    }
  }
}