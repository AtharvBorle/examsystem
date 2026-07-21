const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
let appUrl = 'http://10.0.2.2:3000'; // Fallback default URL
let splashScreenVersion = 'old'; // Fallback default version

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/APP_URL\s*=\s*(.+)/);
  if (match && match[1]) {
    appUrl = match[1].trim().replace(/['"]/g, '');
  }
  const splashMatch = envContent.match(/SPLASH_SCREEN_VERSION\s*=\s*(.+)/);
  if (splashMatch && splashMatch[1]) {
    splashScreenVersion = splashMatch[1].trim().replace(/['"]/g, '');
  }
}

const configContent = `// Automatically generated from .env file. Do not edit directly.
export const APP_URL = '${appUrl}';
export const SPLASH_SCREEN_VERSION = '${splashScreenVersion}';
`;

fs.writeFileSync(path.join(__dirname, 'config.ts'), configContent, 'utf8');
console.log(`[Env Loader] Successfully set APP_URL to: ${appUrl}`);
console.log(`[Env Loader] Successfully set SPLASH_SCREEN_VERSION to: ${splashScreenVersion}`);
