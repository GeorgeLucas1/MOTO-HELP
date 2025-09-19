const supabase = require('../config/supabaseClient');

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    res.status(201).json({ message: 'Usuário registrado com sucesso!', data });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar usuário.', error });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer login.', error });
  }
};
