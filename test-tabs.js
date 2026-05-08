const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value.replace(/\\n/g, '\n');
    }
  });
}

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuthToken() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
}

async function run() {
  try {
    const auth = getAuthToken();
    const sheets = google.sheets({ version: 'v4', auth });
    console.log('Fetching spreadsheet metadata for:', process.env.GOOGLE_SHEETS_ID);
    const response = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    });
    
    const tabNames = response.data.sheets.map(s => s.properties.title);
    console.log('Available Tabs (Sheets) in your document:', tabNames);
  } catch (error) {
    console.error('Error fetching spreadsheet:', error.message || error);
  }
}

run();
