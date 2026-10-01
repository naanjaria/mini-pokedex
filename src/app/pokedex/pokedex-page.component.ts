import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { Pokemon } from './models/pokemon.model';
import { PokemonStore } from './state/pokemon.store';
import { PokemonSelectors } from './state/pokemon.selectors';
import {
  PokemonTableComponent,
} from './components/pokemon-table/pokemon-table.component';
import {
  PokemonDetailComponent,
} from './components/pokemon-detail/pokemon-detail.component';
import {
  TeamListComponent,
} from '../teams/components/team-list/team-list.component';

import {
  TeamBuilderComponent,
} from '../teams/components/team-builder/team-builder.component';

@Component({
  selector: 'app-pokedex-page',
  standalone: true,
  imports: [PokemonTableComponent,PokemonDetailComponent,TeamListComponent,TeamBuilderComponent],
  templateUrl: './pokedex-page.component.html',
  styleUrl: './pokedex-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPageComponent implements OnInit {
  readonly activeTab = signal<'pokedex' | 'teams'>('pokedex');
  readonly store = inject(PokemonStore);
  readonly selectors = inject(PokemonSelectors);

  // Bridge the store streams into signals for the template.
  readonly state = toSignal(this.store.state$, {
    requireSync: true,
  });

  readonly types = toSignal(this.selectors.types$, {
    initialValue: [] as string[],
  });

  readonly page = toSignal(this.selectors.page$, {
    initialValue: {
      items: [] as Pokemon[],
      total: 0,
      pageIndex: 0,
      pageSize: 10,
      pageCount: 0,
    },
  });

  readonly selectedPokemon = signal<Pokemon | null>(null);
private readonly teamDialog =
  viewChild<ElementRef<HTMLDialogElement>>('teamDialog');

openTeamBuilder(): void {
  this.teamDialog()?.nativeElement.showModal();
}

closeTeamBuilder(): void {
  this.teamDialog()?.nativeElement.close();
}
  ngOnInit(): void {
    this.store.load();
  }
}