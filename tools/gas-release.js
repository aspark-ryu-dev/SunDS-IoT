#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const action = String(process.argv[2] || '').toLowerCase();
const target = String(process.argv[3] || '').toLowerCase();
const descriptionArg = process.argv.slice(4).join(' ').trim();
const localRoot = path.join(repoRoot, '.local');
const logRoot = path.join(localRoot, 'logs');
const npmCache = path.join(localRoot, 'npm-cache');

const PROJECTS = {
  data: {
    label: 'Data',
    dir: 'IoT-Data',
    tagPrefix: 'gas-data-v'
  },
  dashboard: {
    label: 'Dashboard',
    dir: 'IoT-Dashboard',
    tagPrefix: 'gas-dashboard-v'
  }
};

function fail(message) {
  console.error('[ERROR] ' + message);
  process.exit(1);
}

function usage() {
  console.error('Usage: node tools/gas-release.js <status|push|deploy> <data|dashboard|all> [description]');
  process.exit(2);
}

if (!/^(status|push|deploy)$/.test(action)) usage();
if (!/^(data|dashboard|all)$/.test(target)) usage();
if (action === 'deploy' && target === 'all') fail('Deploy each project separately.');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    encoding: 'utf8',
    shell: false,
    stdio: options.inherit ? 'inherit' : 'pipe'
  });
  if (result.error) throw result.error;
  if (!options.allowFailure && result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(output || `${command} exited with ${result.status}`);
  }
  return result;
}

function git(args, allowFailure = false) {
  return run('git', args, { allowFailure });
}

function gitText(args, allowFailure = false) {
  return String(git(args, allowFailure).stdout || '').trim();
}

function currentBranch() {
  return gitText(['branch', '--show-current']);
}

function currentHead() {
  return gitText(['rev-parse', 'HEAD']);
}

function shortHead() {
  return gitText(['rev-parse', '--short=8', 'HEAD']);
}

function workingTreeStatus() {
  return gitText(['status', '--porcelain']);
}

function upstreamHead(branch) {
  return gitText(['rev-parse', `origin/${branch}`], true);
}

function latestTag(prefix) {
  const tags = gitText(['tag', '--list', `${prefix}*`, '--sort=-version:refname']);
  return tags ? tags.split(/\r?\n/)[0] : '';
}

function projectRoot(project) {
  return path.join(repoRoot, project.dir);
}

function projectConfig(project) {
  const file = path.join(projectRoot(project), '.clasp.json');
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!parsed.scriptId || !parsed.deploymentId) {
    throw new Error(`${project.dir}/.clasp.json requires scriptId and deploymentId.`);
  }
  return parsed;
}

