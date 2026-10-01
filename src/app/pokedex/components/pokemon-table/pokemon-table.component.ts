
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import {
  Pokemon,
  PokemonStatKey,
} from '../../models/pokemon.model';


@Component({
  selector: 'app-pokemon-table',
  standalone: true,
  templateUrl: './pokemon-table.component.html',
  styleUrl: './pokemon-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class PokemonTableComponent {
  readonly pokemon = input.required<Pokemon[]>();

  readonly selected = output<Pokemon>();
  readonly sortChanged = output<PokemonStatKey | 'total'>();

  readonly columns: Array<{
    key: PokemonStatKey;
    label: string;
  }> = [
    { key: 'hp', label: 'HP' },
    { key: 'attack', label: 'Attack' },
    { key: 'defense', label: 'Defense' },
    { key: 'specialAttack', label: 'Sp. Atk' },
    { key: 'specialDefense', label: 'Sp. Def' },
    { key: 'speed', label: 'Speed' },
  ];
}