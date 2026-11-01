import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'connexion',
    title: 'Connexion · Yo Wallet',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((module) => module.LoginPage),
  },
  {
    path: 'inscription',
    title: 'Inscription · Yo Wallet',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then((module) => module.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/shell/shell').then((module) => module.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord · Yo Wallet',
        loadComponent: () =>
          import('./pages/dashboard/dashboard').then((module) => module.DashboardPage),
      },
      {
        path: 'profil',
        title: 'Profil · Yo Wallet',
        loadComponent: () => import('./pages/profile/profile').then((module) => module.ProfilePage),
      },
    ],
  },
  {
    path: '**',
    title: 'Page introuvable · Yo Wallet',
    loadComponent: () => import('./pages/not-found/not-found').then((module) => module.NotFoundPage),
  },
];
