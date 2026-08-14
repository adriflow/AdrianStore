import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

async function bootstrap() {
  // Modo pruebas LAN: si existe assets/config.local.json, usa esa apiUrl.
  // Bórralo y la app vuelve a la normalidad sin tocar nada más.
  try {
    const res = await fetch('assets/config.local.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data?.apiUrl) {
        (window as any).__ADRIAN_API_BASE__ = data.apiUrl;
      }
    }
  } catch {
    // No existe el archivo de pruebas; se usa la apiUrl de environment.
  }

  await platformBrowserDynamic().bootstrapModule(AppModule);
}

bootstrap().catch((err) => console.error(err));
