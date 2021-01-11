import { DbResult, Id64, Id64String } from "@bentley/bentleyjs-core";
import { ECSqlStatement, IModelDb, BriefcaseDb } from "@bentley/imodeljs-backend";
export class SchemaUtility {

public static queryResult: boolean;

  public static LocateSchema(dbFind: IModelDb, schemaName: string): boolean {
    try {
        this.queryResult = false;
        const query = `SELECT Name FROM meta.ECSchemaDef where Name='${schemaName}'`;
        dbFind.withPreparedStatement(query, (stmt) => {
          if(DbResult.BE_SQLITE_ROW === stmt.step()){
            const row = stmt.getRow();
            if(row.name==schemaName){
                this.queryResult = true;
            }
          }
          
        });
        return this.queryResult;
    } 
    catch (error) {
        return this.queryResult;;
    }
  }
 
}
