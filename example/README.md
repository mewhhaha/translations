# Translations

This is a simple translation library for React and Vite.

- Pulls translations using vite's import.meta.glob
- Suspends until translations are loaded, but will use `startTransition` when changing language so won't drop down to the root suspense
- Mainly supports a flat key structure where they key contains the interpolation keys
- Some pluralization support
- Supports several providers, but only a single cache for languages
