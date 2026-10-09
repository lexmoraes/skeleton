import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { Shell } from './core/layout/shell/shell';
import { Login } from './features/auth/pages/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      // Add your own feature routes here, e.g.:
      // { path: 'widgets', component: WidgetList },
      // { path: '', redirectTo: 'widgets', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
