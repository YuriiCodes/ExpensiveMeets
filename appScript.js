function initializeScriptProperties() {
    var scriptProperties = PropertiesService.getScriptProperties();

// initialize just in the case when it's uninitialized before
    if (scriptProperties.getProperty("SPREADSHEET_ID") === null) {
        scriptProperties.setProperty('SPREADSHEET_ID', '1UR5xoOOQIlx-Ya8CAQ8PiiRGSf8CNCSnWSN_ApVGf3s');
    }

    if (scriptProperties.getProperty("NUM_OF_DAYS_AHEAD_TO_SET_COSTS") === null) {
        scriptProperties.setProperty('NUM_OF_DAYS_AHEAD_TO_SET_COSTS', 7);
    }

    if (scriptProperties.getProperty("NDA_MODE") === null) {
        scriptProperties.setProperty('NDA_MODE', true);
    }
}


function mapCostToNDASymbol(cost, threshold) {
    // if cost is less than first th, then return 1
    if (cost < threshold["$"]) {
        return "$"
    }
    // if cost is less than 1000, then return 2
    if (cost < threshold["$$"]) {
        Logger.log(threshold["$$"])
        return "$$"
    }
    // if cost is less than 10000, then return 3
    if (cost < threshold["$$$"]) {
        return "$$$"
    }
    // if cost is less than 100000, then return 4
    if (cost < threshold["$$$$"]) {
        return "$$$$"
    }
}

function updateCalendarEvents() {
    initializeScriptProperties()

    var spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
    var numOfDays = PropertiesService.getScriptProperties().getProperty("NUM_OF_DAYS_AHEAD_TO_SET_COSTS");
    var NDAMode = PropertiesService.getScriptProperties().getProperty("NDA_MODE");
    // Open the spreadsheet using its ID
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

    Logger.log(threshold)

    // Get the calendar and its events
    var calendar = CalendarApp.getDefaultCalendar(); // adjust if you're not using the default calendar
    var now = new Date();
    var events = calendar.getEvents(now, new Date(now.getTime() + (numOfDays * 24 * 60 * 60 * 1000))); // adjust the period

    // Prepare the regex to remove old cost estimates
    var costRegex = /\n(💰 )?Estimated Meeting Cost is \$\d+/g;

    // Iterate over the events
    for (var j = 0; j < events.length; j++) {
        var event = events[j];

        // Calculate the event cost
        var attendees = event.getGuestList().map(function (guest) {
            return guest.getEmail();
        });
        var creators = event.getCreators();
        var allParticipants = attendees.concat(creators);

        var cost = 0;
        for (var k = 0; k < allParticipants.length; k++) {
            var participant = allParticipants[k];
            if (hourlyRates[participant]) {
                cost += hourlyRates[participant];
            }
        }

        // Update the event description
        var description = event.getDescription();

        // Remove old cost estimates
        description = description.replace(costRegex, "");

        // Add new cost estimate based on NDA_MODE
        if (NDAMode) {
            description += "\n💰 Estimated Meeting Cost is " + mapCostToNDASymbol(cost, threshold);
        } else {
            description += "\n💰 Estimated Meeting Cost is $" + cost;
        }

        event.setDescription(description);
    }
}
