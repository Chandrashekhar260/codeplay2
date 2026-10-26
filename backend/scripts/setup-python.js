const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reqPath = path.join(rootDir, 'requirements.txt');
const venvDir = path.join(rootDir, '.venv');

if (!fs.existsSync(reqPath)) {
  console.log('[Setup Python] No requirements.txt found, skipping.');
  process.exit(0);
}

// Find Python executable
function getPythonBinary() {
  const candidates = process.platform === 'win32'
    ? ['python', 'py', 'python3']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    const res = spawnSync(cmd, ['--version'], { encoding: 'utf-8' });
    if (res.status === 0) {
      return cmd;
    }
  }
  return null;
}

const pythonBin = getPythonBinary();

if (!pythonBin) {
  console.log('[Setup Python] Python binary not found in PATH. Scanner will run in zero-dependency stdlib mode.');
  process.exit(0);
}

console.log(`[Setup Python] Detected Python: ${pythonBin}`);

let installed = false;

// Attempt 1: Try creating / using a virtual environment (.venv)
try {
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(venvDir, 'Scripts', 'python.exe')
    : path.join(venvDir, 'bin', 'python');
  const venvPip = isWin
    ? path.join(venvDir, 'Scripts', 'pip.exe')
    : path.join(venvDir, 'bin', 'pip');

  if (!fs.existsSync(venvPython)) {
    console.log('[Setup Python] Creating virtual environment at .venv...');
    execSync(`"${pythonBin}" -m venv "${venvDir}"`, { stdio: 'inherit' });
  }

  if (fs.existsSync(venvPip)) {
    console.log('[Setup Python] Installing requirements into .venv...');
    execSync(`"${venvPip}" install -r "${reqPath}" --quiet`, { stdio: 'inherit' });
    installed = true;
    console.log('[Setup Python] Successfully installed dependencies in .venv.');
  }
} catch (err) {
  console.warn('[Setup Python] Virtual environment setup had an issue, trying system-level fallback with --break-system-packages...');
}

// Attempt 2: If venv failed, try direct pip with PIP_BREAK_SYSTEM_PACKAGES
if (!installed) {
  try {
    const pipCmd = `${pythonBin} -m pip install --break-system-packages -r "${reqPath}" --quiet`;
    execSync(pipCmd, {
      stdio: 'inherit',
      env: { ...process.env, PIP_BREAK_SYSTEM_PACKAGES: '1' }
    });
    installed = true;
    console.log('[Setup Python] Successfully installed dependencies via --break-system-packages.');
  } catch (err) {
    try {
      // Older pip without --break-system-packages flag
      const pipCmdLegacy = `${pythonBin} -m pip install -r "${reqPath}" --quiet`;
      execSync(pipCmdLegacy, {
        stdio: 'inherit',
        env: { ...process.env, PIP_BREAK_SYSTEM_PACKAGES: '1' }
      });
      installed = true;
      console.log('[Setup Python] Successfully installed dependencies via legacy pip.');
    } catch (fallbackErr) {
      console.warn('[Setup Python] Note: Python package install skipped or failed. Scanner will run in zero-dependency stdlib mode.');
    }
  }
}