function buildVersion(project) {
  const code = fs.readFileSync(path.join(projectRoot(project), 'Code.gs'), 'utf8');
  const match = code.match(/BUILD_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw new Error(`${project.dir}/Code.gs does not define BUILD_VERSION.`);
  return match[1];
}

function syncShared(project, writeLog) {
  const sharedRoot = path.join(repoRoot, 'shared');
  if (!fs.existsSync(sharedRoot)) return;
  fs.readdirSync(sharedRoot)
    .filter((name) => name.endsWith('.gs'))
    .forEach((name) => {
      const destination = path.join(projectRoot(project), `_shared_${name}`);
      fs.copyFileSync(path.join(sharedRoot, name), destination);
      writeLog(`shared/${name} -> ${project.dir}/_shared_${name}`);
    });
}

function findClaspRunner() {
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
    .filter(Boolean)
    .map((root) => path.join(root, 'nodejs'));
  const appDataClasp = process.env.APPDATA
    ? path.join(process.env.APPDATA, 'npm', 'clasp.cmd')
    : '';
  if (appDataClasp && fs.existsSync(appDataClasp)) {
    return { command: appDataClasp, args: [] };
  }
  for (const root of roots) {
    const npxCli = path.join(root, 'node_modules', 'npm', 'bin', 'npx-cli.js');
    if (fs.existsSync(npxCli)) {
      return { command: process.execPath, args: [npxCli, '--yes', '@google/clasp'] };
    }
  }
  return { command: 'npx.cmd', args: ['--yes', '@google/clasp'] };
}

function createLogger(project, commandName) {
  fs.mkdirSync(logRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(logRoot, `${project.dir}-${commandName}-${stamp}.log`);
  return {
    file,
    write(text = '') {
      console.log(text);
      fs.appendFileSync(file, text + '\n', 'utf8');
    }
  };
}

function clasp(project, args, commandName) {
  fs.mkdirSync(npmCache, { recursive: true });
  const logger = createLogger(project, commandName);
  const runner = findClaspRunner();
  const env = Object.assign({}, process.env, { npm_config_cache: npmCache });
  syncShared(project, logger.write);
  logger.write(`${project.label} ${commandName}`);
  logger.write(`Git: ${shortHead()} / ${buildVersion(project)}`);
  const result = run(runner.command, runner.args.concat(args), {
    cwd: projectRoot(project),
    env,
    allowFailure: true
  });
  [result.stdout, result.stderr].filter(Boolean).forEach((output) => {
    String(output).trimEnd().split(/\r?\n/).forEach(logger.write);
  });
  if (result.status !== 0) {
    throw new Error(`${project.label} ${commandName} failed. Log: ${path.relative(repoRoot, logger.file)}`);
  }
  return String(result.stdout || '') + '\n' + String(result.stderr || '');
}

function printStatus(project) {
  const branch = currentBranch();
  const clean = workingTreeStatus() === '';
  const upstream = upstreamHead(branch);
  const synced = !!upstream && upstream === currentHead();
  console.log([
    project.label,
    `build=${buildVersion(project)}`,
    `git=${shortHead()}`,
    `branch=${branch || '-'}`,
    `clean=${clean ? 'yes' : 'no'}`,
    `github=${synced ? 'synced' : 'not-synced'}`,
    `last-deploy=${latestTag(project.tagPrefix) || 'none'}`
  ].join(' | '));
}

function assertDeployReady(project) {
  git(['fetch', '--tags', 'origin', 'master']);
  const branch = currentBranch();
  if (branch !== 'master') fail(`Deploy requires master branch. Current: ${branch || '(detached)'}`);
  const dirty = workingTreeStatus();
  if (dirty) fail('Deploy requires a clean working tree.\n' + dirty);
  const remoteHead = upstreamHead(branch);
  if (!remoteHead) fail(`origin/${branch} was not found. Run git fetch/push first.`);
  if (remoteHead !== currentHead()) fail(`HEAD is not equal to origin/${branch}. Push GitHub first.`);
  projectConfig(project);
  buildVersion(project);
}

function pushProject(project) {
  clasp(project, ['push', '-f'], 'push');
  console.log(`[OK] ${project.label} development code synced.`);
}

function deployProject(project) {
  assertDeployReady(project);
  const config = projectConfig(project);
  const version = buildVersion(project);
  const description = [
    descriptionArg || version,
    `git:${shortHead()}`
  ].join(' | ');

  clasp(project, ['push', '-f'], 'predeploy-push');
  const output = clasp(
    project,
    ['deploy', '-i', config.deploymentId, '-d', description],
    'deploy'
  );
  const versionMatch = output.match(/@(\d+)\b/);
  if (!versionMatch) {
    fail('Deploy succeeded but GAS version could not be parsed. Check .local/logs before tagging manually.');
  }
  const gasVersion = versionMatch[1];
  const tag = project.tagPrefix + gasVersion;
  if (gitText(['tag', '--list', tag])) fail(`Tag already exists: ${tag}`);
  git(['tag', '-a', tag, '-m', `${project.label} deployed: ${version} | git:${shortHead()}`]);
  git(['push', 'origin', tag]);
  console.log(`[OK] ${project.label} deployed and tagged: ${tag}`);
}

const selected = target === 'all'
  ? [PROJECTS.data, PROJECTS.dashboard]
  : [PROJECTS[target]];

try {
  if (action === 'status') selected.forEach(printStatus);
  if (action === 'push') selected.forEach(pushProject);
  if (action === 'deploy') deployProject(selected[0]);
} catch (error) {
  fail(error && error.message ? error.message : String(error));
}
