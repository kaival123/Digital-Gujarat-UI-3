import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { PreloadAllModules, provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const DigitalGujarat = definePreset(Aura, {
  semantic: {
    primary: {
      50: 'color-mix(in srgb, var(--brand) 8%, #fff)',
      100: 'color-mix(in srgb, var(--brand) 16%, #fff)',
      200: 'color-mix(in srgb, var(--brand) 30%, #fff)',
      300: 'color-mix(in srgb, var(--brand) 50%, #fff)',
      400: 'color-mix(in srgb, var(--brand) 75%, #fff)',
      500: 'var(--brand)',
      600: 'color-mix(in srgb, var(--brand) 88%, #000)',
      700: 'color-mix(in srgb, var(--brand) 72%, #000)',
      800: 'color-mix(in srgb, var(--brand) 56%, #000)',
      900: 'color-mix(in srgb, var(--brand) 40%, #000)',
      950: 'color-mix(in srgb, var(--brand) 26%, #000)',
    },
    /* dark mode: PrimeNG inputs, menus, dialogs, tables on darks tinted with the theme's surface colour (--ink),
       the same scale the site uses (tokens.scss --dk-*), instead of Aura's zinc */
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff',
          50: 'color-mix(in srgb, var(--ink) 8%, #eef2f2)',
          100: 'color-mix(in srgb, var(--ink) 15%, #dde4e3)',
          200: 'color-mix(in srgb, var(--ink) 25%, #c5cfce)',
          300: 'color-mix(in srgb, var(--ink) 35%, #a3afae)',
          400: 'color-mix(in srgb, var(--ink) 45%, #7d8a89)',
          500: 'color-mix(in srgb, var(--ink) 55%, #5a6666)',
          600: 'color-mix(in srgb, var(--ink) 60%, #34403f)',
          700: 'var(--dk-line)',
          800: 'var(--dk-chip)',
          900: 'var(--dk-card)',
          950: 'var(--dk-bg)',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }), withPreloading(PreloadAllModules)),
    providePrimeNG({
      theme: {
        preset: DigitalGujarat,
        options: { darkModeSelector: '.app-dark' },
      },
    }),
  ],
};
