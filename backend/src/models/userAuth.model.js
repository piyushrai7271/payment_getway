import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const userAuthSchema = new mongoose.Schema(
    {
        fullName:{
            type: String,
            required: true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            trim:true,
        },
        mobileNumber:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:[true,'password is required']
        },
        refreshToken:{
            type:String
        }
    },{ timestamps: true});


userAuthSchema.pre('save', async function (next){
    if(!this.isModified('password')) return next;

    this.password = await bcrypt.hash(this.password, 10);
    next();
}) 

userAuthSchema.methods.isPasswordCorrect = async function (inPassowrd) {
    return await bcrypt.compare(inPassowrd.toString(), this.password);
}

userAuthSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id:this._id,
            fullName:this.fullName,
            email:this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
} 

userAuthSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const UserAuth = mongoose.model("UserAuth", userAuthSchema);
export default UserAuth;