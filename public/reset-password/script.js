// Seletores de elementos
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do cliente Supabase (public anon key)
const supabaseUrl = 'https://xyelsqywlwihbdgncilk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variável para armazenar o email do usuário associado ao token
let userEmailFromToken = null;

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

// Captura token de recuperação da URL e valida
(async () => {
  const params = new URLSearchParams(window.location.search);
  const recoveryToken = params.get("access_token");
  const tokenType = params.get("token_type");

  if (recoveryToken && tokenType === "recovery") {
    hideMessages();
    showMessage(statusMessageEl, "Verificando link de recuperação...");

    try {
      // MELHORIA: Criar instância do Supabase com o token de recuperação para validação
      const supabaseRecovery = window.supabase.createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${recoveryToken}` } }
      });

      // MELHORIA: Validar o token obtendo informações do usuário
      const { data: userData, error: userError } = await supabaseRecovery.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error('Token de recuperação inválido ou expirado.');
      }

      // MELHORIA: Armazenar o email do usuário para validação posterior
      userEmailFromToken = userData.user.email;

      // Exibir o formulário apenas se o token for válido
      resetPasswordForm.style.display = 'block';
      hideMessages();
      showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.");

    } catch (error) {
      hideMessages();
      showMessage(errorMessageEl, `Erro na validação: ${error.message}`);
      resetPasswordForm.style.display = 'none';
    }

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

  const email = document.getElementById('email').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  // MELHORIA: Validação do email
  if (!email) {
    showMessage(errorMessageEl, 'Por favor, digite o e-mail da sua conta.');
    return;
  }

  // MELHORIA: Verificar se o email digitado corresponde ao email do token
  if (userEmailFromToken && email.toLowerCase() !== userEmailFromToken.toLowerCase()) {
    showMessage(errorMessageEl, 'O e-mail digitado não corresponde à conta associada a este link de recuperação.');
    return;
  }

  // Validações existentes
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

    // MELHORIA: Limpar dados sensíveis da memória
    userEmailFromToken = null;

    setTimeout(() => window.location.href = '/login.html', 3000);

  } catch (error) {
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar Nova Senha';
  }
});

