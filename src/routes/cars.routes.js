const express = require('express');
const router = express.Router();
const { addCar, editCar, deleteCar, getAllCars, searchCars } = require('../controller/admin.controller');
const {isAuthenticated} = require('../middlewares/isAuth');
const { rentCar } = require('../controller/rental.controller');

router.get('/get-cars', getAllCars);
router.get('/search-cars', searchCars);
router.post('/add-car',isAuthenticated, addCar);
router.put('/edit-car/:carId',isAuthenticated, editCar);
router.delete('/delete-car/:carId',isAuthenticated, deleteCar);
router.post('/rent-car/:carId', isAuthenticated, rentCar);


module.exports = router;