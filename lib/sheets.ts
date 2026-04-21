import { google } from 'googleapis';

// Google Sheets API scopes
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Cache for read operations
const cache = new Map<string, { data: string[][], timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Helper to initialize the Google Auth client using service account credentials.
 */
function getAuthToken() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // Replace literal \n with actual newlines in case it's escaped in environment variables
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });
}

/**
 * Helper with retry logic (max 3 retries)
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error('Unreachable');
}

/**
 * Appends a single row of values to a specified range (tab) in the Google Sheet.
 * @param range The name of the tab/range (e.g., 'egg-farm', 'admin-log')
 * @param values Array of values representing a single row
 */
export async function appendRow(range: string, values: unknown[]) {
  try {
    const auth = getAuthToken();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await withRetry(() => sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    }));

    return response.data;
  } catch (error) {
    console.error(`Failed to append row to ${range}:`, error);
    throw error;
  }
}

/**
 * Prepends a single row of values to a specified range (tab) in the Google Sheet at row 2.
 * @param range The name of the tab/range (e.g., 'egg-farm', 'admin-log')
 * @param values Array of values representing a single row
 */
export async function prependRow(range: string, values: unknown[]) {
  try {
    const auth = getAuthToken();
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Get sheet ID for the specified range (tab name)
    const spreadsheet = await withRetry(() => sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    }));
    
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === range
    );
    
    if (!sheet || sheet.properties?.sheetId === undefined) {
      throw new Error(`Sheet ${range} not found or has no ID`);
    }

    const sheetId = sheet.properties.sheetId;

    // 2. Insert a blank row at index 1 (which is row 2)
    await withRetry(() => sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: 2,
              },
              inheritFromBefore: false,
            },
          },
        ],
      },
    }));

    // 3. Insert the data into the new blank row 2
    const response = await withRetry(() => sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${range}!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    }));

    return response.data;
  } catch (error) {
    console.error(`Failed to prepend row to ${range}:`, error);
    throw error;
  }
}

/**
 * Retrieves all rows from a specified range (tab) in the Google Sheet.
 * @param range The name of the tab/range
 * @param bypassCache Whether to ignore the existing cache and fetch fresh data
 * @returns An array of string arrays, each representing a row
 */
export async function getRows(range: string, bypassCache: boolean = false): Promise<string[][]> {
  if (!bypassCache) {
    const cached = cache.get(range);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  try {
    const auth = getAuthToken();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await withRetry(() => sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range,
    }));

    const data = response.data.values || [];
    cache.set(range, { data, timestamp: Date.now() });
    
    return data as string[][];
  } catch (error) {
    console.error(`Failed to get rows from ${range}:`, error);
    throw error;
  }
}
/**
 * Updates a single cell in the Google Sheet.
 * @param range The name of the tab/range
 * @param rowIndex The 1-indexed row number
 * @param colIndex The 1-indexed column number (1=A, 2=B, 3=C, etc.)
 * @param value The new value for the cell
 */
export async function updateCell(range: string, rowIndex: number, colIndex: number, value: unknown) {
  try {
    const auth = getAuthToken();
    const sheets = google.sheets({ version: 'v4', auth });

    // Convert colIndex to letter (1 -> A, 2 -> B, etc.)
    const colLetter = String.fromCharCode(64 + colIndex);
    const cellRange = `${range}!${colLetter}${rowIndex}`;

    await withRetry(() => sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: cellRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    }));
  } catch (error) {
    console.error(`Failed to update cell in ${range}:`, error);
    throw error;
  }
}
