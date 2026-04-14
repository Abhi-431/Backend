import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";//by default come with nodejs all file system mange by this 



    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
    });
    const uploadONCloudinary = async (localFilePath)=>{
        console.log(localFilePath)
        try {
            if(!localFilePath)return null;
           const response=await cloudinary.uploader.upload( localFilePath,
            {
               resource_type:'auto'
            }
       )
       //File has been uploaded successfully 
       fs.unlinkSync(localFilePath);
       console.log("file is uploded on cloudinary ", response.url)
       return response;
        } catch(error) {
            fs.unlinkSync(localFilePath)//remove the localy saved temp file as the upload operattion got failed 
           return null;
       }
    }
    const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        //delete file from cloudinary
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
    } catch (error) {
        return error;
        console.log("delete on cloudinary failed", error);
    }
};
        
       
    
export {uploadONCloudinary,deleteOnCloudinary}