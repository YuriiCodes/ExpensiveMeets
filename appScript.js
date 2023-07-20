function updateCalendarEvents() {
    // Open the spreadsheet using its ID
    var spreadsheet = SpreadsheetApp.openById('1wWFSIBsSSTaO08DZBEkceBUNaFMcHS85xES8NdJHQgE');

    // Select the sheet and get its data
    var sheet = spreadsheet.getSheets()[0]; // adjust if your data is in another sheet
    var range = sheet.getDataRange();
    var values = range.getValues();

    // Transform the sheet data into a JavaScript object for easier lookup
    var hourlyRates = {};
    for (var i = 0; i < values.length; i++) {
        var email = values[i][0];
        var rate = values[i][1];
        hourlyRates[email] = rate;
    }

    // Get the calendar and its events
    var calendar = CalendarApp.getDefaultCalendar(); // adjust if you're not using the default calendar
    var now = new Date();
    var events = calendar.getEvents(now, new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))); // adjust the period

    // Prepare the regex to remove old cost estimates
    var costRegex = /\n(💰 )?Estimated Meeting Cost is \$\d+/g;

    // Iterate over the events
    for (var j = 0; j < events.length; j++) {
        var event = events[j];

        // Calculate the event cost
        var attendees = event.getGuestList().map(function(guest) { return guest.getEmail(); });
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

        // Add new cost estimate
        description += "\n💰 Estimated Meeting Cost is $" + cost;

        event.setDescription(description);
    }
}
