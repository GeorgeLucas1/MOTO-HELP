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
let recoveryToken = null;

// Funções de mensagens
const showMessage = (element, message, type = 'info') => {
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
    element.className = `message message-${type}`;
  }
};

const hideMessages = () => {
  if (errorMessageEl) errorMessageEl.style.display = 'none';
  if (successMessageEl) successMessageEl.style.display = 'none';
  if (statusMessageEl) statusMessageEl.style.display = 'none';
};

// Função para extrair parâmetros da URL
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash;

  if (hash && hash.includes('access_token')) {
    const hashParams = new URLSearchParams(hash.substring(1));
    return {
      access_token: hashParams.get('access_token'),
      token_type: hashParams.get('type') || hashParams.get('token_type'),
      refresh_token: hashParams.get('refresh_token')
    };
  }

  return {
    access_token: params.get('access_token'),
    token_type: params.get('type') || params.get('token_type'),
    refresh_token: params.get('refresh_token')
  };
};

// Função principal para validar token e mostrar formulário
(async () => {
  const urlParams = getUrlParams();
  console.log('URL Params:', urlParams);

  recoveryToken = urlParams.access_token;
  const tokenType = urlParams.token_type;

  if (!recoveryToken || (tokenType !== 'recovery' && tokenType !== 'magiclink')) {
    hideMessages();
    showMessage(errorMessageEl, "Link de recuperação inválido, expirado ou já utilizado.", 'error');
    resetPasswordForm.style.display = 'none';
    return;
  }

  hideMessages();
  showMessage(statusMessageEl, "Verificando link de recuperação...", 'info');

  try {
    // Tentar estabelecer a sessão com token de recuperação
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: recoveryToken,
      refresh_token: urlParams.refresh_token || ''
    });
    console.log('Session Data:', sessionData, 'Session Error:', sessionError);

    if (sessionError) throw new Error(sessionError.message || 'Token inválido ou expirado');

    // Capturar usuário
    const { data: userData, error: userError } = await supabase.auth.getUser();
    console.log('User Data:', userData, 'User Error:', userError);

    if (userError || !userData.user) throw new Error(userError?.message || 'Usuário não encontrado');

    userEmailFromToken = userData.user.email;

    resetPasswordForm.style.display = 'block';
    hideMessages();
    showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.", 'success');

  } catch (error) {
    console.error('Erro na validação do token:', error);
    hideMessages();
    showMessage(errorMessageEl, `Erro na validação: ${error.message}`, 'error');
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

  if (!email) {
    showMessage(errorMessageEl, 'Por favor, digite o e-mail da sua conta.', 'error');
    return;
  }

  if (userEmailFromToken && email.toLowerCase() !== userEmailFromToken.toLowerCase()) {
    showMessage(errorMessageEl, 'O e-mail digitado não corresponde à conta associada a este link.', 'error');
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
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    console.log('Update User Data:', data, 'Update User Error:', error);

    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para login...', 'success');

    userEmailFromToken = null;
    recoveryToken = null;

    await supabase.auth.signOut();

    setTimeout(() => {
      window.location.href = '../login/index.html';
    }, 3000);

  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`, 'error');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});
