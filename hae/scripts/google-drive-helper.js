/**
 * Google Drive Helper - Fetches Diet Tracker data from Google Sheets API
 *
 * Uses service account credentials to access Google Sheets
 * No external googleapis library needed - uses native fetch
 *
 * Usage:
 *   const helper = new GoogleDriveHelper(accessToken);
 *   const csvData = await helper.fetchDietTrackerCSV(spreadsheetId, sheetName);
 */

class GoogleDriveHelper {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.sheetsApi = 'https://sheets.googleapis.com/v4/spreadsheets';
  }

  /**
   * Get access token from service account
   * See: https://developers.google.com/identity/protocols/oauth2/service-account
   */
  static async getAccessTokenFromServiceAccount(serviceAccountJson) {
    const jwt = this.createJWT(serviceAccountJson);
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Fetch Diet Tracker sheet as markdown table format
   */
  async fetchDietTrackerCSV(spreadsheetId, sheetName = '今日') {
    const range = encodeURIComponent(`${sheetName}!A:G`);
    const url = `${this.sheetsApi}/${spreadsheetId}/values/${range}?key=${this.accessToken}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length === 0) {
      return '';
    }

    // Convert to markdown table format
    const headers = rows[0];
    const lines = ['| ' + headers.join(' | ') + ' |'];
    lines.push('|' + headers.map(() => '---').join('|') + '|');

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      lines.push('| ' + row.padEnd(headers.length, '').join(' | ') + ' |');
    }

    return lines.join('\n');
  }

  /**
   * Fetch workout data from Workouts sheet
   */
  async fetchWorkoutData(spreadsheetId, date, sheetName = '锻炼') {
    const range = encodeURIComponent(`${sheetName}!A:F`);
    const url = `${this.sheetsApi}/${spreadsheetId}/values/${range}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Find row matching the date
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === date) {
        return {
          date: rows[i][0],
          type: rows[i][1] || '',
          duration: parseInt(rows[i][2]) || 0,
          activeEnergy: parseInt(rows[i][3]) || 0,
          maxHR: parseInt(rows[i][4]) || 0,
        };
      }
    }

    return null;
  }

  /**
   * Helper to create JWT for service account auth
   * (simplified - for production use proper JWT library)
   */
  static createJWT(serviceAccountJson) {
    throw new Error(
      'JWT creation not implemented. Use Google Sheets API with API key instead, ' +
      'or implement proper JWT creation with a library like jsonwebtoken.'
    );
  }
}

module.exports = GoogleDriveHelper;
