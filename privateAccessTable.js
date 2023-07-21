function initializeScriptProperties() {
    var scriptProperties = PropertiesService.getScriptProperties();

    // initialize just in the case when it's uninitialized before
    if (scriptProperties.getProperty("SPREADSHEET_ID") === null) {
        scriptProperties.setProperty('SPREADSHEET_ID', '1UR5xoOOQIlx-Ya8CAQ8PiiRGSf8CNCSnWSN_ApVGf3s');
    }
}
function doGet(e) {
    initializeScriptProperties()

    var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheets()[0];
    var range = sheet.getDataRange();
    var values = range.getValues();

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    // Select the sheet and get its data
    var sheet = spreadsheet.getSheets()[0]; // adjust if your data is in another sheet
    var range = sheet.getDataRange();
    var values = range.getValues();

    // Transform the sheet data into a JavaScript object for easier lookup
    var hourlyRates = {};
    for (var i = 1; i < values.length; i++) {
        var email = values[i][0];
        var rate = values[i][1];
        hourlyRates[email] = rate;
    }

    // parse values from Google table, via specific format
    var threshold = {
        "$": values[1][3] || 100,
        "$$": values[1][4] || 1000,
        "$$$": values[1][5] || 10000,
        "$$$$": values[1][6] ||10000,
    }

    var data = {
        rates: hourlyRates,
        threshold: threshold,
    }

    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}
