/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { GuidString } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
import { HubIModel, IModelHubClient, IModelQuery } from "@bentley/imodelhub-client";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";

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

}
