import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async(req,res)=>{
    try {
        
        const {username, email, password} = req.body;
        if(!username|| !password || !email){
            return res.status(401).json({
                message:"Something is missing",
                sucess:false
            })
        }
        const user = await User.findOne({email})

        if(user){
            return res.status(401).json({
                message:"email is already taken",
                sucess:false
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        await User.create({
            username,
            email,
            password: hashedPassword
        })
        return res.status(201).json({
            message:"Account created successfully",
            success:true,
        })
    } catch (error) {
        console.log(error)
    }
}

export const login = async(req,res)=>{
    try {

        const {email, password} = req.body

        if(!email || !password){
            return res.status(401).json({
                message:"something is missing",
                success:false
            })
        }
        let user = await User.findOne({email})
        if(!user){
            return res.status(401).json({
                message:"incorrect email or password",
                success:false
            })
        }

        const isPasswordMatch= await bcrypt.compare(password, user.password)
        if(!isPasswordMatch){
            return res.status(401).json({
                message : "incorrect password",
                success: false
            })
        }

        const token = await jwt.sign({userId: user._id}, process.env.SECRET_KEY, {expiresIn:'1d'})

        user = {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            bio: user.bio,
            followers: user.followers,
            following: user.following,
            posts: user.posts
        }
        return res.cookie('token', token, { httpOnly: true, sameSite: 'strict', maxAge: 1 * 24 * 60 * 60 * 1000 }).json({
            message: `Welcome back ${user.username}`,
            success: true,
            user
        });


    } catch (error) {
        console.log(error)
    }
}

export const logout = async(req,res)=>{
    try {
        
        return res.cookie('token', '', {maxAge:0}).json({
            message:'logout successfully',
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}


export const getProfile= async(req,res)=>{
    try {
        const userId = req.params._id
        let user = await User.findById(userId).select('-password')
        return res.status(200).json({
            user,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}

export const editProfile = async(req,res)=>{
    try {

        const userId = req.id
        const {bio,gender} = req.body
        const profilePicture = req.file
        let cloudResponse

        if(profilePicture){
            const fileUri = getDataUri(profilePicture)
            cloudResponse = await cloudinary.uploader.upload(fileUri)
        }

        const user = await User.findById(userId).select('-password')
        if(!user){
            return res.status(404).json({
                message:"user is not found",
                success:false
            })
        }
        if(bio) user.bio = bio
        if(gender) user.gender = gender
        if(profilePicture) user.profilePicture = cloudResponse.secure_url


        await user.save()
        return res.status(200).json({
            message:"profile updated",
            success:true,
            user
        })
        
    } catch (error) {
        console.log(error)
    }
}

export const getSuggestedUsers = async(req,res)=>{
    try {
        const suggestedUsers = await User.find({_id:{$ne:req.id}}).select("-password")
        if(!suggestedUsers){
            return res.status(400).json({
                message:"Currently do not have any users"
            })
        }
        return res.status(200).json({
            success:true,
            users:suggestedUsers
        })
    } catch (error) {
        console.log(error)
    }
}

export const followOrUnfollow = async(req,res)=>{
    try {
        const followedBy = req.id
        const followedTo = req.params.id

        if(followedBy === followedTo){
            return res.status(400).json({
                message:"you can't follow or unfollow yourself",
                success:false
            })
        }

        const user = await User.findById(followedBy)
        const targetuser = await User.findById(followedTo)

        if(!user || !targetuser){
            return res.status(400).json({
                message:"User not found",
                success:false
            })
        }

        const isFollowing = user.following.includes(targetuser)

        if(isFollowing){
            await Promise.all([
                User.updateOne({_id:followedBy}, {$pull:{following:followedTo}}),
                User.updateOne({_id:followedTo},{$pull:{followers:followedBy}})
            ])
            return res.status(200).json({message:"unfollowed successfully", success:true})
        }else{
            await Promise.all([
                User.updateOne({_id:followedBy}, {$push:{following:followedTo}}),
                User.updateOne({_id:followedTo},{$push:{followers:followedBy}})
            ])
            return res.status(200).json({message:"followed successfully", success:true})
        }

    } catch (error) {
        console.log(error)
    }
}