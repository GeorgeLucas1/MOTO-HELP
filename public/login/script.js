//=============== ARQUIVO: login/script.js (VERSÃO COMPLETA E CORRIGIDA) ===============

// Envolvemos todo o código em um bloco 'try...catch' para garantir que, se a inicialização falhar,
// o usuário receba um aviso claro e o script não quebre a página.
try {
  // --- 1. INICIALIZAÇÃO DO SERVIÇO SUPABASE ---
  // A variável 'supabase' agora está disponível para todo o código dentro deste bloco 'try'.
  const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

  // --- 2. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const modalOverlay = document.getElementById('modalOverlay');
  const openRegisterModal = document.getElementById('openRegisterModal');
  const closeModalButton = document.getElementById('closeModal');
  const cancelRegisterButton = document.getElementById('cancelRegister');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink'); // Referência para o link

  // --- 3. LÓGICA DE CONTROLE DO MODAL DE CADASTRO ---
  const showModal = () => modalOverlay.classList.add('active');
  const hideModal = () => modalOverlay.classList.remove('active');

  if (openRegisterModal) openRegisterModal.addEventListener('click', showModal);
  if (closeModalButton) closeModalButton.addEventListener('click', hideModal);
  if (cancelRegisterButton) cancelRegisterButton.addEventListener('click', hideModal);

  // --- 4. MANIPULADORES DE EVENTOS DE AUTENTICAÇÃO ---

  /**
   * LOGIN COM E-MAIL/SENHA (via SUPABASE)
   */
  if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('senha').value;

          try {
              const { data, error } = await supabase.auth.signInWithPassword({ email, password });
              if (error) throw error;

              if (data.user) {
                  alert('Login realizado com sucesso!');
                  window.location.href = '../home/index.html';
              }
          } catch (error) {
              alert(`Erro no login: ${error.message}`);
          }
      });
  }

  /**
   * CADASTRO COM E-MAIL/SENHA (via SUPABASE)
   */
  if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
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
              if (error) throw error;

              if (data.user) {
                  alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer o login.');
                  hideModal(); // Fecha o modal após o sucesso
              }
          } catch (error) {
              alert(`Erro no cadastro: ${error.message}`);
          }
      });
  }

  /**
   * ESQUECEU A SENHA (via SUPABASE)
   * Este bloco foi movido para DENTRO do 'try' para ter acesso à variável 'supabase'.
   */
  if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', async (e) => {
          e.preventDefault();
          const email = prompt("Por favor, digite seu e-mail para receber o link de redefinição:");

          if (!email) return; // O usuário cancelou o prompt

          try {
              // Agora esta chamada funciona, pois 'supabase' está definido neste escopo.
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/reset-password.html`,
              });

              if (error) throw error;

              alert('Link de redefinição enviado! Verifique sua caixa de entrada e a pasta de spam.');

          } catch (error) {
              alert(`Erro ao enviar e-mail: ${error.message}`);
          }
      });
  }

} catch (error) {
  console.error("Erro fatal na inicialização dos scripts de login:", error);
  alert("Ocorreu um erro crítico ao carregar a página. Por favor, recarregue e tente novamente.");
}
