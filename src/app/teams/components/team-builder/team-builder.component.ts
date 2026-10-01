import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
} from 'rxjs';

import { Pokemon } from '../../../pokedex/models/pokemon.model';
import { PokemonStore } from '../../../pokedex/state/pokemon.store';
import { TeamStore } from '../../state/team.store';
import {
  pokemonCountValidator,
  uniqueTeamNameValidator,
} from '../../validators/team.validators';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBuilderComponent {
  readonly teams = inject(TeamStore);
  readonly pokemonStore = inject(PokemonStore);

  readonly search = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(30),
        Validators.pattern(/^\S(?:[\s\S]*\S)?$/),
      ],
      asyncValidators: [uniqueTeamNameValidator(this.teams)],
    }),
    pokemon: new FormControl<Pokemon[]>([], {
      nonNullable: true,
      validators: [pokemonCountValidator],
    }),
  });

  readonly teamState = toSignal(this.teams.state$, {
    requireSync: true,
  });

  readonly saving = toSignal(this.teams.saving$, {
    requireSync: true,
  });

  readonly selected = toSignal(
    this.form.controls.pokemon.valueChanges,
    { initialValue: this.form.controls.pokemon.value },
  );

  // Search the same cache as the table; no extra API calls are needed.
  readonly matches = toSignal(
    this.search.valueChanges.pipe(
      startWith(''),
      map((value) => value.trim().toLowerCase()),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((search) =>
        this.pokemonStore.state$.pipe(
          map((state) => ({
            status: state.status,
            error: state.error,
            items: state.data.filter(
              (pokemon) => pokemon.name.includes(search),
            ),
          })),
        ),
      ),
    ),
    {
      initialValue: {
        status: 'loading' as const,
        error: null as string | null,
        items: [] as Pokemon[],
      },
    },
  );

  readonly suggestions = computed(() => {
    const selectedIds = new Set(
      this.selected().map((pokemon) => pokemon.id),
    );

    return this.matches().items
      .filter((pokemon) => !selectedIds.has(pokemon.id))
      .slice(0, 10);
  });

  add(pokemon: Pokemon): void {
    const control = this.form.controls.pokemon;

    if (
      control.value.length >= 6
      || control.value.some((item) => item.id === pokemon.id)
    ) {
      return;
    }

    control.setValue([...control.value, pokemon]);
    control.markAsDirty();
    control.markAsTouched();
    this.search.setValue('');
  }

  remove(id: number): void {
    const control = this.form.controls.pokemon;

    control.setValue(control.value.filter((pokemon) => pokemon.id !== id));
    control.markAsDirty();
    control.markAsTouched();
  }

   submit(): void {
    this.form.markAllAsTouched();

    if (
      this.form.invalid
      || this.form.pending
      || this.saving()
      || !['success', 'empty'].includes(this.teamState().status)
    ) {
      return;
    }

    // Recheck the latest list in case it changed after validation.
    const name = this.form.controls.name.value.trim();
    const exists = this.teamState().data.some(
      (team) => team.name.trim().toLowerCase() === name.toLowerCase(),
    );

    if (exists) {
      this.form.controls.name.setErrors({ nameTaken: true });
      return;
    }

    this.teams.create({
      trainerId: '1',
      name,
      pokemonIds: this.selected().map((pokemon) => pokemon.id),
    });
  }
}