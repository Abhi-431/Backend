import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { upload } from "../middleware/multer.middleware";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller";




const router=Router()
router.use(verifyJWT,upload.none )//Apply verify jwt to all routes
router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;