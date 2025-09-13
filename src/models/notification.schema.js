const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['rental_approved', 'rental_pending', 'rental_rejected', 'rental_completed', 'payment_success', 'payment_failed'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedCarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        default: null
    },
    relatedRentalId: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;