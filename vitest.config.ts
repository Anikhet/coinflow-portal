import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
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
      thresholds: { statements: 80, branches: 75, functions: 75, lines: 80 },
    },
  },
})
