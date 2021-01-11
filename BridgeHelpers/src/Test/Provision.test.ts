import {ProvisionHelper} from '../ProvisionHelper';
import { assert, expect } from "chai";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { TestUsers, TestUtility } from "@bentley/oidc-signin-tool";
import { IModelDb, IModelHost, BriefcaseDb, BriefcaseManager } from '@bentley/imodeljs-backend';
import { BriefcaseProps, SyncMode } from "@bentley/imodeljs-common";
import {HubUtility} from "../utils/HubUtility";

describe("Bridge Helpers: Provision Tests", () => {
    let requestContext: AuthorizedClientRequestContext;
    const dotenv = require('dotenv').config();
    let testProjectId :string; 
    let provisionedImodelId :string; 
    let emptyImodelId :string; 
    let provisionedImodel: IModelDb;
    let emptyImodel: IModelDb;

    before(async () => {

        try{
            await IModelHost.startup();
        }
        catch (error) {
            console.log(error);
        }

        try {
            requestContext = await TestUtility.getAuthorizedClientRequestContext(TestUsers.regular);
        } 
        catch (error) {
              console.log(error);
        }
        
        try {
            testProjectId =await HubUtility.queryProjectIdByName(requestContext, process.env.imjs_test_project_name);

            provisionedImodelId = await HubUtility.queryIModelIdByName(requestContext, testProjectId, process.env.imjs_test_provisioned_imodel_name);
           
            emptyImodelId = await HubUtility.queryIModelIdByName(requestContext, testProjectId, process.env.imjs_test_empty_imodel_name);

            // download provisioned iModel
            const briefcaseProps: BriefcaseProps = await BriefcaseManager.download(
                requestContext,
                testProjectId,
                provisionedImodelId,
                {syncMode: SyncMode.PullAndPush});

            requestContext.enter();
 
            provisionedImodel = await BriefcaseDb.open(requestContext, briefcaseProps.key);

            // download empty iModel
            const briefcaseProps2: BriefcaseProps = await BriefcaseManager.download(
                requestContext,
                testProjectId,
                emptyImodelId,
                {syncMode: SyncMode.PullAndPush});

            requestContext.enter();
 
            emptyImodel = await BriefcaseDb.open(requestContext, briefcaseProps2.key);

            expect(undefined !== provisionedImodel && undefined !== emptyImodel);
        } 

        catch (error) {
            console.log(error);
        }
        
    });

    it("Should check if imodel is provisioned or not", async () => {

        assert.isTrue(ProvisionHelper.isIModelProvisioned(provisionedImodel));
        assert.isFalse(ProvisionHelper.isIModelProvisioned(emptyImodel));

    });

    it("Should check if a specific schema class exists or not", async () => {

        assert.isTrue(ProvisionHelper.schemaClassExists(provisionedImodel, "ProcessFunctional:NAMED_ITEM"));
        assert.isFalse(ProvisionHelper.schemaClassExists(emptyImodel, "ProcessFunctional:NAMED_ITEM"));

    });

    after(async () => {
        await IModelHost.shutdown();
      });

});