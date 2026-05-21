#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const projectArg = String(process.argv[2] || '').toLowerCase();
const action = String(process.argv[3] || '').toLowerCase();
const description = process.argv.slice(4).join(' ');

const PROJECTS = {
  data: { label: 'Data', dir: 'IoT-Data', logPrefix: 'data' },
  dashboard: { label: 'Dashboard', dir: 'IoT-Dashboard', logPrefix: 'dashboard' }
};

function usage() {
  console.error('Usage: node tools/gas-clasp.js <data|dashboard> <push|deploy> [description]');
  process.exit(2);
}

if (!PROJECTS[projectArg] || !/^(push|deploy)$/.test(action)) usage();

const project = PROJECTS[projectArg];
const projectRoot = path.join(repoRoot, project.dir);
const timestamp = compactDate(new Date());
const logPath = path.join(repoRoot, `${project.logPrefix}-${action}-${timestamp}.log`);

function writeLog(text = '') {
  console.log(text);
  fs.appendFileSync(logPath, text + '\n', 'utf8');
}

function compactDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

function displayDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function commandExists(command, args) {
  const result = spawnSync(command, args, { stdio: 'ignore', shell: false });
  return !result.error && result.status === 0;
}

function findRunner() {
  const appData = process.env.APPDATA || '';
  const localClasp = appData ? path.join(appData, 'npm', 'clasp.cmd') : '';
  if (localClasp && fs.existsSync(localClasp)) return { command: localClasp, baseArgs: [] };
  if (commandExists('clasp.cmd', ['--version'])) return { command: 'clasp.cmd', baseArgs: [] };
  const nodeRoots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
    .filter(Boolean)
    .map((root) => path.join(root, 'nodejs'));
  for (const root of nodeRoots) {
    const npxCli = path.join(root, 'node_modules', 'npm', 'bin', 'npx-cli.js');
    if (fs.existsSync(npxCli)) return { command: process.execPath, baseArgs: [npxCli, '--yes', '@google/clasp'] };
    const localNpx = path.join(root, 'npx.cmd');
    if (fs.existsSync(localNpx)) return { command: localNpx, baseArgs: ['--yes', '@google/clasp'] };
  }
  if (commandExists('npx.cmd', ['--version'])) return { command: 'npx.cmd', baseArgs: ['--yes', '@google/clasp'] };
  for (const root of nodeRoots) {
    const npmCli = path.join(root, 'node_modules', 'npm', 'bin', 'npm-cli.js');
    if (fs.existsSync(npmCli)) return { command: process.execPath, baseArgs: [npmCli, 'exec', '--yes', '@google/clasp', '--'] };
    const localNpm = path.join(root, 'npm.cmd');
    if (fs.existsSync(localNpm)) return { command: localNpm, baseArgs: ['exec', '--yes', '@google/clasp', '--'] };
  }
  if (commandExists('npm.cmd', ['--version'])) return { command: 'npm.cmd', baseArgs: ['exec', '--yes', '@google/clasp', '--'] };
  throw new Error('clasp.cmd, npx.cmd and npm.cmd were not found. Install Node.js/npm or @google/clasp.');
}

function deploymentIdFor(projectRoot) {
  const claspPath = path.join(projectRoot, '.clasp.json');
  const parsed = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
  if (!parsed.deploymentId) throw new Error(`${path.relative(repoRoot, claspPath)} does not contain deploymentId.`);
  return String(parsed.deploymentId);
}

function quoteCmd(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function runClasp() {
  const runner = findRunner();
  const env = Object.assign({}, process.env, {
    npm_config_cache: path.join(repoRoot, '.npm-cache')
  });
  const args = runner.baseArgs.slice();
  if (action === 'push') {
    args.push('push', '-f');
  } else {
    const depId = deploymentIdFor(projectRoot);
    const desc = description || `${project.logPrefix} deploy ${displayDate(new Date()).slice(0, 16)}`;
    args.push('deploy', '-i', depId, '-d', desc);
    writeLog(`Deployment ID: ${depId}`);
    writeLog(`Description: ${desc}`);
  }

  writeLog(`Command: ${runner.command} ${args.map((arg) => /[\s"]/.test(arg) ? quoteCmd(arg) : arg).join(' ')}`);
  const result = spawnSync(runner.command, args, {
    cwd: projectRoot,
    env,
    encoding: 'utf8',
    shell: false
  });
  if (result.stdout) result.stdout.trimEnd().split(/\r?\n/).forEach(writeLog);
  if (result.stderr) result.stderr.trimEnd().split(/\r?\n/).forEach(writeLog);
  if (result.error) throw result.error;
  return result.status == null ? 1 : result.status;
}

writeLog('==================================================');
writeLog(`${project.label} - clasp ${action}`);
writeLog(`Project: ${projectRoot}`);
writeLog(`Started: ${displayDate(new Date())}`);
writeLog('==================================================');

let exitCode = 1;
try {
  exitCode = runClasp();
} catch (err) {
  writeLog(err && err.stack ? err.stack : String(err));
  exitCode = 1;
}

writeLog(`Finished: ${displayDate(new Date())}`);
writeLog(`Exit code: ${exitCode}`);
if (exitCode === 0) writeLog(`[OK] ${project.label} ${action} completed.`);
process.exit(exitCode);
