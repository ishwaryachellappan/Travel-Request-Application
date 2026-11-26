sap.ui.define([
    "sap/ui/test/opaQunit",
    "./pages/JourneyRunner"
], function (opaTest, runner) {
    "use strict";

    function journey() {
        QUnit.module("First journey");

        opaTest("Start application", function (Given, When, Then) {
            Given.iStartMyApp();

            Then.onTheTravelRequestList.iSeeThisPage();
            Then.onTheTravelRequestList.onFilterBar().iCheckFilterField("Travel ID");
            Then.onTheTravelRequestList.onFilterBar().iCheckFilterField("Employee");
            Then.onTheTravelRequestList.onFilterBar().iCheckFilterField("Destination");
            Then.onTheTravelRequestList.onFilterBar().iCheckFilterField("Travel Type");
            Then.onTheTravelRequestList.onFilterBar().iCheckFilterField("Status");
            Then.onTheTravelRequestList.onTable().iCheckColumns(12, {"TravelId":{"header":"Travel ID"},"DestName":{"header":"Char20"},"EmpName":{"header":"30 Characters"},"EmpId":{"header":"Employee"},"DestinationId":{"header":"Destination"},"Country":{"header":"Country"},"TravelType":{"header":"Travel Type"},"StartDate":{"header":"Start Date"},"EndDate":{"header":"End Date"},"TripDays":{"header":"Days"},"EstimatedCost":{"header":"Estimated Cost"},"Status":{"header":"Status"}});

        });


        opaTest("Navigate to ObjectPage", function (Given, When, Then) {
            // Note: this test will fail if the ListReport page doesn't show any data
            
            When.onTheTravelRequestList.onFilterBar().iExecuteSearch();
            
            Then.onTheTravelRequestList.onTable().iCheckRows();

            When.onTheTravelRequestList.onTable().iPressRow(0);
            Then.onTheTravelRequestObjectPage.iSeeThisPage();

        });

        opaTest("Teardown", function (Given, When, Then) { 
            // Cleanup
            Given.iTearDownMyApp();
        });
    }

    runner.run([journey]);
});