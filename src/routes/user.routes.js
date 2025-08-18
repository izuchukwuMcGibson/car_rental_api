const express = require('express');
const { signup, login, getUsers, getUsersById, makeAdmin } = require('../controller/user.controller');
const router = express.Router();



router.post('/signup', signup);
router.post('/login', login);
router.post('/makeAdmin/:id', makeAdmin);
router.get('/getUsers', getUsers);
router.get('/getUsersById/:id', getUsersById);

module.exports = router