/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { spawn, exec, execSync } = require('child_process');
const http = require('http');
const os = require('os');
const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configs
const PUBLIC_PORT = 3000;
const INTERNAL_PORT = 3001;
const PKG_NEXT_CURRENT = '16.2.6';
const PKG_REACT_CURRENT = '19.2.4';

let nextProcess = null;
let proxyServer = null;
let isRestartingNext = false;
let isDevMode = false;
let tunnelProcess = null;
let tunnelUrl = '';
let isTunnelActive = false;

// Dashboard State
let activeTab = 0; // 0: LOG, 1: ERRORES, 2: CONFIG, 3: ACTUALIZACIONES
let sysInfo = {
  cpu: 0,
  ramTotal: os.totalmem(),
  ramFree: os.freemem(),
  processRam: 0,
  uptime: 0
};
let network = {
  downSpeed: 0,
  upSpeed: 0,
  totalDown: 0,
  totalUp: 0
};
let bytesWindow = {
  down: 0,
  up: 0
};

// Logs lists
const logs = [];
const errors = [];
let settingsJson = {};
let updates = {
  nextLatest: null,
  reactLatest: null,
  loading: true
};

// Keypress handling state
let isRawModeSet = false;

// 1. HTTP Reverse Proxy to Intercept Bytes and Log Requests
function startProxy() {
  proxyServer = http.createServer((req, res) => {
    let reqBytes = 0;
    let resBytes = 0;
    const startTime = Date.now();

    // Restrict administrative panel remote access
    const hostHeader = req.headers.host || '';
    const isLocal = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1');
    const isAdminPath = req.url.startsWith('/admin') || req.url.startsWith('/api/settings');

    if (isAdminPath && !isLocal) {
      res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>ACCESO DENEGADO (403)</title>
  <style>
    body {
      background: #02041e;
      color: #ffd54f;
      font-family: monospace, sans-serif;
      text-align: center;
      padding: 10% 5%;
      margin: 0;
    }
    .container {
      border: 3px solid #e53e3e;
      background: #0c0f30;
      padding: 2.5rem;
      border-radius: 8px;
      display: inline-block;
      box-shadow: 0 0 25px rgba(229, 62, 62, 0.4);
      max-width: 600px;
    }
    h1 {
      color: #e53e3e;
      font-size: 2.2rem;
      margin-top: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    p {
      color: #cbd5e0;
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .warning-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    .retro-badge {
      display: inline-block;
      background: #e53e3e;
      color: #fff;
      font-weight: bold;
      padding: 0.3rem 0.8rem;
      border-radius: 4px;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="warning-icon">🚨</div>
    <h1>Alerta de Seguridad</h1>
    <p>Lo sentimos. No tienes acceso a esta sección de forma remota.</p>
    <p style="color: #ffd54f; font-weight: bold; font-size: 1.4rem; margin: 1.5rem 0; text-transform: uppercase;">
      "NO TIENES ACCESO, NO ERES RAXITO"
    </p>
    <p style="font-size: 0.9rem; color: #a0aec0;">
      Para administrar la configuración de WEA-ther, accede localmente desde el servidor de origen.
    </p>
    <div class="retro-badge">ERROR 403: FORBIDDEN</div>
  </div>
</body>
</html>`);
      return;
    }

    // Track request payload size (Download speed)
    req.on('data', (chunk) => {
      reqBytes += chunk.length;
      bytesWindow.down += chunk.length;
    });

    const options = {
      hostname: '127.0.0.1',
      port: INTERNAL_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);

      proxyRes.on('data', (chunk) => {
        resBytes += chunk.length;
        bytesWindow.up += chunk.length;
      });

      proxyRes.on('end', () => {
        const duration = Date.now() - startTime;
        
        // Skip log noise for constant API polling
        const isTelemetry = req.url.includes('/api/system-info');
        
        if (!isTelemetry) {
          const sizeKb = (resBytes / 1024).toFixed(1);
          const logLine = `${new Date().toLocaleTimeString()} ${req.method} ${req.url} - ${proxyRes.statusCode} (${duration}ms) - ${sizeKb} KB`;
          logs.push(logLine);
          if (logs.length > 200) logs.shift();
        }
        
        network.totalDown += reqBytes;
        network.totalUp += resBytes;
      });

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      const errLine = `${new Date().toLocaleTimeString()} Proxy Error: ${err.message}`;
      errors.push(errLine);
      if (errors.length > 200) errors.shift();

      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Servidor de fondo iniciando o inalcanzable (502 Bad Gateway)');
    });

    req.pipe(proxyReq);
  });

  proxyServer.on('upgrade', (req, socket, head) => {
    const net = require('net');
    
    // Restrict administrative websocket access remotely
    const hostHeader = req.headers.host || '';
    const isLocal = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1');
    const isAdminPath = req.url.startsWith('/admin') || req.url.startsWith('/api/settings');

    if (isAdminPath && !isLocal) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    const client = net.connect(INTERNAL_PORT, '127.0.0.1', () => {
      // Reconstruct the HTTP upgrade request headers
      let reqStr = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          value.forEach(v => {
            reqStr += `${key}: ${v}\r\n`;
          });
        } else {
          reqStr += `${key}: ${value}\r\n`;
        }
      }
      reqStr += '\r\n';
      
      client.write(reqStr);
      if (head && head.length > 0) {
        client.write(head);
      }
      
      // Pipe client and server sockets bidirectionally
      socket.pipe(client);
      client.pipe(socket);
    });

    client.on('error', () => {
      socket.destroy();
    });

    socket.on('error', () => {
      client.destroy();
    });
  });

  proxyServer.listen(PUBLIC_PORT, () => {
    // Proxy listening
  });
}

// 2. Fetch Latest Versions from NPM Registry
function checkUpdates() {
  const getLatest = (pkgName) => {
    return new Promise((resolve) => {
      https.get(`https://registry.npmjs.org/${pkgName}/latest`, {
        headers: { 'User-Agent': 'wea-ther-supervisor' }
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data.version || null);
          } catch(e) {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  };

  Promise.all([getLatest('next'), getLatest('react')])
    .then(([nextVer, reactVer]) => {
      updates.nextLatest = nextVer;
      updates.reactLatest = reactVer;
      updates.loading = false;
    })
    .catch(() => {
      updates.loading = false;
    });
}

// 3. Monitor CPU, System RAM and Child Process RAM
function runMonitoring() {
  // Update Network Speeds every second
  setInterval(() => {
    network.downSpeed = bytesWindow.down;
    network.upSpeed = bytesWindow.up;
    bytesWindow.down = 0;
    bytesWindow.up = 0;
  }, 1000);

  // Update System / Process CPU and Memory every 2 seconds
  setInterval(() => {
    sysInfo.ramFree = os.freemem();
    sysInfo.uptime = process.uptime();

    // Calculate CPU usage (OS)
    const cpusStart = os.cpus();
    setTimeout(() => {
      const cpusEnd = os.cpus();
      if (!cpusStart || !cpusEnd || cpusStart.length === 0) return;
      let totalDiff = 0;
      let idleDiff = 0;
      for (let i = 0; i < cpusStart.length; i++) {
        const start = cpusStart[i]?.times;
        const end = cpusEnd[i]?.times;
        if (!end || !start) continue;
        const startTotal = (start.user || 0) + (start.nice || 0) + (start.sys || 0) + (start.idle || 0) + (start.irq || 0);
        const endTotal = (end.user || 0) + (end.nice || 0) + (end.sys || 0) + (end.idle || 0) + (end.irq || 0);
        totalDiff += (endTotal - startTotal);
        idleDiff += ((end.idle || 0) - (start.idle || 0));
      }
      sysInfo.cpu = totalDiff === 0 ? 0 : Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
    }, 100);

    // Query Child Process memory usage using tasklist (Windows) or ps (UNIX)
    if (nextProcess && nextProcess.pid) {
      const pid = nextProcess.pid;
      if (process.platform === 'win32') {
        exec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, (err, stdout) => {
          if (!err && stdout) {
            const parts = stdout.split(',');
            if (parts.length >= 5) {
              const memStr = parts[4].replace(/"/g, '').replace(/ K/g, '').replace(/,/g, '').trim();
              const parsed = parseInt(memStr);
              if (!isNaN(parsed)) {
                sysInfo.processRam = Math.round(parsed / 1024); // Convert KB to MB
              }
            }
          }
        });
      } else {
        exec(`ps -p ${pid} -o rss=`, (err, stdout) => {
          if (!err && stdout) {
            const parsed = parseInt(stdout.trim());
            if (!isNaN(parsed)) {
              sysInfo.processRam = Math.round(parsed / 1024); // Convert KB to MB
            }
          }
        });
      }
    }

    // Refresh Configuration settings.json content
    try {
      const configPath = path.join(__dirname, '..', 'settings.json');
      const data = fs.readFileSync(configPath, 'utf8');
      settingsJson = JSON.parse(data);
    } catch (e) {}
  }, 2000);
}

// Helper to fit a string (including ANSI codes) to a given visible width
function fitToWidth(str, width) {
  let visibleLen = 0;
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str[i] === '\x1b' && str[i + 1] === '[') {
      // Find the end of escape sequence 'm'
      const start = i;
      i += 2;
      while (i < str.length && str[i] !== 'm') {
        i++;
      }
      i++; // include 'm'
      result += str.slice(start, i);
    } else {
      if (visibleLen < width) {
        result += str[i];
        visibleLen++;
      }
      i++;
    }
  }
  if (visibleLen < width) {
    result += ' '.repeat(width - visibleLen);
  }
  return result;
}

// 4. GUI Rendering via ANSI Terminal Escape Codes
function drawDashboard() {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;

  let buffer = '';

  // Clear screen and Move Cursor to 1,1
  buffer += '\x1b[H';

  // AZUL: Titulo del Programa
  const tunnelInfo = isTunnelActive && tunnelUrl ? ` [Túnel: ${tunnelUrl}]` : '';
  const title = ` --- WEA-ther LIVE SUPERVISOR DASHBOARD (Puerto: ${PUBLIC_PORT})${tunnelInfo} --- `;
  const paddedTitle = title.padStart((cols + title.length) / 2, ' ').padEnd(cols, ' ');
  buffer += `\x1b[44m\x1b[37m\x1b[1m${paddedTitle}\x1b[0m\n`;

  // ROSADO: Sección de Telemetría
  const cpuProgress = Math.round((sysInfo.cpu / 100) * 15);
  const cpuBar = `[${'|||||||||||||||'.slice(0, cpuProgress).padEnd(15, ' ')}]`;
  const ramTotal = sysInfo.ramTotal || 1; // Avoid division by zero
  const usedRamGB = (Math.max(0, sysInfo.ramTotal - sysInfo.ramFree) / (1024 * 1024 * 1024)).toFixed(1);
  const totalRamGB = (sysInfo.ramTotal / (1024 * 1024 * 1024)).toFixed(1);
  const ramPercent = Math.max(0, Math.min(100, Math.round((Math.max(0, sysInfo.ramTotal - sysInfo.ramFree) / ramTotal) * 100)));
  const ramProgress = Math.round((ramPercent / 100) * 15);
  const ramBar = `[${'|||||||||||||||'.slice(0, ramProgress).padEnd(15, ' ')}]`;

  const downKb = (network.downSpeed / 1024).toFixed(1);
  const upKb = (network.upSpeed / 1024).toFixed(1);
  const totalDownMb = (network.totalDown / (1024 * 1024)).toFixed(1);
  const totalUpMb = (network.totalUp / (1024 * 1024)).toFixed(1);

  // Versions Updates available text
  let nextUpdateText = '';
  if (!updates.loading && updates.nextLatest && updates.nextLatest !== PKG_NEXT_CURRENT) {
    nextUpdateText = `\x1b[33m(Update: v${updates.nextLatest})\x1b[35m`;
  }
  let reactUpdateText = '';
  if (!updates.loading && updates.reactLatest && updates.reactLatest !== PKG_REACT_CURRENT) {
    reactUpdateText = `\x1b[33m(Update: v${updates.reactLatest})\x1b[35m`;
  }

  // Draw metrics
  buffer += `\x1b[45m\x1b[37m`;
  
  // Line 1
  const line1Left = ` CPU: ${cpuBar} ${sysInfo.cpu}% (Sistema) | RSS: ${sysInfo.processRam} MB (Proceso)`;
  const line1Right = `Next.js: v${PKG_NEXT_CURRENT} ${nextUpdateText}`;
  const clean1LeftLen = line1Left.replace(/\x1b\[[0-9;]*m/g, '').length;
  const clean1RightLen = line1Right.replace(/\x1b\[[0-9;]*m/g, '').length;
  const gap1 = Math.max(1, cols - (clean1LeftLen + clean1RightLen));
  buffer += `${line1Left}${' '.repeat(gap1)}${line1Right}\n`;

  // Line 2
  const line2Left = ` RAM: ${ramBar} ${usedRamGB}G/${totalRamGB}G (${ramPercent}%)`;
  const line2Right = `React:   v${PKG_REACT_CURRENT} ${reactUpdateText}`;
  const clean2LeftLen = line2Left.replace(/\x1b\[[0-9;]*m/g, '').length;
  const clean2RightLen = line2Right.replace(/\x1b\[[0-9;]*m/g, '').length;
  const gap2 = Math.max(1, cols - (clean2LeftLen + clean2RightLen));
  buffer += `${line2Left}${' '.repeat(gap2)}${line2Right}\n`;

  // Line 3
  const line3Left = ` RED: Down: ${downKb} KB/s (${totalDownMb}M) | Up: ${upKb} KB/s (${totalUpMb}M)`;
  const line3Right = `Uptime:  ${Math.floor(sysInfo.uptime / 3600)}h ${Math.floor((sysInfo.uptime % 3600) / 60)}m ${Math.floor(sysInfo.uptime % 60)}s`;
  const clean3LeftLen = line3Left.replace(/\x1b\[[0-9;]*m/g, '').length;
  const clean3RightLen = line3Right.replace(/\x1b\[[0-9;]*m/g, '').length;
  const gap3 = Math.max(1, cols - (clean3LeftLen + clean3RightLen));
  buffer += `${line3Left}${' '.repeat(gap3)}${line3Right}\n`;

  buffer += `\x1b[0m`;

  // AMARILLO & NARANJO: Layout horizontal (Sidebar + Panel Principal)
  const sidebarWidth = 20;
  const mainWidth = Math.max(10, cols - sidebarWidth - 1);
  const contentHeight = Math.max(1, rows - 6); // header (1) + telemetry (3) + footer (2)

  const tabs = ['LOG', 'ERRORES', 'CONFIG. INTERFAZ', 'ACTUALIZACIONES'];

  for (let r = 0; r < contentHeight; r++) {
    // 1. Draw Sidebar item (Amarillo)
    let sidebarLine = '';
    const tabIdx = r;
    if (tabIdx < tabs.length) {
      const isSelected = activeTab === tabIdx;
      const text = tabs[tabIdx].padEnd(sidebarWidth - 4, ' ');
      if (isSelected) {
        sidebarLine = `\x1b[43m\x1b[30m\x1b[1m > ${text} \x1b[0m`;
      } else {
        sidebarLine = `\x1b[33m   ${text} \x1b[0m`;
      }
    } else {
      sidebarLine = ' '.repeat(sidebarWidth);
    }

    // Divider
    const divider = '\x1b[33m|\x1b[0m';

    // 2. Draw Main content line (Naranjo)
    let mainLine = '';
    if (activeTab === 0) {
      // LOGS
      const logOffset = logs.length - contentHeight + r;
      if (logOffset >= 0 && logOffset < logs.length) {
        mainLine = logs[logOffset];
      }
    } else if (activeTab === 1) {
      // ERRORES
      const errOffset = errors.length - contentHeight + r;
      if (errOffset >= 0 && errOffset < errors.length) {
        mainLine = `\x1b[31m${errors[errOffset]}\x1b[0m`;
      } else if (r === 0 && errors.length === 0) {
        mainLine = ' No se registran excepciones ni errores en el servidor.';
      }
    } else if (activeTab === 2) {
      // CONFIG. INTERFAZ
      const configItems = [];
      if (settingsJson.mainCity) {
        configItems.push(`Ciudad Activa:     ${settingsJson.mainCity.name}, ${settingsJson.mainCity.country}`);
        configItems.push(`Sistema Unidades:  ${settingsJson.unitSystem || 'metric'}`);
        configItems.push(`Duración Slide:    ${settingsJson.slideDuration || 12} segundos`);
        configItems.push(`Volumen Música:    ${Math.round((settingsJson.musicVolume || 0.5) * 100)}%`);
        configItems.push(`Música Activa:     ${settingsJson.musicEnabled ? 'Habilitada' : 'Deshabilitada'}`);
        configItems.push(`Locutor por Voz:   ${settingsJson.voiceoverEnabled ? 'Habilitado' : 'Deshabilitado'}`);
        configItems.push(`Marquee Inferior:  ${settingsJson.marqueeText ? settingsJson.marqueeText.slice(0, 50) + '...' : 'Ninguno'}`);
        configItems.push(`Stream TV Activo:  ${settingsJson.tvStreamUrl || 'Ninguno'}`);
        configItems.push(`Formato Reloj:     ${settingsJson.clockFormat || '24h'}`);
      }
      if (r < configItems.length) {
        mainLine = `\x1b[36m${configItems[r]}\x1b[0m`;
      }
    } else if (activeTab === 3) {
      // ACTUALIZACIONES
      const updateLines = [];
      if (updates.loading) {
        updateLines.push(' Consultando registro NPM en segundo plano...');
      } else {
        updateLines.push(' === ESTADO DE ACTUALIZACIONES ===');
        updateLines.push('');
        
        // Next
        const nextDiff = updates.nextLatest !== PKG_NEXT_CURRENT;
        updateLines.push(`  * Framework Next.js:`);
        updateLines.push(`    - Instalado: v${PKG_NEXT_CURRENT}`);
        updateLines.push(`    - Disponible: v${updates.nextLatest || 'Desconocido'}`);
        updateLines.push(`    - Estado: ${nextDiff ? '\x1b[33m¡Actualización Recomendada!\x1b[0m' : '\x1b[32mAl día\x1b[0m'}`);
        updateLines.push('');

        // React
        const reactDiff = updates.reactLatest !== PKG_REACT_CURRENT;
        updateLines.push(`  * Librería React:`);
        updateLines.push(`    - Instalado: v${PKG_REACT_CURRENT}`);
        updateLines.push(`    - Disponible: v${updates.reactLatest || 'Desconocido'}`);
        updateLines.push(`    - Estado: ${reactDiff ? '\x1b[33m¡Actualización Recomendada!\x1b[0m' : '\x1b[32mAl día\x1b[0m'}`);
      }
      if (r < updateLines.length) {
        mainLine = `${updateLines[r]}`;
      }
    }

    const mainPadded = fitToWidth(mainLine, mainWidth);

    buffer += `${sidebarLine}${divider}${mainPadded}\n`;
  }

  // Footer / Teclas Calientes
  const footerHelp = ' [↑/↓] Navegar Pestañas | [r] Recargar | [s] Reiniciar Server | [t] Alternar Túnel | [F10/q] Apagar';
  buffer += `\x1b[47m\x1b[30m${footerHelp.padEnd(cols, ' ')}\x1b[0m`;

  process.stdout.write(buffer);
}

// 5. Clean teardown logic
let isShuttingDown = false;
function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (isRawModeSet) {
    try {
      process.stdin.setRawMode(false);
    } catch(e) {}
  }
  
  console.clear();
  console.log('Apagando proxy de telemetría...');
  if (proxyServer) {
    try {
      proxyServer.close();
    } catch(e) {}
  }

  if (nextProcess) {
    console.log('Finalizando servidor Next.js de fondo...');
    try {
      if (process.platform === 'win32') {
        // Force kill next process tree on Windows synchronously
        try {
          execSync(`taskkill /pid ${nextProcess.pid} /t /f`, { stdio: 'ignore' });
        } catch (e) {}
      } else {
        nextProcess.kill('SIGINT');
      }
    } catch (e) {
      console.error('Error al terminar Next.js process:', e);
    }
  }

  if (tunnelProcess) {
    console.log('Finalizando túnel temporal localtunnel...');
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${tunnelProcess.pid} /t /f`, { stdio: 'ignore' });
      } else {
        tunnelProcess.kill('SIGINT');
      }
    } catch (e) {}
  }
  
  setTimeout(() => {
    console.log('Supervisor finalizado correctamente. ¡Adiós!');
    process.exit(exitCode);
  }, 1000);
}

// Helper to launch the child process instance of Next.js
function startNextProcess() {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['next', isDevMode ? 'dev' : 'start', '-p', String(INTERNAL_PORT), '-H', '127.0.0.1'];

  nextProcess = spawn(cmd, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true
  });

  // Capture stdout
  nextProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      // Skip telemetry request spam from stdout logs to save CPU and readability
      if (trimmed.includes('/api/system-info')) return;
      const logLine = `[Next.js] ${trimmed}`;
      logs.push(logLine);
      if (logs.length > 200) logs.shift();
      if (!process.stdout.isTTY) {
        console.log(logLine);
      }
    });
  });

  // Capture stderr
  nextProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const errLine = `[Next.js Error] ${trimmed}`;
      errors.push(errLine);
      if (errors.length > 200) errors.shift();
      if (!process.stdout.isTTY) {
        console.error(errLine);
      }
    });
  });

  nextProcess.on('exit', (code) => {
    if (isRestartingNext) {
      const restartMsg = `${new Date().toLocaleTimeString()} [Supervisor] Servidor Next.js apagado para reinicio.`;
      logs.push(restartMsg);
      if (logs.length > 200) logs.shift();
      drawDashboard();
      return;
    }

    const exitMsg = `Servidor de Next.js finalizó (código: ${code})`;
    errors.push(exitMsg);
    if (!process.stdout.isTTY) {
      console.error(exitMsg);
    }
    // Auto-restart or shutdown supervisor
    setTimeout(() => {
      shutdown(code);
    }, 1500);
  });
}

// Function to trigger a clean and safe server restart
function triggerServerRestart() {
  if (isRestartingNext) return;
  isRestartingNext = true;

  const restartLog = `${new Date().toLocaleTimeString()} [Supervisor] REINICIANDO SERVIDOR (Modo: ${isDevMode ? 'Desarrollo' : 'Producción'})...`;
  logs.push(restartLog);
  if (logs.length > 200) logs.shift();
  drawDashboard();

  // Kill existing child process tree safely
  if (nextProcess) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${nextProcess.pid} /t /f`, { stdio: 'ignore' });
      } else {
        nextProcess.kill('SIGINT');
      }
    } catch (e) {
      console.error('Error al finalizar Next.js para reinicio:', e);
    }
  }

  // Grace period to release port and clean handles
  setTimeout(() => {
    if (!isDevMode) {
      // Production Mode: rebuild before restarting to apply code changes
      const buildLog = `${new Date().toLocaleTimeString()} [Supervisor] Compilando en modo producción (Next.js build)...`;
      logs.push(buildLog);
      if (logs.length > 200) logs.shift();
      drawDashboard();

      const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const build = spawn(cmd, ['run', 'build'], { stdio: 'ignore', shell: true });
      
      build.on('exit', (code) => {
        if (code === 0) {
          const buildOkLog = `${new Date().toLocaleTimeString()} [Supervisor] Compilación exitosa. Lanzando servidor...`;
          logs.push(buildOkLog);
          if (logs.length > 200) logs.shift();
          isRestartingNext = false;
          startNextProcess();
          drawDashboard();
        } else {
          const buildFailLog = `${new Date().toLocaleTimeString()} [Supervisor] La compilación falló (código: ${code}). Servidor no iniciado.`;
          errors.push(buildFailLog);
          if (errors.length > 200) errors.shift();
          isRestartingNext = false;
          drawDashboard();
        }
      });
    } else {
      // Development Mode: just launch next dev process directly
      const startLog = `${new Date().toLocaleTimeString()} [Supervisor] Iniciando servidor de desarrollo...`;
      logs.push(startLog);
      if (logs.length > 200) logs.shift();
      isRestartingNext = false;
      startNextProcess();
      drawDashboard();
    }
  }, 1200);
}

// Start temporary localtunnel connection
function startTunnel() {
  if (tunnelProcess) return;

  tunnelUrl = 'Conectando túnel...';
  drawDashboard();

  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  // Launch npx -y localtunnel --port 3000
  tunnelProcess = spawn(cmd, ['-y', 'localtunnel', '--port', String(PUBLIC_PORT)], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  tunnelProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    const urlMatch = output.match(/your url is:\s*(https:\/\/\S+)/i);
    if (urlMatch) {
      tunnelUrl = urlMatch[1];
      isTunnelActive = true;

      const logLine = `${new Date().toLocaleTimeString()} [Supervisor] Túnel activado: ${tunnelUrl}`;
      logs.push(logLine);
      if (logs.length > 200) logs.shift();
      drawDashboard();
    }
  });

  tunnelProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    // Redirect non-critical npm warning/install messages to general logs instead of error log
    if (text.toLowerCase().includes('npm warn') || text.toLowerCase().includes('npm warn exec') || text.toLowerCase().includes('install')) {
      const logLine = `${new Date().toLocaleTimeString()} [Tunnel Debug] ${text}`;
      logs.push(logLine);
      if (logs.length > 200) logs.shift();
    } else {
      const errLine = `${new Date().toLocaleTimeString()} [Tunnel Error] ${text}`;
      errors.push(errLine);
      if (errors.length > 200) errors.shift();
    }
    drawDashboard();
  });

  tunnelProcess.on('exit', (code) => {
    tunnelProcess = null;
    tunnelUrl = '';
    isTunnelActive = false;
    const logLine = `${new Date().toLocaleTimeString()} [Supervisor] Túnel cerrado (código: ${code})`;
    logs.push(logLine);
    if (logs.length > 200) logs.shift();
    drawDashboard();
  });
}

// Stop active localtunnel connection
function stopTunnel() {
  if (!tunnelProcess) return;

  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${tunnelProcess.pid} /t /f`, { stdio: 'ignore' });
    } catch (e) {}
  } else {
    tunnelProcess.kill('SIGINT');
  }

  tunnelProcess = null;
  tunnelUrl = '';
  isTunnelActive = false;

  const logLine = `${new Date().toLocaleTimeString()} [Supervisor] Túnel desactivado.`;
  logs.push(logLine);
  if (logs.length > 200) logs.shift();
  drawDashboard();
}

// Toggle tunnel connection state
function toggleTunnel() {
  if (isTunnelActive || tunnelProcess) {
    stopTunnel();
  } else {
    startTunnel();
  }
}

// 6. Spawn and capture Next.js Child Process
function launchNextServer(isDev) {
  isDevMode = isDev;
  console.clear();
  if (process.stdout.isTTY) {
    console.log(`\x1b[36mIniciando Servidor Next.js en puerto interno ${INTERNAL_PORT}...\x1b[0m`);
  } else {
    console.log(`Iniciando Servidor Next.js en puerto interno ${INTERNAL_PORT}...`);
  }
  
  startNextProcess();

  // Start Proxy and Dashboard Rendering loop
  startProxy();
  checkUpdates();
  runMonitoring();

  // Setup raw terminal keypress listeners
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(true);
      isRawModeSet = true;
      process.stdin.resume();
    } catch (e) {}
  }

  process.stdin.on('keypress', (str, key) => {
    if (!key) return;
    if (key.ctrl && key.name === 'c') {
      shutdown();
      return;
    }

    if (key.name === 'f10' || key.name === 'q') {
      shutdown();
      return;
    }

    if (key.name === 'up') {
      activeTab = activeTab === 0 ? 3 : activeTab - 1;
      drawDashboard();
    } else if (key.name === 'down') {
      activeTab = activeTab === 3 ? 0 : activeTab + 1;
      drawDashboard();
    } else if (key.name === 'r') {
      // Manual refresh
      checkUpdates();
      drawDashboard();
    } else if (key.name === 's') {
      // Server restart
      triggerServerRestart();
    } else if (key.name === 't') {
      // Toggle tunnel
      toggleTunnel();
    }
  });

  // Hide cursor in TTY
  if (process.stdout.isTTY) {
    process.stdout.write('\x1b[?25l');
  }

  // Redraw loop (every 1 second)
  setInterval(() => {
    if (process.stdout.isTTY) {
      drawDashboard();
    }
  }, 1000);

  // Restore cursor on exit
  process.on('exit', () => {
    if (process.stdout.isTTY) {
      process.stdout.write('\x1b[?25h');
    }
  });

  // Handle uncaught signals
  process.on('SIGINT', () => shutdown());
  process.on('SIGTERM', () => shutdown());
  process.on('SIGBREAK', () => shutdown());
  process.on('SIGHUP', () => shutdown());

  process.on('uncaughtException', (err) => {
    const errLine = `[Supervisor Exception] ${err.stack || err.message}`;
    errors.push(errLine);
    if (!process.stdout.isTTY) {
      console.error(errLine);
    }
    shutdown(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    const errLine = `[Supervisor Rejection] ${reason}`;
    errors.push(errLine);
    if (!process.stdout.isTTY) {
      console.error(errLine);
    }
    shutdown(1);
  });
}

// 7. Interactive Bootstrapping Select Screen
function startBootstrap() {
  let rl = null;
  let onKeypress = null;
  let timer = null;
  let secondsLeft = 10;
  let hasSelected = false;

  const runProductionBuild = () => {
    cleanupBootstrap();
    if (process.stdout.isTTY) {
      console.log('\n\x1b[33mCompilando servidor en modo producción (Next.js build)... Por favor espere...\x1b[0m');
    } else {
      console.log('\nCompilando servidor en modo producción (Next.js build)... Por favor espere...');
    }
    const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const build = spawn(cmd, ['run', 'build'], { stdio: 'inherit', shell: true });
    build.on('exit', (code) => {
      if (code === 0) {
        if (process.stdout.isTTY) {
          console.log('\x1b[32mCompilación exitosa.\x1b[0m');
        } else {
          console.log('Compilación exitosa.');
        }
        launchNextServer(false);
      } else {
        if (process.stdout.isTTY) {
          console.error(`\x1b[31mCompilación falló con código ${code}.\x1b[0m`);
        } else {
          console.error(`Compilación falló con código ${code}.`);
        }
        process.exit(code);
      }
    });
  };

  const cleanupBootstrap = () => {
    if (onKeypress) {
      try {
        process.stdin.removeListener('keypress', onKeypress);
      } catch (e) {}
    }
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(false);
      } catch (e) {}
    }
    if (rl) {
      try {
        rl.close();
      } catch (e) {}
    }
  };

  if (!process.stdin.isTTY) {
    console.log('Entrada no interactiva detectada. Iniciando Modo de Producción por defecto...');
    runProductionBuild();
    return;
  }

  console.clear();
  console.log('\x1b[1m\x1b[36m=== CONFIGURACIÓN DE INICIO DE SERVIDOR (WEA-ther) ===\x1b[0m\n');
  console.log('Seleccione el modo de ejecución:');
  console.log(' [\x1b[32m1\x1b[0m] Modo de Desarrollo (next dev)');
  console.log(' [\x1b[32m2\x1b[0m] Modo de Producción (next build & next start) - \x1b[1mRECOMENDADO\x1b[0m\n');

  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Write interactive prompt line
  const updatePrompt = () => {
    if (hasSelected) return;
    readline.cursorTo(process.stdout, 0, 7);
    readline.clearLine(process.stdout, 0);
    process.stdout.write(`Presione [1] o [2]. Selección automática en ${secondsLeft} segundos: \x1b[1mModo de Producción\x1b[0m`);
  };

  updatePrompt();

  timer = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(timer);
      if (!hasSelected) {
        hasSelected = true;
        console.log('\n\nIniciando en Modo de Producción por expiración de tiempo...');
        runProductionBuild();
      }
    } else {
      updatePrompt();
    }
  }, 1000);

  // Read raw inputs
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {}
  }

  onKeypress = (str, key) => {
    if (hasSelected) return;
    if (!key) return;

    if (key.ctrl && key.name === 'c') {
      if (timer) clearInterval(timer);
      process.exit(0);
    }

    if (str === '1') {
      hasSelected = true;
      if (timer) clearInterval(timer);
      cleanupBootstrap();
      console.log('\n\nSeleccionado: Modo de Desarrollo.');
      launchNextServer(true);
    } else if (str === '2') {
      hasSelected = true;
      if (timer) clearInterval(timer);
      cleanupBootstrap();
      console.log('\n\nSeleccionado: Modo de Producción.');
      runProductionBuild();
    }
  };

  process.stdin.on('keypress', onKeypress);
}

startBootstrap();
