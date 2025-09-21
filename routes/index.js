const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.get('/login', (req, res) => {
    res.render('login'); 
});

router.get('/reset-password', (req, res) => {
    res.render('reset-password');
});

router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/reset-password', authController.resetPassword);

module.exports = router;