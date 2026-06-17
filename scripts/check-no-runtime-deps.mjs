/**
 * CI gate: the shipped package must declare ZERO third-party runtime dependencies (the port's
 * "no external editor/runtime deps" invariant). react/react-dom live in peerDependencies; the
 * editor engine is bundled in-package. Single-package repo, so only the root manifest is checked.
 */
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = pkg.dependencies ?? {};
const errors = Object.keys(deps).map((dep) => `  ${pkg.name}: third-party runtime dependency "${dep}"`);

if (errors.length > 0) {
  console.error(
    'check-no-runtime-deps: FAIL — the package must have zero third-party runtime deps:\n' + errors.join('\n'),
  );
  process.exit(1);
}
console.log('check-no-runtime-deps: OK — zero third-party runtime deps');
