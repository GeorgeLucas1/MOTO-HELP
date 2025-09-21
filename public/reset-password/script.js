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

// 1. LÓGICA PRINCIPAL: Troca o token de recuperação por uma sessão e mostra o formulário
(async () => {
  const params = new URLSearchParams(window.location.search);
  const recoveryToken = params.get("access_token"); // O token de recuperação
  const tokenType = params.get("token_type");

  if (recoveryToken && tokenType === "recovery") {
    hideMessages();
    showMessage(statusMessageEl, "Verificando link de recuperação...");

    // --- MUDANÇA CRUCIAL AQUI ---
    // Troca o token de recuperação por uma sessão real do Supabase.
    // O 'type' deve ser 'recovery' para este fluxo.
    const { data, error } = await supabase.auth.verifyOtp({
      token: recoveryToken,
      type: 'recovery',
    });

    if (error) {
      // Se a troca falhar, o token é inválido ou expirado.
      hideMessages();
      showMessage(errorMessageEl, `Erro ao verificar o link: ${error.message}`);
      resetPasswordForm.style.display = 'none';
    } else if (data.session) {
      // SUCESSO! Uma sessão válida foi estabelecida.
      hideMessages();
      showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.");
      resetPasswordForm.style.display = 'block';
    } else {
      // Caso a sessão não seja retornada por algum motivo inesperado
      hideMessages();
      showMessage(errorMessageEl, "Erro inesperado ao validar o link. Tente novamente.");
      resetPasswordForm.style.display = 'none';
    }
  } else {
    // Se não houver tokens na URL.
    hideMessages();
    showMessage(errorMessageEl, "Link de recuperação inválido, expirado ou já utilizado.");
    resetPasswordForm.style.display = 'none';
  }
})();

// 2. Listener do formulário para ATUALIZAR a senha
resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  // Não precisamos mais do recoveryAccessToken aqui, pois a sessão já foi estabelecida.
  // O cliente Supabase agora sabe quem é o usuário.

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

  const submitButton = resetPasswordForm.querySelector('button[type="submit"]");
  submitButton.disabled = true;
  submitButton.textContent = 'Atualizando...';

  try {
    // --- MUDANÇA AQUI ---
    // Agora usamos supabase.auth.updateUser() diretamente, pois a sessão já foi estabelecida.
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
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