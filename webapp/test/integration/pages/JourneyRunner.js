sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"travelrequest/test/integration/pages/TravelRequestList",
	"travelrequest/test/integration/pages/TravelRequestObjectPage"
], function (JourneyRunner, TravelRequestList, TravelRequestObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('travelrequest') + '/test/flp.html#app-preview',
        pages: {
			onTheTravelRequestList: TravelRequestList,
			onTheTravelRequestObjectPage: TravelRequestObjectPage
        },
        async: true
    });

    return runner;
});

