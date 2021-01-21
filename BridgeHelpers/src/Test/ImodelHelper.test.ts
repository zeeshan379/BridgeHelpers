import {ImodelHelper} from '../IModelHelper';
import { assert, expect } from "chai";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { TestUsers, TestUtility } from "@bentley/oidc-signin-tool";
import { IModelHost, BriefcaseDb, BriefcaseManager, ConcurrencyControl } from '@bentley/imodeljs-backend';
import { BriefcaseProps, SyncMode, IModel  } from "@bentley/imodeljs-common";
import {HubUtility} from "../utils/HubUtility";


describe("Bridge Helpers: Imodel Helper Tests", () => {
    let requestContext: AuthorizedClientRequestContext;
    const dotenv = require('dotenv').config();
    let testProjectId :string; 
    let provisionedImodelId :string; 
    let provisionedImodel: BriefcaseDb;
    let emptyFunctionalModelName    = "TestFunctionalModel";
    let newFunctionalModelName      = "TestCreateFunctionalModel";
    let targetFunctionalModelId: string;
    before(async () => {
       
        try{
            await IModelHost.startup();
            requestContext = await TestUtility.getAuthorizedClientRequestContext(TestUsers.regular);
        }
        catch (error) {
            throw new Error(error);
        }

        try {
            testProjectId = await HubUtility.queryProjectIdByName(requestContext, process.env.imjs_test_project_name);

            provisionedImodelId = await HubUtility.queryIModelIdByName(requestContext, testProjectId, process.env.imjs_test_provisioned_imodel_name);
           
            // download iModel
            const briefcaseProps: BriefcaseProps = await BriefcaseManager.download(
                requestContext,
                testProjectId,
                provisionedImodelId,
                {syncMode: SyncMode.PullAndPush});

            requestContext.enter();
 
            provisionedImodel = await BriefcaseDb.open(requestContext, briefcaseProps.key, { openAsReadOnly: false });
            provisionedImodel.concurrencyControl.setPolicy(new ConcurrencyControl.PessimisticPolicy());

            //Create an empty functional model that will be used for all the tests
            emptyFunctionalModelName = emptyFunctionalModelName + "_" + new Date().toLocaleString().slice(0, -2).replace(',', '_').replace(/\s/g, "");
            const targetFunctionalModel = await HubUtility.CreateEmptyFunctionalModel(provisionedImodel, IModel.rootSubjectId, emptyFunctionalModelName);
            expect(undefined !== targetFunctionalModel);
            targetFunctionalModelId = targetFunctionalModel.id;
          

            expect(undefined !== provisionedImodel);
        } 

        catch (error) {
            throw new Error(error);
        }
        
    });

    it("Should create a functional model", async () => {

        newFunctionalModelName = newFunctionalModelName + "_" + new Date().toLocaleString().slice(0, -2).replace(',', '_').replace(/\s/g, "");
        const functionalModel = await ImodelHelper.CreateFunctionalModel(provisionedImodel, IModel.rootSubjectId, newFunctionalModelName);
        assert.isTrue(await HubUtility.PushChanges(requestContext, provisionedImodel, "Created a new functional model"));
        assert.isTrue(functionalModel !== undefined);
        assert.isTrue(provisionedImodel.models.getModel(functionalModel.id).isPrivate);
        assert.isTrue(ImodelHelper.JsonPropertiesExist(provisionedImodel, newFunctionalModelName));
        const functionalModel2 = await ImodelHelper.CreateFunctionalModel(provisionedImodel,"SomeId", newFunctionalModelName);
        assert.isTrue(functionalModel2 === undefined);
       
    });


    it("Should set private property of functional model", async () => {

        assert.isTrue(await ImodelHelper.SetPrivateProperty(provisionedImodel, targetFunctionalModelId));
        assert.isFalse(await ImodelHelper.SetPrivateProperty(provisionedImodel, "SomeId"));
        assert.isTrue(await HubUtility.PushChanges(requestContext, provisionedImodel, "Setting private property"));
        assert.isTrue(provisionedImodel.models.getModel(targetFunctionalModelId).isPrivate);
    });


    it("Should set json properties of functional model", async () => {

        assert.isTrue(await ImodelHelper.SetJsonProperties(provisionedImodel, targetFunctionalModelId));
        assert.isFalse(await ImodelHelper.SetPrivateProperty(provisionedImodel, "SomeId"));
        assert.isTrue(await HubUtility.PushChanges(requestContext, provisionedImodel, "Setting json properties"));
        assert.isTrue(ImodelHelper.JsonPropertiesExist(provisionedImodel, emptyFunctionalModelName));
    });

    after(async () => {
        provisionedImodel.close();
        await IModelHost.shutdown();
      });

});