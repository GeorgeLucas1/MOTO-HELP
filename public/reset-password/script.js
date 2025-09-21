const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

const supabase = window.supabase.createClient(
  'https://xyelsqywlwihbdgncilk.supabase.co', // SUA URL DO SUPABASE
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8' // SUA CHAVE ANON
);

// Funções de mensagens
const showMessage = (element, message) => {
  element.textContent = message;
  element.style.display = 'block';
};
const hideMessages = () => {
  errorMessageEl.style.display = 'none';
  successMessageEl.style.display = 'none';
  statusMessageEl.style.display = 'none';
};

// 1) Pega o token da URL e cria a sessão
(async () => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const type = params.get("token_type");

  if (accessToken && type === "recovery") {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: "" // refresh_token não vem no link de recuperação
    });

    if (error) {
      hideMessages();
      showMessage(errorMessageEl, "Link de recuperação inválido ou expirado.");
      console.error(error.message);
    }
  } else {
    hideMessages();
    showMessage(errorMessageEl, "Link inválido.");
  }
})();

// 2) Ouve o evento de recuperação
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    hideMessages();
    showMessage(statusMessageEl, "Sessão de recuperação válida. Defina sua nova senha.");
    resetPasswordForm.style.display = 'block';
  }
});

// 3) Envia nova senha
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

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para o login...');

    setTimeout(() => {
      window.location.href = '/login.html'; // ajuste conforme seu projeto
    }, 3000);

  } catch (error) {
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
  }
})