import UserAuth from "../models/userAuth.model.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await UserAuth.findById(userId);
    let refreshToken = user.generateRefreshToken();
    let accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (error) {
    throw new Error("Error in fetching access and refresh Token:", error);
  }
};
const registerUser = async (req, res) => {
  try {
    //take input from req.body
    const { fullName, email, mobileNumber, password, confirmPassword } =
      req.body;

    //validate comming input
    if (!fullName || !email || !mobileNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All the fields are required !",
      });
    }

    // validate email, mobileNumber,password formate with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    //Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be 10 digits",
      });
    }

    // 🔐 Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must have at least 8 characters, including uppercase, lowercase, number, and special symbol.",
      });
    }

    //check password and confirmPassword are equal or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "password and confirm password is mismatching",
      });
    }
    // check that email and mobile number are in used already than give error if not than create new user
    const existingUser = await UserAuth.findOne({
      $or: [{ email }, { mobileNumber }],
    }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exist with this email or number",
      });
    }
    // creating user with provided value
    const user = await UserAuth.create({
      fullName,
      email,
      mobileNumber,
      password, // password is already hashed in model with pre hook
    });
    // console.log(`This is what we get from user object : ${user}`);// for learning and testing only

    user.password = undefined;
    user.refreshToken = undefined;

    // console.log(`This is what we get from user object : ${user}`);// for learning and testing only

    // return success response
    return res.status(201).json({
      success: true,
      message: "user created successFully !!",
      data: user,
    });
  } catch (error) {
    console.error("Error in registering user :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server Error in register !!!",
      error: error.message,
    });
  }
};
const loginUser = async (req, res) => {
  try {
    // take credentials from req.body
    const { email, password } = req.body;
    // validate credentials
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "email or password is missing",
      });
    }
    // find user with email
    const user = await UserAuth.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not find with given email",
      });
    }
    // check password is matching with email and user
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password is not correct !!",
      });
    }
    // get refresh and access token
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );
    if (!refreshToken || !accessToken) {
      return res.status(404).json({
        success: false,
        message: "Can not find token with provided user id",
      });
    }

    // await user.save({ validateBeforeSave: false });

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    };

    // remove sensitive fields manually (no extra DB query)
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshToken;

    // return response and also return token in cookies
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "User login successfully !!",
        accessToken,
        data: userObj,
      });
  } catch (error) {
    console.error("Error in login :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const changePassword = async (req, res) => {
  try {
    // take newPassword , confirmPassword, oldPassword from req.body
    const { newPassword, confirmPassword, oldPassword } = req.body;
    // userId from middleware
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user !!",
      });
    }
    // validate comming input
    if (!newPassword || !confirmPassword || !oldPassword) {
      return res.status(404).json({
        success: false,
        message: "please provide all the required feild !!",
      });
    }
    // check newPassword and confirmPassword are equal or not
    if (newPassword !== confirmPassword) {
      return res.status(402).json({
        success: false,
        message: "Please provide same password in confirm and newPass",
      });
    }
    //find user with userId
    const user = await UserAuth.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found with given id",
      });
    }
    //check password is correct or not if not return error
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access !!",
      });
    }
    //save new password to db and return success message
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: "Password changed succefully !!",
    });
  } catch (error) {
    console.error("Error in changing password :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const refreshToken = async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      return res.status(404).json({
        success: false,
        message: "Unauthorize access !!",
      });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken) {
      return res.status(402).json({
        success: false,
        message: "decoded token is not comming",
      });
    }

    const user = await UserAuth.findById(decodedToken._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalide refresh Token",
      });
    }

    if (incomingRefreshToken !== user.refreshToken) {
      return res.status(405).json({
        success: false,
        message: "Refresh Token is expired or used",
      });
    }

    const { accessToken, newRefreshToken } = generateAccessAndRefreshToken(
      user._id
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        success: true,
        message: "refresh token is refreshed ",
        accessToken,
        refreshToken: newRefreshToken,
      });
  } catch (error) {
    console.error("Error in refreshing token :", error);
    return res.status(500).json({
      success: false,
      message: "Internal server Error !!",
    });
  }
};
const getUserDetails = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access !!",
      });
    }

    const user = await UserAuth.findById(userId).lean(); // ⚡ lean for performance
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with given userId",
      });
    }

    // ✅ remove sensitive fields
    delete user.password;
    delete user.refreshToken;

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully !!",
      data: user,
    });
  } catch (error) {
    console.error("Error in getUserDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};
const logOut = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: userId missing !!",
      });
    }

    // ✅ Update refreshToken directly (fast & atomic)
    const user = await UserAuth.findByIdAndUpdate(
      userId,
      { $set: { refreshToken: null } },
      { new: true, lean: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found !!",
      });
    }

    // ✅ Secure cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ensures secure flag only in prod
      sameSite: "strict",
    };

    // ✅ Clear tokens from cookies
    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({
        success: true,
        message: "User logged out successfully !!",
      });
  } catch (error) {
    console.error("Error in logout user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error !!",
    });
  }
};

export {
  registerUser,
  loginUser,
  changePassword,
  refreshToken,
  getUserDetails,
  logOut,
};
