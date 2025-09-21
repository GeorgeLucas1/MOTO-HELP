// Seletores de elementos
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

// Inicialização do cliente Supabase (ainda necessário para outras funcionalidades)
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

let recoveryAccessToken = null; // Renomeado para clareza

// 1. LÓGICA PRINCIPAL: Define a sessão e depois mostra o formulário
(async () => {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("access_token");
  const tokenType = params.get("token_type");

  if (accessToken && tokenType === "recovery") {
    recoveryAccessToken = accessToken; // Armazena o access_token

    // Tenta definir a sessão. Isso é importante para que o cliente Supabase
    // tenha o usuário atual em seu estado interno, mesmo que não seja usado diretamente para updateUser.
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken,
    });

    if (sessionError) {
      // Se setSession falhar, o token é inválido ou expirado.
      hideMessages();
      showMessage(errorMessageEl, `Erro ao verificar o link: ${sessionError.message}`);
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

  if (!recoveryAccessToken) {
    showMessage(errorMessageEl, 'Sessão de recuperação não encontrada. Por favor, use o link do seu e-mail novamente.');
    return;
  }

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
    // --- SOLUÇÃO ALTERNATIVA: Requisição HTTP direta para a API REST do Supabase ---
    const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
    const API_ENDPOINT = `${SUPABASE_URL}/auth/v1/user`;

    const response = await fetch(API_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recoveryAccessToken}`, // Usa o access_token para autorização
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8' // Sua chave anon
      },
      body: JSON.stringify({ password: newPassword })
    });

    const data = await response.json();

    if (!response.ok) {
      // Se a resposta não for OK (status 2xx), significa um erro da API.
      throw new Error(data.msg || data.message || 'Erro desconhecido ao atualizar a senha.');
    }

    // Se chegou aqui, a senha foi atualizada com sucesso.
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
})