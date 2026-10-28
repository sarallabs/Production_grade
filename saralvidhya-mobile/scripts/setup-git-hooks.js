/**
 * Points git at the versioned hooks in <repo>/.githooks (secret scan +
 * large-file / build-artifact gate). Runs from `postinstall`.
 *
 * Never fails the install: EAS/CI build machines may not have a git checkout.
 */
const { execSync } = require('child_process');

try {
  if (process.env.CI || process.env.EAS_BUILD) process.exit(0);
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  const current = (() => {
    try {
      return execSync('git config core.hooksPath', { encoding: 'utf8' }).trim();
    } catch {
      return '';
    }
  })();
  if (current !== '.githooks') {
    execSync('git config core.hooksPath .githooks', { stdio: 'ignore' });
    console.log('[setup-git-hooks] Enabled repo hooks (.githooks): secret scan + large-file guard');
  }
} catch {
  // Not a git checkout or git unavailable — skip silently.
}
