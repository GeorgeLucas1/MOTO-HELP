// Seletores de elementos
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do cliente Supabase (public anon key)
const supabaseUrl = 'https://xyelsqywlwihbdgncilk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Funções de mensagens
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

// Captura token de recuperação da URL
(async () => {
  const params = new URLSearchParams(window.location.search);
  const recoveryToken = params.get("access_token");
  const tokenType = params.get("token_type");

  if (recoveryToken && tokenType === "recovery") {
    hideMessages();
    showMessage(statusMessageEl, "Verificando link de recuperação...");

    // Aqui não usamos verifyOtp; apenas habilitamos o formulário com o token
    resetPasswordForm.style.display = 'block';
    hideMessages();
    showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.");

  } else {
    hideMessages();
    showMessage(errorMessageEl, "Link de recuperação inválido, expirado ou já utilizado.");
    resetPasswordForm.style.display = 'none';
  }
})();

// Listener do formulário para atualizar a senha
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

  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Atualizando...';

  try {
    // Cria uma instância temporária do Supabase com o token de recuperação
    const params = new URLSearchParams(window.location.search);
    const recoveryToken = params.get("access_token");

    const supabaseRecovery = window.supabase.createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${recoveryToken}` } }
    });

    // Atualiza a senha do usuário
    const { error } = await supabaseRecovery.auth.updateUser({ password: newPassword });
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para login...');

    setTimeout(() => window.location.href = '/login.html', 3000);

  } catch (error) {
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = 'Definir Nova Senha';
  }
});
