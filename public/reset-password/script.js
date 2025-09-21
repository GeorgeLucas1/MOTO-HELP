// Seletores de elementos
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do Supabase
const supabaseUrl = 'https://xyelsqywlwihbdgncilk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variáveis para armazenar email e token
let recoveryToken = null;
let userEmailFromToken = null;

// Funções de mensagens
const showMessage = (el, msg, type = 'info') => {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.className = `message message-${type}`;
};

const hideMessages = () => {
  [errorMessageEl, successMessageEl, statusMessageEl].forEach(el => {
    if (el) el.style.display = 'none';
  });
};

// Extrai token da URL
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  if (hash && hash.includes('access_token')) {
    const hashParams = new URLSearchParams(hash.substring(1));
    return {
      access_token: hashParams.get('access_token'),
      token_type: hashParams.get('type') || hashParams.get('token_type'),
    };
  }

  return {
    access_token: params.get('access_token'),
    token_type: params.get('type') || params.get('token_type'),
  };
};

// Valida token e exibe formulário
(async () => {
  const urlParams = getUrlParams();
  console.log('URL Params:', urlParams);

  recoveryToken = urlParams.access_token;
  const tokenType = urlParams.token_type;

  if (!recoveryToken || tokenType !== 'recovery') {
    hideMessages();
    showMessage(errorMessageEl, 'Link de recuperação inválido, expirado ou já utilizado.', 'error');
    resetPasswordForm.style.display = 'none';
    return;
  }

  // Exibe o formulário
  resetPasswordForm.style.display = 'block';
  hideMessages();
  showMessage(statusMessageEl, 'Link válido. Por favor, defina sua nova senha.', 'success');
})();

// Listener do formulário para atualizar senha
resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById('email').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  // Validações básicas
  if (!email) {
    showMessage(errorMessageEl, 'Digite o e-mail da conta.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    showMessage(errorMessageEl, 'A senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showMessage(errorMessageEl, 'As senhas não coincidem.', 'error');
    return;
  }

  const submitButton = resetPasswordForm.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Atualizando...';

  try {
    // Atualiza a senha usando apenas o token de recuperação
    const { data, error } = await supabase.auth.updateUser(
      { password: newPassword },
      { headers: { Authorization: `Bearer ${recoveryToken}` } }
    );

    console.log('Update User Data:', data, 'Update User Error:', error);

    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para login...', 'success');

    // Limpa dados sensíveis
    recoveryToken = null;
    userEmailFromToken = null;

    setTimeout(() => {
      window.location.href = '../login/index.html';
    }, 3000);

  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${err.message}`, 'error');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});
