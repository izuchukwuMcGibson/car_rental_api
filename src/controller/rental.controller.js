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



// Assumes you have authentication middleware that sets req.user.id

const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find cars rented by this user
    const bookings = await Car.find({ rentedBy: userId })
      .select("-__v") // Exclude __v field
      .populate("rentedBy", "name email") // Populate rentedBy with name and email

    // Format response with car info and rental details
    const formattedBookings = bookings.map(car => ({
      car: {
        image: car.image,
        make: car.make,
        model: car.model,
        year: car.year,
        color: car.color,
        brand: car.brand,
        description: car.description,
        status: car.status,
        _id: car._id,
      },
      startDate: car.startDate,
      endDate: car.endDate,
      totalPrice: car.totalPrice,
      rentedBy: car.rentedBy, // Populated user info
    }));

    return res.status(200).json({ bookings: formattedBookings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not fetch bookings." });
  }
};


module.exports = {
  rentCar,
  getMyBookings
};