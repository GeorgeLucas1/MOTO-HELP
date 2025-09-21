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

// 1. LÓGICA PRINCIPAL: Define a sessão e depois mostra o formulário
(async () => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const tokenType = params.get("token_type");

  if (accessToken && tokenType === "recovery") {
    // PASSO 1: Tenta definir a sessão manualmente usando o token.
    // Para recuperação, o refresh_token pode ser o mesmo que o access_token.
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });

    if (error) {
      // Se setSession falhar, o token é inválido ou expirado.
      hideMessages();
      showMessage(errorMessageEl, `Erro ao verificar o link: ${error.message}`);
      resetPasswordForm.style.display = 'none';
    } else {
      // SUCESSO! A sessão está ativa. Agora podemos mostrar o formulário.
      hideMessages();
      showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.");
      resetPasswordForm.style.display = 'block';
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
    // PASSO 2: Chama updateUser. Como a sessão já foi definida,
    // não precisamos mais passar o accessToken aqui.
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando...');

    setTimeout(() => {
      window.location.href = '/login.html';
    }, 3000);

  } catch (error) {
    // Se o erro "Auth session missing!" aparecer de novo, há um problema fundamental
    // na forma como o Supabase está configurado ou na versão da biblioteca.
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    submitButton.disabled = false;
    submitButton.textContent = 'Definir Nova Senha';
  }
});
