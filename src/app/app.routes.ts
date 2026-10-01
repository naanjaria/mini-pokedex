import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pokedex/pokedex-page.component').then(
        (component) => component.PokedexPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];