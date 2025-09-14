const express = require('express');
const router = express.Router();
const { upload, addCar, editCar, deleteCar, getAllCars, searchCars } = require('../controller/admin.controller');
const {isAuthenticated} = require('../middlewares/isAuth');
const { rentCar } = require('../controller/rental.controller');

router.get('/get-cars', getAllCars);
router.get('/search-cars', searchCars);
router.post('/add-car', isAuthenticated, upload.single('image'), addCar);
router.put('/edit-car/:carId', isAuthenticated, upload.single('image'), editCar);
router.post('/rent-car/:carId', isAuthenticated, rentCar);
router.post('/upload', isAuthenticated, upload.single('image'), (req, res) => {
  return res.json({
    message: 'Uploaded',
    filename: req.file?.originalname,
    size: req.file?.size,
    mimetype: req.file?.mimetype,
  });
});

module.exports = router;