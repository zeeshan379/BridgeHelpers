import { IModelDb } from '@bentley/imodeljs-backend';
import { SchemaUtility } from "./utils/SchemaUtility";
export class ProvisionHelper{

    public static isIModelProvisioned(imodel:IModelDb): boolean{
        if(imodel===null || imodel===undefined){
            throw new Error("Invalid iModel");
        }

        const funcSchema = SchemaUtility.LocateSchema(imodel,"ProcessFunctional");
        const phySchema = SchemaUtility.LocateSchema(imodel,"ProcessPhysical");
       
        return funcSchema && phySchema;
    }

    public static schemaClassExists(imodel:IModelDb, classFullName:string) : boolean {
        if(imodel===null || imodel===undefined){
            throw new Error("Invalid iModel");
        }

        if(classFullName===null || classFullName===undefined || classFullName.length===0 || !classFullName.includes(':')){
            throw new Error("Please provide a valid class name (Example-> SomeSchema:SomeSchema)");
        }

        return imodel.containsClass(classFullName);
    }
}