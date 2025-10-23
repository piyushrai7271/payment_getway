import express from "express";
import {
    registerUser,
    loginUser,
    changePassword,
    refreshToken,
    updateUserDetails,
    getUserDetails,
    logOut
} from "../controllers/userAuth.controller.js";
const router = express.Router();

router.post("/registerUser",registerUser);
router.post("/login",loginUser);
router.post("/chnage-password",changePassword);
router.post("/refresh-token",refreshToken);
router.put("updateUser-details",updateUserDetails);
router.get("/getUserDetails",getUserDetails);
router.post("/logOut",logOut);


export default router;