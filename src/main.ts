import { initFederation } from '@angular-architects/native-federation';

initFederation()
  .catch((err) => console.error('[host] Federation init failed:', err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error('[host] Bootstrap failed:', err));
