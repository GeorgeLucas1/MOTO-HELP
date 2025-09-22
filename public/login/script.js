//=============== ARQUIVO: login/script.js (VERSÃO APRIMORADA) ===============

try {
    // --- 1. INICIALIZAÇÃO DO SUPABASE ---
    const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
    // --- 2. ELEMENTOS DO DOM ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const modalOverlay = document.getElementById('modalOverlay');
    const openRegisterModal = document.getElementById('openRegisterModal');
    const closeModalButton = document.getElementById('closeModal');
    const cancelRegisterButton = document.getElementById('cancelRegister');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  
    const showModal = () => modalOverlay.classList.add('active');
    const hideModal = () => modalOverlay.classList.remove('active');
  
    openRegisterModal?.addEventListener('click', showModal);
    closeModalButton?.addEventListener('click', hideModal);
    cancelRegisterButton?.addEventListener('click', hideModal);
  
    // --- 3. LOGIN ---
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('senha').value;
  
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
  
        if (data.user) {
          alert('Login realizado com sucesso!');
          window.location.href = '../home/index.html';
        } else {
          alert('Usuário ou senha inválidos.');
        }
      } catch (error) {
        alert(`Erro no login: ${error.message}`);
      }
    });
  
    // --- 4. CADASTRO ---
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regSenha').value;
      const confirmPassword = document.getElementById('regConfirmarSenha').value;
  
      if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
      }
  
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        
        if (error) {
          // Tratamento de erros mais amigável
          if (error.message.includes('already registered')) {
            alert('Este e-mail já está cadastrado. Tente fazer login ou redefinir a senha.');
          } else if (error.message.includes('Password should be')) {
            alert('Senha muito fraca. Use letras maiúsculas, minúsculas e números.');
          } else {
            alert(`Erro no cadastro: ${error.message}`);
          }
          return;
        }
  
        if (data.user) {
          alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer o login.');
          hideModal();
        }
      } catch (error) {
        alert(`Erro inesperado no cadastro: ${error.message}`);
      }
    });
  
    // --- 5. ESQUECEU A SENHA ---
    forgotPasswordLink?.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = prompt("Digite seu e-mail para receber o link de redefinição:");
  
      if (!email) return;
  
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password.html`,
        });
  
        if (error) throw error;
        alert('Link de redefinição enviado! Confira sua caixa de entrada.');
      } catch (error) {
        alert(`Erro ao enviar e-mail: ${error.message}`);
      }
    });
  
  } catch (error) {
    console.error("Erro crítico no script de login/cadastro:", error);
    alert("Ocorreu um erro crítico. Recarregue a página e tente novamente.");
  }
  