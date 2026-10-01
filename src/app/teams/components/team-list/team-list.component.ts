import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TeamStore } from '../../state/team.store';

@Component({
  selector: 'app-team-list',
  standalone: true,
  templateUrl: './team-list.component.html',
  styleUrl: './team-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent implements OnInit {
  readonly store = inject(TeamStore);

  readonly state = toSignal(this.store.state$, {
    requireSync: true,
  });

  readonly saving = toSignal(this.store.saving$, {
    requireSync: true,
  });

  readonly message = toSignal(this.store.message$, {
    requireSync: true,
  });

  ngOnInit(): void {
    this.store.load();
  }
}