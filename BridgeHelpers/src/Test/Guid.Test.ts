import {Guid} from '../Guid';
import { assert } from "chai";

describe("Bridge Helpers: Guid Tests", () => {
    before(async () => {
        
    });

    it("Should generate a GUID for 'Hello World' string", async () => {
        var guid = Guid.StringToGuid('Hello World');
        var expected ="b10a8db1-64e0-7541-05b7-a99be72e3fe5";
        assert.equal(guid.toString(), expected);

    });

    it("Should throw error on null or empty string parameter", async () => {
        try{
           Guid.StringToGuid(null);
        }
        catch(error){
        assert.equal(error.message, "Incorrect parameter. Please provide a valid string.");
        }

        try{
            Guid.StringToGuid("");
         }
         catch(error){
         assert.equal(error.message, "Incorrect parameter. Please provide a valid string.");
         }
    });

    it("Should throw error on undefined parameter", async () => {
            try{
               Guid.StringToGuid(undefined);
            }
            catch(error){
            assert.equal(error.message, "Incorrect parameter. Please provide a valid string.");
            }

    });

    after(async () => {
        
      });

});