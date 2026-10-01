import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import Chart from 'chart.js/auto';

import { LoadState } from '../../../common/models/load-state.model';
import { PokemonDetail } from '../../models/pokemon.model';
import { PokemonApiService } from '../../services/pokemon-api.service';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  templateUrl: './pokemon-detail.component.html',
  styleUrl: './pokemon-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  readonly pokemonId = input.required<number>();
  readonly closed = output<void>();

  private readonly api = inject(PokemonApiService);
  private readonly retryCount = signal(0);
  private readonly chartCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly state = signal<LoadState<PokemonDetail | null>>({
    status: 'loading',
    data: null,
    error: null,
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.pokemonId();
      this.retryCount();

      this.state.set({
        status: 'loading',
        data: null,
        error: null,
      });

      const request = this.api.getPokemonDetail(id).subscribe({
        next: (pokemon) => {
          this.state.set({
            status: pokemon ? 'success' : 'empty',
            data: pokemon,
            error: null,
          });
        },
        error: () => {
          this.state.set({
            status: 'error',
            data: null,
            error: 'Unable to load Pokémon details. Please retry.',
          });
        },
      });

      // Cancel the old request when selection changes or the panel closes.
      onCleanup(() => request.unsubscribe());
    });

    effect((onCleanup) => {
      const canvas = this.chartCanvas()?.nativeElement;
      const pokemon = this.state().data;

      if (!canvas || !pokemon) {
        return;
      }

      const stats = pokemon.stats;
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      const chart = new Chart(canvas, {
        type: 'radar',
        data: {
          labels: [
            'HP',
            'Attack',
            'Defense',
            'Sp. Atk',
            'Sp. Def',
            'Speed',
          ],
          datasets: [
            {
              label: pokemon.name,
              data: [
                stats.hp,
                stats.attack,
                stats.defense,
                stats.specialAttack,
                stats.specialDefense,
                stats.speed,
              ],
              borderColor: '#2459bc',
              backgroundColor: 'rgba(36, 89, 188, 0.15)',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: reducedMotion ? 0 : 500,
          },
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              suggestedMax: 150,
            },
          },
        },
      });

      // Release Chart.js resources before replacing its canvas.
      onCleanup(() => chart.destroy());
    });
  }

  retry(): void {
    this.retryCount.update((count) => count + 1);
  }
}