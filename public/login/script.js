//=============== ARQUIVO: script.js (VERSÃO APRIMORADA) ===============

try {
  // --- 1. INICIALIZAÇÃO DO SUPABASE ---
  const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- 2. ELEMENTOS DO DOM ---
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const modalOverlay = document.getElementById('modalOverlay');
  const openRegisterModal = document.getElementById('openRegisterModal');
  const closeModalButton = document.getElementById('closeModal');
  const cancelRegisterButton = document.getElementById('cancelRegister');
  
  // Elementos do suporte
  const supportFloat = document.getElementById('supportFloat');
  const supportModalOverlay = document.getElementById('supportModalOverlay');
  const supportForm = document.getElementById('supportForm');
  const closeSupportModal = document.getElementById('closeSupportModal');
  const cancelSupport = document.getElementById('cancelSupport');

  // --- 3. FUNÇÕES AUXILIARES ---
  const showModal = () => modalOverlay.classList.add('active');
  const hideModal = () => modalOverlay.classList.remove('active');
  const showSupportModal = () => supportModalOverlay.classList.add('active');
  const hideSupportModal = () => supportModalOverlay.classList.remove('active');

  // --- 4. EVENT LISTENERS PARA MODAIS ---
  openRegisterModal?.addEventListener('click', showModal);
  closeModalButton?.addEventListener('click', hideModal);
  cancelRegisterButton?.addEventListener('click', hideModal);
  
  // Event listeners para suporte
  supportFloat?.addEventListener('click', showSupportModal);
  closeSupportModal?.addEventListener('click', hideSupportModal);
  cancelSupport?.addEventListener('click', hideSupportModal);
  
  // Fechar modal clicando fora
  modalOverlay?.addEventListener('click', (e) => {
      if (e.target === modalOverlay) hideModal();
  });
  
  supportModalOverlay?.addEventListener('click', (e) => {
      if (e.target === supportModalOverlay) hideSupportModal();
  });

  // --- 5. LOGIN ---
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('senha').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        alert('Login realizado com sucesso!');
        window.location.href = '../home/index.html';
      } else {
        alert('Usuário ou senha inválidos.');
      }
    } catch (error) {
      alert(`Erro no login: ${error.message}`);
    }
  });

  // --- 6. CADASTRO ---
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regSenha').value;
    const confirmPassword = document.getElementById('regConfirmarSenha').value;
    const nome = document.getElementById('regNome').value;

    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            nome: nome
          }
        }
      });
      
      if (error) {
        // Tratamento de erros mais amigável
        if (error.message.includes('already registered')) {
          alert('Este e-mail já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be')) {
          alert('Senha muito fraca. Use pelo menos 6 caracteres com letras e números.');
        } else {
          alert(`Erro no cadastro: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer o login.');
        hideModal();
        registerForm.reset();
      }
    } catch (error) {
      alert(`Erro inesperado no cadastro: ${error.message}`);
    }
  });

  // --- 7. FORMULÁRIO DE SUPORTE ---
  supportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const supportData = {
      nome: document.getElementById('supportName').value,
      email: document.getElementById('supportEmail').value,
      tipo_problema: document.getElementById('supportType').value,
      mensagem: document.getElementById('supportMessage').value,
      data_criacao: new Date().toISOString(),
      status: 'pendente'
    };

    try {
      const { data, error } = await supabase
        .from('suporte')
        .insert([supportData]);

      if (error) throw error;

      alert('Solicitação de suporte enviada com sucesso! Nossa equipe entrará em contato em breve.');
      hideSupportModal();
      supportForm.reset();
      
    } catch (error) {
      console.error('Erro ao enviar suporte:', error);
      alert(`Erro ao enviar solicitação: ${error.message}`);
    }
  });

  // --- 8. ANIMAÇÃO DO ÍCONE DE SUPORTE ---
  // Adiciona uma pequena animação de "pulso" periodicamente
  if (supportFloat) {
    setInterval(() => {
      supportFloat.style.transform = 'scale(1.1)';
      setTimeout(() => {
        supportFloat.style.transform = 'scale(1)';
      }, 200);
    }, 5000); // A cada 5 segundos
  }

  // --- 9. VALIDAÇÃO EM TEMPO REAL ---
  // Validação de e-mail em tempo real
  const emailInputs = document.querySelectorAll('input[type="email"]');
  emailInputs.forEach(input => {
    input.addEventListener('blur', function() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (this.value && !emailRegex.test(this.value)) {
        this.style.borderColor = '#e53e3e';
        this.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
      } else {
        this.style.borderColor = '#e2e8f0';
        this.style.boxShadow = 'none';
      }
    });
  });

  // Validação de senha em tempo real
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  passwordInputs.forEach(input => {
    input.addEventListener('input', function() {
      if (this.id === 'regSenha') {
        const strength = this.value.length >= 6 ? 'forte' : 'fraca';
        // Você pode adicionar indicador visual de força da senha aqui
      }
      
      if (this.id === 'regConfirmarSenha') {
        const senha = document.getElementById('regSenha').value;
        if (this.value && this.value !== senha) {
          this.style.borderColor = '#e53e3e';
        } else {
          this.style.borderColor = '#e2e8f0';
        }
      }
    });
  });

  console.log('Script de login/cadastro/suporte carregado com sucesso!');

} catch (error) {
  console.error("Erro crítico no script:", error);
  alert("Ocorreu um erro crítico. Recarregue a página e tente novamente.");
}

