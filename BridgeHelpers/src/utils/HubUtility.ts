/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { GuidString } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
import { HubIModel, IModelHubClient, IModelQuery } from "@bentley/imodelhub-client";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { BriefcaseDb, FunctionalModel, Element } from "@bentley/imodeljs-backend";

/** Utility to work with iModelHub */
export class HubUtility {

  public static logCategory = "HubUtility";

  private static async queryProjectByName(requestContext: AuthorizedClientRequestContext, projectName: string): Promise<Project | undefined> {
    const client = new ContextRegistryClient();
    const projects = await client.getProjects(requestContext, {
      $select: "*",
      $filter: `Name+eq+'${projectName}'`,
    });
    if (projects.length > 0)
      return projects[0];
    return undefined;
  }

  public static async queryIModelByName(requestContext: AuthorizedClientRequestContext, projectId: string, iModelName: string): Promise<HubIModel | undefined> {
    const client = new IModelHubClient();
    const iModels = await client.iModels.get(requestContext, projectId, new IModelQuery().byName(iModelName));
    if (iModels.length === 0)
      return undefined;
    if (iModels.length > 1)
      throw new Error(`Too many iModels with name ${iModelName} found`);
    return iModels[0];
  }

  /**
   * Queries the project id by its name
   * @param requestContext The client request context
   * @param projectName Name of project
   * @throws If the project is not found, or there is more than one project with the supplied name
   */
  public static async queryProjectIdByName(requestContext: AuthorizedClientRequestContext, projectName: string): Promise<string> {
    const project: Project | undefined = await HubUtility.queryProjectByName(requestContext, projectName);
    if (!project)
      throw new Error(`Project ${projectName} not found`);
    return project.wsgId;
  }

  /**
   * Queries the iModel id by its name
   * @param requestContext The client request context
   * @param projectId Id of the project
   * @param iModelName Name of the iModel
   * @throws If the iModel is not found, or if there is more than one iModel with the supplied name
   */
  public static async queryIModelIdByName(requestContext: AuthorizedClientRequestContext, projectId: string, iModelName: string): Promise<GuidString> {
    const iModel: HubIModel | undefined = await HubUtility.queryIModelByName(requestContext, projectId, iModelName);
    if (!iModel || !iModel.id)
      throw new Error(`IModel ${iModelName} not found`);
    return iModel.id;
  }

  /** Delete an IModel from the hub
   * @internal
   */
  public static async deleteIModel(requestContext: AuthorizedClientRequestContext, projectName: string, iModelName: string): Promise<void> {
    const projectId: string = await HubUtility.queryProjectIdByName(requestContext, projectName);
    const iModelId: GuidString = await HubUtility.queryIModelIdByName(requestContext, projectId, iModelName);
    const client = new IModelHubClient();
    await client.iModels.delete(requestContext, projectId, iModelId);
  }

   /**
   * Creates an empty functional model
   * @param targetDb target iModel
   * @param targetSubjectId target subject 
   * @param modelName functional model name
   * @throws If the iModel or subject id or model name is invalid.
   */

  public static async CreateEmptyFunctionalModel(targetDb: BriefcaseDb, targetSubjectId: string, modelName:string) : Promise<Element>{
   
    if(targetDb===undefined ||targetDb===null ){
        throw new Error('Invalid imodel');
    }

    else if(targetSubjectId===undefined ||targetSubjectId===null || targetSubjectId.length===0){
        throw new Error('Invalid subject id');
    }

    else if(modelName===undefined ||modelName===null || modelName.length===0){
        throw new Error('Invalid model name');
    }

    try {
        const targetFunctionalModelId=  FunctionalModel.insert(targetDb, targetSubjectId, modelName);
        const functionalModel = targetDb.elements.getElement(targetFunctionalModelId);
        functionalModel.federationGuid = "";
        functionalModel.update();

        return functionalModel;

    }

    catch(error){
        console.log(error);
        return undefined;
    }
}

  /**
   * Pushes changes to iModel hub
   * @param authContext The client request context
   * @param targetDb imodel to be pushed
   * @param message commit message
   * @throws If the iModel or auth context or commit messaage is invalid.
   */

  public static async PushChanges(authContext : AuthorizedClientRequestContext, targetDb: BriefcaseDb, message: string) : Promise<boolean>{
    if(targetDb===undefined ||targetDb===null ){
        throw new Error('Invalid imodel');
    }

    else if(authContext===undefined ||authContext===null ){
        throw new Error('Invalid authorization context');
    }

    else if(message===undefined || message===null || message.length===0){
        throw new Error('Please provide a valid commit message');
    }

    try{
        await targetDb.concurrencyControl.request(authContext);
        authContext.enter();

        await targetDb.saveChanges();
        await targetDb.pullAndMergeChanges(authContext);
        await targetDb.pushChanges(authContext, message);
        authContext.enter();
        return true;
    }

    catch(error){
        console.log(error);
        return false;
    }
}

}
