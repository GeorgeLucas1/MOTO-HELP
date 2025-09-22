const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

// A rota GET /login foi removida para evitar redundância.
// A rota principal '/' em index.js já renderiza a página de login.

// As rotas de autenticação agora estão prefixadas com /auth
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);

// A rota de reset de senha foi removida porque a funcionalidade não existe mais.

module.exports = router;
