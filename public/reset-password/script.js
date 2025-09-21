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
const showMessage = (element, message) => {
  element.textContent = message;
  element.style.display = 'block';
};
const hideMessages = () => {
  errorMessageEl.style.display = 'none';
  successMessageEl.style.display = 'none';
  statusMessageEl.style.display = 'none';
};

// 1. Verifica a URL e mostra o formulário
(() => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const tokenType = params.get("token_type");

  // Se o access_token existe e o tipo é 'recovery', o usuário está pronto para redefinir.
  if (accessToken && tokenType === "recovery") {
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
  hideMessages();

  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword.length < 6) {
    showMessage(errorMessageEl, 'A senha deve ter pelo menos 6 caracteres.');
    return;
  }
  if (newPassword !== confirmNewPassword) {
    showMessage(errorMessageEl, 'As senhas não coincidem.');
    return;
  }

  // Desabilitar o botão para evitar múltiplos envios
  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Atualizando...';

  try {
    // O access_token da URL já autenticou o cliente Supabase temporariamente.
    // A chamada updateUser funcionará diretamente.
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para a página de login...');

    setTimeout(() => {
      // Redirecione para sua página de login
      window.location.href = '/login.html'; 
    }, 3000);

  } catch (error) {
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    // Reabilitar o botão em caso de erro
    submitButton.disabled = false;
    submitButton.textContent = 'Definir Nova Senha';
  }
});
