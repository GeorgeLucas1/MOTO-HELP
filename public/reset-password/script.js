// Listener do formulário para atualizar senha
resetPasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideMessages();

  const email = document.getElementById('email').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

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
    // 🔑 Cria sessão temporária com o token de recuperação
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: recoveryToken,
      refresh_token: "" // o Supabase manda refresh_token no link, se tiver use aqui
    });

    if (sessionError) throw sessionError;

    // Agora sim dá para atualizar a senha
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) throw error;

    resetPasswordForm.style.display = 'none';
    showMessage(successMessageEl, 'Senha atualizada com sucesso! Redirecionando...', 'success');

    setTimeout(() => {
      window.location.href = '../login/index.html';
    }, 3000);

  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    showMessage(errorMessageEl, `Erro: ${err.message}`, 'error');
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
});
