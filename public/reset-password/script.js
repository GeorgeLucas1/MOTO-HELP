// Seletores de elementos do DOM (sem alterações)
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do cliente Supabase (sem alterações)
const supabase = window.supabase.createClient(
  'https://xyelsqywlwihbdgncilk.supabase.co', // SUA URL DO SUPABASE
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8' // SUA CHAVE ANON
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

(() => {
  // Extrai os parâmetros do HASH (#) da URL, não da query string (?)
  // Ex: #access_token=...&type=recovery
  const hashFragment = window.location.hash.substring(1); // Remove o '#' inicial
  const params = new URLSearchParams(hashFragment);
  
  const accessToken = params.get("access_token");
  const type = params.get("type"); // O parâmetro é 'type', não 'token'

  // Apenas verifica se os parâmetros necessários existem na URL.
  // O listener onAuthStateChange fará o trabalho pesado.
  if (!accessToken || type !== "recovery") {
    hideMessages();
    showMessage(errorMessageEl, "Link de recuperação inválido, expirado ou já utilizado.");
    resetPasswordForm.style.display = 'none'; // Garante que o formulário não apareça
  } else {
    // Se os parâmetros existem, mostra uma mensagem de status enquanto o Supabase processa.
    showMessage(statusMessageEl, "Verificando link de recuperação...");
  }
})();

// 2) Ouve o evento de recuperação de senha
supabase.auth.onAuthStateChange(async (event, session) => {
  // Este evento é o ponto central da lógica. Ele é disparado quando o Supabase
  // detecta os tokens de recuperação na URL (do passo 1).
  if (event === "PASSWORD_RECOVERY") {
    hideMessages();
    showMessage(statusMessageEl, "Sessão de recuperação válida. Por favor, defina sua nova senha.");
    resetPasswordForm.style.display = 'block';
  }
});

// 3) Envia a nova senha (sem alterações, mas com uma pequena melhoria)
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
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para a página de login...');

    setTimeout(() => {
      window.location.href = '/login.html'; // Ajuste o caminho se necessário
    }, 3000);

  } catch (error) {
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    // Reabilitar o botão em caso de erro
    submitButton.disabled = false;
    submitButton.textContent = 'Definir Nova Senha';
  }
});
