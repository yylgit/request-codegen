#!/usr/bin/env node
const { execSync } = require('child_process');

function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

const baseRef = process.env.BASE_REF || process.argv[2];

try {
  if (baseRef) {
    try { execSync(`git fetch origin ${baseRef}`, { stdio: 'ignore' }); } catch (e) {}
    const diff = run(`git diff --name-only origin/${baseRef}...HEAD`);
    const files = diff.split('\n').filter(Boolean);
    const changed = files.filter(f => /(^|\/)package.json$/.test(f) || /(^|\/)pnpm-lock.yaml$/.test(f) || /(^|\/)package-lock.json$/.test(f));
    if (changed.length) {
      console.log('Warning: version-related files changed in this PR: ' + changed.join(', '));
    } else {
      console.log('No version-related files changed compared to ' + baseRef);
    }
  } else {
    const diff = run('git diff --name-only HEAD^..HEAD');
    const files = diff.split('\n').filter(Boolean);
    const changed = files.filter(f => /package.json|pnpm-lock.yaml|package-lock.json/.test(f));
    if (changed.length) console.log('Warning: version-related files changed in last commit: ' + changed.join(', '));
    else console.log('No version-related files changed in last commit');
  }
  process.exit(0);
} catch (err) {
  console.log('Could not determine version-file changes:', err.message);
  process.exit(0);
}
const fs = require('fs');
const cp = require('child_process');

function getBasePackageJson() {
  const baseRef = process.env.GITHUB_BASE_REF || 'main';
  try {
    const out = cp.execSync(`git show origin/${baseRef}:package.json`, { encoding: 'utf8' });
    return JSON.parse(out);
  } catch (e) {
    console.warn('Could not read package.json from base ref (origin/' + baseRef + '). Skipping check.');
    process.exit(0);
  }
}

function getHeadPackageJson() {
  return JSON.parse(fs.readFileSync('package.json', 'utf8'));
}

const basePkg = getBasePackageJson();
const headPkg = getHeadPackageJson();

if (basePkg.version !== headPkg.version) {
  console.error('package.json version was modified in this branch. Please do not manually bump versions in PRs. Use changesets instead.');
  process.exit(1);
}

console.log('No package.json version change detected.');
process.exit(0);
