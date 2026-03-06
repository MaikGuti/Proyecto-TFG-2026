// src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const loginValidation = [
  body('email')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
];

const changePasswordValidation = [
  body('passwordActual')
    .notEmpty().withMessage('Introduce tu contraseña actual'),
  body('passwordNueva')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener mínimo 6 caracteres'),
];

// POST /api/auth/login
router.post('/login', loginValidation, authController.login);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/change-password
router.post('/change-password', authenticate, changePasswordValidation, authController.changePassword);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

module.exports = router;
