const Car = require("../models/car.schema");
const { flw } = require('../utils/flutterwave');
const axios = require('axios');
const User = require("../models/user.schema");


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
      redirect_url: "https://car-rental-api-ik0u.onrender.com/",
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
      try{
      if( car.status === "pending") { 
      car.isRented = true;
      car.rentedBy = userId;
      car.startDate = startDate;
      car.endDate = endDate;
      car.totalPrice = totalPrice;
      car.status = "approved"; // Set final status to approved
      await car.save();
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
      return res.status(500).json({error: "transaction error"});
    }
};

module.exports = {
  rentCar
};
