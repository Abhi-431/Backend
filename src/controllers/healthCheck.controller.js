import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";



const healthCheck=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,{
        status: "OK",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      },
      "Server is healthy"
    ))
})
export{healthCheck}