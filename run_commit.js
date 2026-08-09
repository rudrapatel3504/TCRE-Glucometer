const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoPath = __dirname;
const logFile = path.join(repoPath, 'git_commit_push_log.txt');

fs.writeFileSync(logFile, 'Starting Git sync from repository root...\n', 'utf8');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

function run(cmd) {
  try {
    log(`Running: ${cmd}`);
    const output = execSync(cmd, {
      cwd: repoPath,
      encoding: 'utf8',
      timeout: 30000, // 30 seconds timeout
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
    });
    log(`STDOUT:\n${output}`);
  } catch (error) {
    log(`ERROR: ${error.message}`);
    if (error.stdout) log(`STDOUT:\n${error.stdout}`);
    if (error.stderr) log(`STDERR:\n${error.stderr}`);
  }
}

run('git status');
run('git add vercel.json');
run('git commit -m "Simplify vercel.json configuration"');
run('git push origin main');
log('Done!');
