// Seletores de elementos (sem alterações)
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do cliente Supabase (sem alterações)
const supabase = window.supabase.createClient(
  'https://xyelsqywlwihbdgncilk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8'
 );

// Funções de mensagens (sem alterações)
const showMessage = (element, message) => { /* ... */ };
const hideMessages = () => { /* ... */ };

// --- MUDANÇA IMPORTANTE AQUI ---
// Vamos declarar a variável do token fora do escopo inicial
// para que possamos usá-la mais tarde no evento de submit.
let recoveryToken = null;

// 1. Verifica a URL, armazena o token e mostra o formulário
(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const tokenType = params.get("token_type");

  if (accessToken && tokenType === "recovery") {
    // Armazena o token na nossa variável global
    recoveryToken = accessToken;
    
    hideMessages();
    showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.");
    resetPasswordForm.style.display = 'block';
  } else {
    hideMessages();
    showMessage(errorMessageEl, "Link de recuperação inválido, expirado ou já utilizado.");
    resetPasswordForm.style.display = 'none';
  }
})();

// 2. Listener do formulário para ATUALIZAR a senha
resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Verifica se o token foi capturado. Se não, algo deu muito errado.
  if (!recoveryToken) {
      showMessage(errorMessageEl, 'Sessão de recuperação não encontrada. Por favor, use o link do seu e-mail novamente.');
      return;
  }

  hideMessages();

  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword.length < 6) { /* ... validações ... */ }
  if (newPassword !== confirmNewPassword) { /* ... validações ... */ }

  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Atualizando...';

  try {
    // --- MUDANÇA CRUCIAL AQUI ---
    // Passamos o token de recuperação junto com a nova senha.
    // Isso informa ao Supabase qual sessão de usuário deve ser atualizada.
    const { error } = await supabase.auth.updateUser(
      { password: newPassword },
      { accessToken: recoveryToken } // Opção adicionada
    );
    
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para a página de login...');

    setTimeout(() => {
      window.location.href = '/login.html';
    }, 3000);

  } catch (error) {
    // O erro "Auth session missing!" não deve mais acontecer.
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = 'Definir Nova Senha';
  }
});
