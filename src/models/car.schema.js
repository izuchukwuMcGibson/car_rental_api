const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    make: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    year: {
        type: Number,
        required: true,
        min: 1886 // The year the first car was invented
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },  
    isAvailable: {
        type: Boolean,
        default: true
    },  
    description: {
        type: String,
        trim: true
    },
    color: {
        type: String,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    startDate: {
        type: Date,
        trim: true
    },
    endDate: {
        type: Date,
        trim: true
    },
    totalPrice: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'not-rented'],
        default: 'not-rented'
    },
    rentedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isRented: {
        type: String,
        trim: false
    }
}, {
    timestamps: true,
    versionKey: false
});

const Car = mongoose.model('Car', carSchema);
module.exports = Car;