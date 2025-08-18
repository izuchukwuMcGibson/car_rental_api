const User = require("../models/user.schema");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const saltRounds = 10;


const signup = async (req, res)=> {
    const{name, email, password} = req.body;
    // Validate input
    if(!name || !email || !password){
        return res.status(400).json({message: 'All fields are required'});
    }
    if (password.length < 6) {
        return res.status(400).json({message:'password must be atleast 6 or more charcters'})
    }
    try{
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({message: 'User already exists'});
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds)
          const otp = Math.floor(100000 + Math.random() * 900000).toString();//6-digit otp
        // Create new user
        const newUser = new User({
            name,
            email,
            otpVerified: true,
            otp,
            password: hashedPassword
        });
        await newUser.save();
        return res.status(201).json({message: 'User Created Succesfully', newUser})
    }catch(error){
        console.error('Error creating user:', error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
}

const login = async (req, res)=> {
    const {email, password} = req.body;
    // Validate Inputs
    if(!email || !password){
        return res.status(400).json({message: 'All fields are required'});
    }
    try{
        // Check if user exists
        const user = await User.findOne({ email });
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        // Check password
        const validPassword = bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({message:'invalid credentials!'})
        }
        const token = await jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
        return res.status(200).json({message: 'User Logged In Successfully', user, token })
    }catch(error){
        return res.status(500).json({message: "Internal Server Error", error})
    }
}

const getUsersById = async(req, res) => {
    const { id } = req.params;
    try {
        const specificUser = await User.findById(id);
        return res.status(200).json({message:'this is the user', specificUser})
    } catch(error) {
        return res.status(500).json({message:"Internal Server Error", error})
    }
}

const getUsers = async(req, res) => {
    const allUsers = await User.find();
    if(allUsers) {
        return res.status(200).json({message:'these is the users', allUsers})
    } else {
        return res.status(500).json({message:"Internal Server Error", error})
    }
}

const makeAdmin = async (req, res) => {
  const { id } = req.params;
  console.log( id );
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.isAdmin = true;
    await user.save();
    return res
      .status(200)
      .json({ message: "User promoted to admin successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

module.exports = {
    signup,
    login,
    makeAdmin,
    getUsers,
    getUsersById
}