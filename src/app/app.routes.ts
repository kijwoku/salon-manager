import { inject } from '@angular/core';
import { Routes } from '@angular/router';

import { Auth } from './core/auth';
import { employeeGuard, guestGuard, managerGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Logowanie — Salon Manager',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'my-tasks',
    title: 'Moje zadania — Salon Manager',
    canActivate: [employeeGuard],
    loadComponent: () => import('./pages/my-tasks/my-tasks').then((m) => m.MyTasks),
  },
  {
    path: 'team',
    title: 'Zespół — Salon Manager',
    canActivate: [managerGuard],
    loadComponent: () => import('./pages/team/team').then((m) => m.Team),
  },
  {
    path: 'reports',
    title: 'Raporty — Salon Manager',
    canActivate: [managerGuard],
    loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
  },
  { path: '**', redirectTo: () => inject(Auth).homeUrl() },
];
