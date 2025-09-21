// Seletores de elementos
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do cliente Supabase
const supabase = window.supabase.createClient(
  'https://xyelsqywlwihbdgncilk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8'
 );

// Funções de mensagens (IMPLEMENTAÇÃO COMPLETA)
const showMessage = (element, message) => {
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
};

const hideMessages = () => {
  if (errorMessageEl) errorMessageEl.style.display = 'none';
  if (successMessageEl) successMessageEl.style.display = 'none';
  if (statusMessageEl) statusMessageEl.style.display = 'none';
};

// Variável para armazenar o token
let recoveryToken = null;

// 1. Verifica a URL, armazena o token e mostra o formulário
(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const tokenType = params.get("token_type");

  if (accessToken && tokenType === "recovery") {
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
  e.preventDefault(); // Impede o recarregamento da página

  if (!recoveryToken) {
    showMessage(errorMessageEl, 'Sessão de recuperação não encontrada. Por favor, use o link do seu e-mail novamente.');
    return;
  }

  hideMessages();

  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  // Validações completas com mensagens de erro
  if (newPassword.length < 6) {
    showMessage(errorMessageEl, 'A senha deve ter pelo menos 6 caracteres.');
    return;
  }
  if (newPassword !== confirmNewPassword) {
    showMessage(errorMessageEl, 'As senhas não coincidem.');
    return;
  }

  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Atualizando...';

  try {
    const { error } = await supabase.auth.updateUser(
      { password: newPassword },
      { accessToken: recoveryToken }
    );
    
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para a página de login...');

    setTimeout(() => {
      window.location.href = '/login.html';
    }, 3000);

  } catch (error) {
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = 'Definir Nova Senha';
  }
});
