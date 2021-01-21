import { IModelDb, FunctionalModel, BriefcaseDb, Element } from "@bentley/imodeljs-backend";
import { DbResult } from "@bentley/bentleyjs-core";
import {Guid} from './Guid';
export class ImodelHelper{
    public static queryResult: boolean;

    public static async SetJsonProperties(targetDb: BriefcaseDb, targetFunctionalModelId: string) : Promise<boolean> {
        if (targetDb===null || targetDb===undefined){
            throw new Error("Invalid iModel");
        }

        else if(targetFunctionalModelId===undefined ||targetFunctionalModelId===null || targetFunctionalModelId.length===0){
            throw new Error('Invalid functional model id');
        }

        try {
            const partitionProps = targetDb.elements.getElementProps(targetFunctionalModelId);
            const partitionElement = targetDb.elements.getElement(partitionProps);
        
            let jsonProps = { isProvisional : true, version: 1 };
        
            partitionElement.setJsonProperty("PlantSightPartitionDefinition", jsonProps);
            partitionElement.update();

            return true; 
        }

        catch(error){
            return false;
        }
        
      }

    public static async CreateFunctionalModel(targetDb: BriefcaseDb, targetSubjectId: string, modelName:string) : Promise<Element>{
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
            functionalModel.federationGuid = Guid.StringToGuid(modelName + targetDb.name);
            functionalModel.update();

            //Setting json properties
            const result1 = this.SetJsonProperties(targetDb, targetFunctionalModelId);

            //Setting private property
            const result2 = this.SetPrivateProperty(targetDb, targetFunctionalModelId);

            return result1 && result2 ?  functionalModel : undefined;

        }

        catch(error){
            return undefined;
        }
    }

    public static async SetPrivateProperty(targetDb: BriefcaseDb, targetFunctionalModelId: string, isPrivate: boolean = true) : Promise<boolean> {
       if(targetDb===undefined ||targetDb===null ){
            throw new Error('Invalid imodel');
        }

        else if(targetFunctionalModelId===undefined ||targetFunctionalModelId===null || targetFunctionalModelId.length===0){
            throw new Error('Invalid functional model id');
        }

        try{
            const modelProps = targetDb.models.getModelProps(targetFunctionalModelId);
            modelProps.isPrivate = isPrivate;
            targetDb.models.updateModel(modelProps);
            return true; 
        }

        catch(error){
            return false;
        }
      }
    
    public static JsonPropertiesExist(dbFind: IModelDb, functionalModelName: string) : boolean{
        if(dbFind===undefined ||dbFind===null ){
            throw new Error('Invalid imodel');
        }

        else if(functionalModelName===undefined ||functionalModelName===null || functionalModelName.length===0){
            throw new Error('Invalid functional model name');
        }

        try{
            this.queryResult = false;
            const query = `select JsonProperties from func.functionalpartition where CodeValue='${functionalModelName}'`;
            dbFind.withPreparedStatement(query, (stmt) => {
              if(DbResult.BE_SQLITE_ROW === stmt.step()){
                let row = stmt.getRow();
                if(JSON.stringify(row).includes('jsonProperties') && JSON.stringify(row).includes('isProvisional')){
                    this.queryResult = true;
                }
              }
              
            });
            return this.queryResult;
        }
        catch(error){
            return false;
        }
    }

}