
const resetPasswordForm = document.getElementById('resetPasswordForm' );
const statusMessageEl = document.getElementById('statusMessage');
const errorMessageEl = document.getElementById('errorMessage');
const successMessageEl = document.getElementById('successMessage');

const supabase = window.supabase.createClient(
    'https://xyelsqywlwihbdgncilk.supabase.co', // Sua URL
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8' // Sua Chave Anon
 );

// Função para mostrar mensagens
const showMessage = (element, message) => {
    element.textContent = message;
    element.style.display = 'block';
};

// Função para esconder mensagens
const hideMessages = () => {
    errorMessageEl.style.display = 'none';
    successMessageEl.style.display = 'none';
    statusMessageEl.style.display = 'none';
};

supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
        hideMessages();
        statusMessageEl.textContent = 'Sessão de recuperação válida. Por favor, defina sua nova senha.';
        statusMessageEl.style.display = 'block';
        resetPasswordForm.style.display = 'block'; // Mostra o formulário
    }
});

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages(); // Limpa mensagens antigas

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

        resetPasswordForm.style.display = 'none'; // Esconde o formulário
        showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando para o login...');

        setTimeout(() => {
            window.location.href = '/login.html'; // Ajuste o caminho se necessário
        }, 3000);

    } catch (error) {
        showMessage(errorMessageEl, `Erro ao atualizar a senha: ${error.message}`);
    }
});
