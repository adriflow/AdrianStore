import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

async function bootstrap() {
  // Cargar fuentes de Google en runtime para no bloquear el build
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@500;600;700&display=swap';
  document.head.appendChild(link);

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
