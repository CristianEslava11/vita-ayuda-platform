const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const backend = path.join(root, 'apps/backend/.env');
if (!fs.existsSync(backend)) fs.copyFileSync(path.join(root, 'apps/backend/.env.example'), backend);
let content = fs.readFileSync(backend, 'utf8');
const match = content.match(/^JWT_SECRET=(.*)$/m);
if (!match || !match[1].trim().replace(/^["']|["']$/g, '')) {
  const line = 'JWT_SECRET=' + crypto.randomBytes(32).toString('hex');
  content = match ? content.replace(/^JWT_SECRET=.*$/m, line) : content.trimEnd() + '\n' + line + '\n';
  fs.writeFileSync(backend, content);
}
const frontend = path.join(root, 'apps/frontend/.env.local');
if (!fs.existsSync(frontend)) fs.copyFileSync(path.join(root, 'apps/frontend/.env.example'), frontend);
console.log('Configuración local preparada. Los secretos permanecen en los archivos .env.');
