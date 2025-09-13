const Car = require("../models/car.schema");
const Notification = require("../models/notification.schema");
const { flw } = require('../utils/flutterwave');
const axios = require('axios');
const User = require("../models/user.schema");

// Helper function to create notifications
const createNotification = async (userId, type, title, message, carId = null, rentalId = null) => {
    try {
        const notification = new Notification({
            userId,
            type,
            title,
            message,
            relatedCarId: carId,
            relatedRentalId: rentalId
        });
        await notification.save();
    } catch (error) {
        console.error("Error creating notification:", error);
    }
};

const rentCar = async (req, res) => {
    const userId = req.user.id;
  const { carId = id } = req.params;
  const { startDate, endDate, totalPrice } = req.body;
  const rentingUser = await User.findById(userId);
  const car = await Car.findById(carId);
    const tx_ref = `rent_${carId}_${Date.now()}`;
    const payload = {
      id: Math.floor(100000 + Math.random() * 900000),
      tx_ref,
      amount: totalPrice,
      currency: "NGN",
      rentingUser,
      redirect_url: "https://car-rental-api-ks0u.onrender.com",
      startDate: startDate,
      endDate:endDate,
      payment_options: "card, banktransfer, ussd",
      customer: {
        email: rentingUser.email,
        name: rentingUser.name
      },
      customizations: {
        title: "Car Rental Nigeria",
        description: "payment for Car Rental"
      }
    }

  try {
    // Find the car by ID
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    // Check if the car is already rented
    if (car.isRented) {
      return res.status(400).json({ message: "Car is already rented" });
    }

    try {
      const response = await axios.post(
        "https://api.flutterwave.com/v3/payments",
        payload,
        {
          headers:{
            Authorization: `Bearer ${process.env.SECRET_KEY}`,
            "Content-Type":"application/json"
          },
        }
      )
      const checkoutUrl = response.data.data.link
      console.log("checkout link:", checkoutUrl)
      car.status = "pending"; // Set initial status to pending
      await car.save();
      
      // Create pending notification
      await createNotification(
        userId,
        'rental_pending',
        'Rental Request Submitted',
        `Your rental request for ${car.make} ${car.model} is pending payment verification.`,
        carId,
        tx_ref
      );
      
      try{
      if( car.status === "pending") { 
      car.isRented = true;
      car.rentedBy = userId;
      car.startDate = startDate;
      car.endDate = endDate;
      car.totalPrice = totalPrice;
      car.status = "approved"; // Set final status to approved
      await car.save();
      
      // Create approval notification
      await createNotification(
        userId,
        'rental_approved',
        'Rental Approved!',
        `Your rental request for ${car.make} ${car.model} has been approved. Enjoy your ride!`,
        carId,
        tx_ref
      );
      
      return res.status(200).json({ message: "Car rented successfully"});
    } else{
      return res.status(500).json({message: "Car could not be rented successfully"})
    }}catch(e) {
      console.log(e);
      res.status(500).json({message:"Error verifying payment"});
    }} catch(error) {
      console.log(error);
      return res.status(500).json({error: "Unable to initialize payment"});
    }}
    catch(e) {
      console.log(e);
      car.isRented = false;
      car.rentedBy = userId;
      car.startDate = startDate;
      car.endDate = endDate;
      car.totalPrice = totalPrice;
      car.status = "rejected"; // Set final status to rejected
      await car.save();
      
      // Create rejection notification
      await createNotification(
        userId,
        'rental_rejected',
        'Rental Request Rejected',
        `Your rental request for ${car.make} ${car.model} was rejected due to payment issues.`,
        carId,
        tx_ref
      );
      
      return res.status(500).json({error: "transaction error"});
    }
};

module.exports = {
  rentCar
};
