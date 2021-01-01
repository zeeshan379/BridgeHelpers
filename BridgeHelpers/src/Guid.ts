export class Guid{

    public static StringToGuid (anyString : string) : any {
    if(anyString === null || anyString === undefined || anyString === ""){
        throw new Error("Incorrect parameter. Please provide a valid string.");
    }

    var crypto = require("crypto");
    const hexToUuid = require('hex-to-uuid');
    var md5 = crypto.createHash("md5");     
    var hexstring = md5.update(Buffer.from(anyString, 'utf-8')).digest('hex');
    return hexToUuid(hexstring);
    }
}