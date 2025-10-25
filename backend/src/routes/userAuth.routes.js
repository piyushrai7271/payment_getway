import express from "express";
import {
    registerUser,
    loginUser,
    changePassword,
    refreshToken,
    getUserDetails,
    logOut
} from "../controllers/userAuth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/registerUser",registerUser);
router.post("/login",loginUser);
router.post("/chnage-password",verifyJwt,changePassword);
router.post("/refresh-token",refreshToken);
router.get("/getUserDetails",verifyJwt,getUserDetails);
router.post("/logOut",verifyJwt,logOut);


export default router;