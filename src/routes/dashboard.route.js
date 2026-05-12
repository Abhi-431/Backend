import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { getChannelStats, getChannelVideos } from "../controllers/dashBoard.controller.js";





const router=Router();
 router.use(verifyJWT)


 router.route("/stats").get(getChannelStats)
 router.route("/video").get(getChannelVideos)

  export default router;