/**
 * Run a command with timing. Usage: node scripts/run-with-timing.js <command>
 * Used by perf:typecheck, perf:lint, perf:build.
 */
const { execSync } = require('child_process');
const args = process.argv.slice(2);
const cmd = args.join(' ');
if (!cmd) {
  console.error('Usage: node scripts/run-with-timing.js <command>');
  process.exit(1);
}
const start = Date.now();
try {
  execSync(cmd, { stdio: 'inherit', shell: true });
  console.log('\n[perf] Duration:', Date.now() - start, 'ms');
} catch (err) {
  process.exit(err.status ?? 1);
}
