// Seletores de elementos
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do Supabase
const supabaseUrl = 'https://xyelsqywlwihbdgncilk.supabase.co';
const supabaseKey = 'SUA_ANON_KEY_AQUI';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Variável do token de recuperação
let recoveryToken = null;

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

// Extrai token da URL (hash #access_token)
const getRecoveryTokenFromUrl = () => {
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.substring(1));
  if (params.get('type') !== 'recovery') return null;

  return params.get('access_token');
};

// Valida token e exibe formulário
(async () => {
  recoveryToken = getRecoveryTokenFromUrl();

  if (!recoveryToken) {
    hideMessages();
    showMessage(errorMessageEl, 'Link de recuperação inválido, expirado ou já utilizado.', 'error');
    if (resetPasswordForm) resetPasswordForm.style.display = 'none';
    return;
  }

  // Exibe o formulário
  resetPasswordForm.style.display = 'block';
  hideMessages();
  showMessage(statusMessageEl, 'Link válido. Por favor, defina sua nova senha.', 'success');
})();

// Listener do formulário para atualizar senha
if (resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // Validações básicas
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
      // Atualiza a senha diretamente com o recovery token
      const { data, error } = await supabase.auth.api.updateUser(recoveryToken, {
        password: newPassword
      });

      if (error) throw error;

      resetPasswordForm.style.display = 'none';
      showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para login...', 'success');

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
}
