import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from './auth';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.profile() ? inject(Router).parseUrl(auth.homeUrl()) : true;
};

export const employeeGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.profile()) return router.parseUrl('/login');
  return auth.isManager() ? router.parseUrl('/team') : true;
};

export const managerGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);
  if (!auth.profile()) return router.parseUrl('/login');
  return auth.isManager() ? true : router.parseUrl('/my-tasks');
};
