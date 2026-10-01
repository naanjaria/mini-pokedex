import {
  AbstractControl,
  AsyncValidatorFn,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { map, switchMap, take, timer } from 'rxjs';

import { TeamStore } from '../state/team.store';

/** Checks the name against loaded teams after a short typing delay. */
export function uniqueTeamNameValidator(
  store: TeamStore,
): AsyncValidatorFn {
  return (control: AbstractControl) =>
    timer(300).pipe(
      switchMap(() => store.state$.pipe(take(1))),
      map((state): ValidationErrors | null => {
        if (state.status === 'loading' || state.status === 'error') {
          return { teamCheckUnavailable: true };
        }

        const name = String(control.value ?? '').trim().toLowerCase();

        return state.data.some(
          (team) => team.name.trim().toLowerCase() === name,
        )
          ? { nameTaken: true }
          : null;
      }),
    );
}

/** Requires between one and six selected Pokémon. */
export const pokemonCountValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const count = Array.isArray(control.value)
    ? control.value.length
    : 0;

  return count >= 1 && count <= 6
    ? null
    : { pokemonCount: true };
};