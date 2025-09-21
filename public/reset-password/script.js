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
  
  // Verifica se os parâmetros estão na query string ou no hash
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

// Captura token de recuperação da URL e valida
(async () => {
  const urlParams = getUrlParams();
  recoveryToken = urlParams.access_token;
  const tokenType = urlParams.token_type;

  if (recoveryToken && (tokenType === 'recovery' || tokenType === 'magiclink')) {
    hideMessages();
    showMessage(statusMessageEl, "Verificando link de recuperação...", 'info');

    try {
      // Primeiro, tenta estabelecer a sessão com o token de recuperação
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: recoveryToken,
        refresh_token: urlParams.refresh_token || ''
      });

      if (sessionError) {
        throw new Error('Token de recuperação inválido ou expirado.');
      }

      // Verifica se o usuário está autenticado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        throw new Error('Token de recuperação inválido ou expirado.');
      }

      // Armazenar o email do usuário para validação posterior
      userEmailFromToken = userData.user.email;

      // Exibir o formulário apenas se o token for válido
      resetPasswordForm.style.display = 'block';
      hideMessages();
      showMessage(statusMessageEl, "Link válido. Por favor, defina sua nova senha.", 'success');

    } catch (error) {
      console.error('Erro na validação do token:', error);
      hideMessages();
      showMessage(errorMessageEl, `Erro na validação: ${error.message}`, 'error');
      resetPasswordForm.style.display = 'none';
    }

  } else {
    hideMessages();
    showMessage(errorMessageEl, "Link de recuperação inválido, expirado ou já utilizado.", 'error');
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

  // Validação do email
  if (!email) {
    showMessage(errorMessageEl, 'Por favor, digite o e-mail da sua conta.', 'error');
    return;
  }

  // Verificar se o email digitado corresponde ao email do token
  if (userEmailFromToken && email.toLowerCase() !== userEmailFromToken.toLowerCase()) {
    showMessage(errorMessageEl, 'O e-mail digitado não corresponde à conta associada a este link de recuperação.', 'error');
    return;
  }

  // Validações de senha
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
    // Atualiza a senha do usuário usando a sessão já estabelecida
    const { data, error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (error) {
      throw error;
    }

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para login...', 'success');

    // Limpar dados sensíveis da memória
    userEmailFromToken = null;
    recoveryToken = null;

    // Fazer logout para limpar a sessão
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


