const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let appUrl = 'http://10.0.2.2:3000'; // Fallback default URL

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/APP_URL\s*=\s*(.+)/);
  if (match && match[1]) {
    appUrl = match[1].trim().replace(/['"]/g, '');
  }
}

const configContent = `// Automatically generated from .env file. Do not edit directly.
export const APP_URL = '${appUrl}';
`;

fs.writeFileSync(path.join(__dirname, 'config.ts'), configContent, 'utf8');
console.log(`[Env Loader] Successfully set APP_URL to: ${appUrl}`);
