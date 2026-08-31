import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // No coverage threshold. This is a UI project: the tests that exist pin a
    // few real invariants (period boundaries, pagination slots, the drawer's
    // mutual exclusion) and are worth keeping, but coverage is not a goal here
    // and a gate that fails is worse than no gate.
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/mocks/**', 'src/stores/**'],
      // Presentation-layer mapping and fixture generation are verified visually,
      // not by assertion.
      exclude: [
        // Presentation-layer modules are verified visually, not by assertion:
        // tone/label maps and nav config are declarative data, .tsx files are
        // React glue, and seed-data generates fixtures the tests consume.
        '**/*.tsx',
        'src/mocks/seed-data.ts',
        'src/lib/tone-map.ts',
        'src/lib/nav.ts',
        'src/lib/method-labels.ts',
        'src/lib/cn.ts',
      ],
    },
  },
})
