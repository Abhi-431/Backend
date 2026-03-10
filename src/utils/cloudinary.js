import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";//by default come with nodejs all file system mange by this 



    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
    });
    const uploadONCloudinary = async (localFilePath)=>{
        try {
            if(!localFilePath)return null
           const response=await cloudinary.uploader.upload( localFilePath,
            {
               resource_type:"auto"
            }
       )
       //File has been uploaded successfully 
       console.log("file is uploded on cloudinary ", response.url)
       return response;
        } catch(error) {
            fs.unlinkSync(localFilePath)//remove the localy saved temp file as the upload operattion got failed 
           return null;
       }
    }
        
       
    
export {uploadONCloudinary}