const Car = require("../models/car.schema");
const axios = require('axios');
const User = require("../models/user.schema");

const rentCar = async (req, res) => {
  const userId = req.user.id;
  const { carId } = req.params;
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
    redirect_url: "https://car-rental-api-ks0u.onrender.com", // keep this for demo!
    startDate,
    endDate,
    payment_options: "card, banktransfer, ussd",
    customer: {
      email: rentingUser.email,
      name: rentingUser.name
    },
    customizations: {
      title: "Car Rental Nigeria",
      description: "payment for Car Rental"
    }
  };

  try {
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }
    if (car.isRented) {
      return res.status(400).json({ message: "Car is already rented" });
    }

    let checkoutUrl = "";
    try {
      const response = await axios.post(
        "https://api.flutterwave.com/v3/payments",
        payload,
        {
          headers: {
            Authorization: `Bearer ${process.env.SECRET_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      checkoutUrl = response.data.data.link;
    } catch (error) {
      console.log(error);
      // Fallback link if payment request fails (for demo)
      checkoutUrl = "https://car-rental-api-ks0u.onrender.com";
    }

    // Mark the car as rented right after checkout link is generated
    car.isRented = true;
    car.rentedBy = userId;
    car.startDate = startDate;
    car.endDate = endDate;
    car.totalPrice = totalPrice;
    car.status = "approved";
    await car.save();

    return res.status(200).json({
      message: "Car rented successfully (Demo mode, payment not verified)",
      checkoutUrl
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: "Transaction error" });
  }
};

module.exports = {
  rentCar
};