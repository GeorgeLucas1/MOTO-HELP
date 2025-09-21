// Seletores e cliente Supabase (sem alterações)
const resetPasswordForm = document.getElementById('resetPasswordForm');
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

const supabase = window.supabase.createClient(
  'https://xyelsqywlwihbdgncilk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8'
 );

// Funções de mensagem (sem alterações)
const showMessage = (element, message) => { /* ... */ };
const hideMessages = () => { /* ... */ };

// 1) Pega o token da URL e cria a sessão (VERSÃO CORRIGIDA PARA USAR '?' E 'token_type')
(async () => {
  // A URL usa '?', então window.location.search está CORRETO.
  const params = new URLSearchParams(window.location.search);
  
  const accessToken = params.get("access_token");
  // O nome do parâmetro no seu link é 'token_type', não 'token' ou 'type'.
  const tokenType = params.get("token_type"); 

  if (accessToken && tokenType === "recovery") {
    // Com os parâmetros na query string, precisamos definir a sessão manualmente.
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: accessToken // Para recuperação, pode-se passar o mesmo token.
    });

    if (error) {
      hideMessages();
      // Este erro provavelmente acontecerá se o token estiver quebrado (como está agora)
      showMessage(errorMessageEl, "Link de recuperação inválido ou expirado. Verifique se o link foi copiado corretamente.");
      console.error("Erro ao definir a sessão:", error.message);
    } else {
       // Se a sessão for definida com sucesso, o onAuthStateChange será disparado.
       hideMessages();
       showMessage(statusMessageEl, "Link válido. Carregando formulário...");
    }
  } else {
    hideMessages();
    showMessage(errorMessageEl, "Link inválido ou ausente.");
  }
})();

// 2) Ouve o evento de recuperação (sem alterações)
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    hideMessages();
    showMessage(statusMessageEl, "Sessão de recuperação válida. Defina sua nova senha.");
    resetPasswordForm.style.display = 'block';
  }
});

// 3) Envia nova senha (sem alterações)
resetPasswordForm.addEventListener('submit', async (e) => {
  // ... seu código aqui ...
});
