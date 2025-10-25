import UserAuth from "../models/userAuth.model.js";
import jwt from "jsonwebtoken";

const verifyJwt = async (req, res, next) => {
  try {
    //take token from cookies or Authorize header
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization")?.replace("Bearer ", "");

    // console.log(req.cookies);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Unothorized access",
      });
    }
    //decode token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    //with decoded token find user id
    const user = await UserAuth.findById(decodedToken?._id).select("-password -refreshToken");
    if (!user) {
      return res.status(402).json({
        success: false,
        message: "User is not matching in auth ..",
      });
    }
    // now add user in req oblect

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid access token",
    });
  }
};

export { verifyJwt };
