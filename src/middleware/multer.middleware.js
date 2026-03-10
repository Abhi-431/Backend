import multer from "multer"
//read it 

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,"/public/temp")
    },
    filename:function(req,file,cb){
       
        cb(null,file.originalname)//update
    }
})
export const upload=multer({
    storage,
})