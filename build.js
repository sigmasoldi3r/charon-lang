/**
 * Build script.
 * Avoids cross platform issues for chaining scripts without having to install
 * extra packages.
 */
const { execSync } = require('child_process');

try {
  // Refresh pegjs
  execSync('pegjs -o src/charon.generated.js resources/charon.pegjs')

  // Run typescript
  execSync('tsc')

  // Rollup
  execSync('rollup -c rollup.config.js')
} catch (error) {
  console.error(error.output[1].toString(), error.output[2].toString());
  throw error;
}