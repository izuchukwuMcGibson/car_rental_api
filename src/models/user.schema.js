const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true 
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    token: {
        type: String
    },
    otp: {
        type: Number
    },
    otpVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: false
});

const User = mongoose.model('User', userSchema);
module.exports = User;