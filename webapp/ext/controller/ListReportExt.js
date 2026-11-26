sap.ui.define([
  "sap/ui/core/Fragment",
  "sap/ui/core/Component",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Fragment, Component, JSONModel, MessageToast, MessageBox) {
  "use strict";

  
  // bound actions "Activate" and "Discard"
  const NS = "com.sap.gateway.srvd.zic_travel_req_sd.v0001";
  const ACTIVATE = NS + ".Activate(...)";
  const DISCARD = NS + ".Discard(...)";

  let pDialog;
  let oDraftCtx = null; // the draft created by the first Create click

  // Runs a bound action; invoke() exists from UI5 1.123, execute() before
  function runAction(oModel, sAction, oCtx) {
    const oAction = oModel.bindContext(sAction, oCtx);
    return oAction.invoke ? oAction.invoke() : oAction.execute();
  }

  // Discards the draft left behind by a failed attempt
  async function discardDraft(oModel) {
    if (!oDraftCtx) {
      return;
    }
    try {
      await runAction(oModel, DISCARD, oDraftCtx);
    } catch (e) {
      console.error("Discard failed", e); // shows the real reason
    }
    oDraftCtx = null;
  }

  function getODataModel() {
    const oComponent = Component.registry.filter(function (c) {
      return c.getManifestEntry("sap.app").id === "travelrequest";
    })[0];
    return oComponent.getModel();
  }

  const handler = {

    // Called by the "Create Request" button on the list
    openCreate: async function () {
      const oODataModel = getODataModel();

      if (!pDialog) {
        pDialog = Fragment.load({
          name: "travelrequest.ext.fragment.CreateDialog",
          controller: handler
        }).then(function (oDialog) {
          oDialog.setModel(oODataModel); // default model for /Employee and /Destination
          return oDialog;
        });
      }

      const oDialog = await pDialog;
      await discardDraft(oODataModel); // clear any leftover from a previous attempt

      oDialog.setModel(new JSONModel({
        EmpId: "",
        DestinationId: "",
        TravelType: "",
        StartDate: null,
        EndDate: null,
        EstimatedCost: "0",
        Currency: ""
      }), "create");

      oDialog.open();
    },

    onCreateCancel: async function () {
      const oDialog = await pDialog;
      oDialog.setBusy(true);
      await discardDraft(oDialog.getModel());
      oDialog.setBusy(false);
      oDialog.close();
    },

    onCreateConfirm: async function () {
      const oDialog = await pDialog;
      const oData = oDialog.getModel("create").getData();
      const oModel = oDialog.getModel();

      if (!oData.EmpId || !oData.DestinationId || !oData.StartDate || !oData.EndDate) {
        MessageBox.error("Please fill in all mandatory fields.");
        return;
      }

      const mValues = {
        EmpId: oData.EmpId,
        DestinationId: oData.DestinationId,
        TravelType: oData.TravelType,
        StartDate: oData.StartDate,
        EndDate: oData.EndDate,
        EstimatedCost: String(oData.EstimatedCost || "0"),
        Currency: oData.Currency
      };

      oDialog.setBusy(true);
      try {
        if (!oDraftCtx) {
          // First attempt: create the draft
          const oList = oModel.bindList("/TravelRequest");
          const oCtx = oList.create(mValues);
          await oCtx.created();
          oDraftCtx = oCtx;
        } else {
          // Retry: update the SAME draft with the corrected values
          for (const sKey of Object.keys(mValues)) {
            await oDraftCtx.setProperty(sKey, mValues[sKey]);
          }
        }

        // Activate the draft so it becomes a real record
        await runAction(oModel, ACTIVATE, oDraftCtx);

        oDraftCtx = null; // activated, nothing left to clean up
        oDialog.close();
        MessageToast.show("Travel request created");
        oModel.refresh();
      } catch (oError) {
        // The draft is kept on purpose, so the retry updates it
        MessageBox.error(oError.message || "Creation failed");
      } finally {
        oDialog.setBusy(false);
      }
    },

        // Called by the custom "Submit" button on the list
    submitSelected: async function (oBindingContext, aSelectedContexts) {
      const aContexts = aSelectedContexts || [];
      if (!aContexts.length) {
        MessageBox.warning("Please select a request to submit.");
        return;
      }

      const oModel = getODataModel();
      const aDone = [];
      const aFailed = [];

      for (const oCtx of aContexts) {
        const sId = oCtx.getProperty("TravelId");
        const sStatus = oCtx.getProperty("Status");

        // Only New (N) or empty status can be submitted
        if (sStatus && sStatus !== "N") {
          aFailed.push(sId + ": only requests in status New can be submitted");
          continue;
        }

        try {
          await runAction(oModel, NS + ".submitRequest(...)", oCtx);
          aDone.push(sId);
        } catch (oError) {
          aFailed.push(sId + ": " + (oError.message || "failed"));
        }
      }

      oModel.refresh();

      if (aFailed.length) {
        MessageBox.error(aFailed.join("\n"));
      }
      if (aDone.length) {
        MessageBox.success(
          "Travel request " + aDone.join(", ") + " submitted successfully.",
          { title: "Submitted", actions: [MessageBox.Action.OK] }
        );
      }
    }
  };

  return handler;
});