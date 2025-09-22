// models/AuthModel.js

// 1. O Model é quem importa o cliente do banco de dados.
const supabase = require('../config/supabaseClient');

class AuthModel {
  /**
   * Registra um novo usuário no banco de dados.
   * @param {string} email - O email do usuário.
   * @param {string} password - A senha do usuário.
   * @returns {Promise<object>} Os dados do usuário registrado.
   */
  static async register(email, password) {
    // A lógica de negócio está isolada aqui.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // Lançamos um erro que o Controller irá capturar.
      throw error;
    }

    return data;
  }

  /**
   * Autentica um usuário existente.
   * @param {string} email - O email do usuário.
   * @param {string} password - A senha do usuário.
   * @returns {Promise<object>} Os dados da sessão do usuário (incluindo o token).
   */
  static async login(email, password) {
    // A lógica de negócio está isolada aqui.
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Lançamos um erro que o Controller irá capturar.
      throw error;
    }

    return data;
  }
}

module.exports = AuthModel;
