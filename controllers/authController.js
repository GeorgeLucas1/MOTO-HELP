// controllers/authController.js

// 1. O Controller agora importa o Model, e não mais o cliente do Supabase.
//basicamente eu importei aonde tem as regra das autenticacao
const AuthModel = require('../models/authmodel');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 2. O Controller DELEGA a lógica de negócio para o Model.
    const data = await AuthModel.register(email, password);

    // 3. A responsabilidade do Controller é apenas enviar a resposta.
    res.status(201).json({ message: 'Usuário registrado com sucesso!', data });
  } catch (error) {
    // Ele captura qualquer erro que o Model tenha lançado.
    res.status(500).json({ message: 'Erro ao registrar usuário.', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 2. O Controller DELEGA a lógica de negócio para o Model.
    const data = await AuthModel.login(email, password);

    // 3. A responsabilidade do Controller é apenas enviar a resposta.
    res.json(data);
  } catch (error) {
    // Ele captura qualquer erro que o Model tenha lançado.
    res.status(500).json({ message: 'Erro ao fazer login.', error: error.message });
  }
};
