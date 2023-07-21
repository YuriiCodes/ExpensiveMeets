function doGet(e) {
    updateCalendarEvents();
    return ContentService.createTextOutput("Calendar events updated.");
}


function initializeScriptProperties() {
    var scriptProperties = PropertiesService.getScriptProperties();

    if (scriptProperties.getProperty("NUM_OF_DAYS_AHEAD_TO_SET_COSTS") === null) {
        scriptProperties.setProperty('NUM_OF_DAYS_AHEAD_TO_SET_COSTS', 7);
    }

    if (scriptProperties.getProperty("NDA_MODE") === null) {
        scriptProperties.setProperty('NDA_MODE', true);
    }

    // DLA is a Data Access Layer, an API endpoint to get sensitive salary data that only service accoutn will have access to.
    if (scriptProperties.getProperty("DLA_URL") === null) {
        scriptProperties.setProperty('DLA_URL', "https://script.googleusercontent.com/a/macros/eliftech.com/echo?user_content_key=zCt7iDqfbOkoEfwHnxiePWiKCwx672NO57aP87gZSIwt8DvmAvnBdxMknQce-zh2lGtVijT2hz4qB89TvXu4w-1t_fcWKaV1OJmA1Yb3SEsKFZqtv3DaNYcMrmhZHmUMi80zadyHLKAx1hRXfeQWguOcN9X0s3gf68n4RAo2RJzdqWTPudKTQJKZjhasKpf0mCWX6brihSg86EDWLLWSYr7oow8T4WVauMWKU_O_LRqle1XBe2SmNYRbpTSy5GHEHh5BECxgFUvc_ScPTHfLrg&lib=MBy1XISyfOLgif5qWH7pJYS0HurfB97W1");
    }
}


function mapCostToNDASymbol(cost, threshold) {
    // if cost is less than first th, then return 1
    if (cost < threshold["$"]) {
        return "$"
    }
    // if cost is less than 1000, then return 2
    if (cost < threshold["$$"]) {
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

function getSensitiveData() {
    var dlaUrl = PropertiesService.getScriptProperties().getProperty("DLA_URL")
    var response = UrlFetchApp.fetch(dlaUrl);
    var data = JSON.parse(response.getContentText());
    return data;
}


function updateCalendarEvents() {
    initializeScriptProperties()
    var numOfDays = PropertiesService.getScriptProperties().getProperty("NUM_OF_DAYS_AHEAD_TO_SET_COSTS");
    var NDAMode = PropertiesService.getScriptProperties().getProperty("NDA_MODE");



    var data = getSensitiveData()



    // Transform the sheet data into a JavaScript object for easier lookup
    var hourlyRates = data.rates;
    var threshold = data.threshold



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
