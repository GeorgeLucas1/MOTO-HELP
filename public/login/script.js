// =============== LANDING PAGE MODERNA - SCRIPT.JS ===============

try {
  // --- 1. INICIALIZAÇÃO DO SUPABASE ---
  const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // --- 2. ELEMENTOS DO DOM ---
  // Navbar
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.querySelector('.nav-menu');
  
  // Modais principais
  const modalOverlay = document.getElementById('modalOverlay');
  const supportModalOverlay = document.getElementById('supportModalOverlay');
  
  // Botões de abertura de modal
  const openLoginModal = document.getElementById('openLoginModal');
  const heroLoginBtn = document.getElementById('heroLoginBtn');
  const heroRegisterBtn = document.getElementById('heroRegisterBtn');
  
  // Botões de fechamento
  const closeModal = document.getElementById('closeModal');
  const closeSupportModal = document.getElementById('closeSupportModal');
  const cancelSupport = document.getElementById('cancelSupport');
  
  // Formulários
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const supportForm = document.getElementById('supportForm');
  
  // Toggle de autenticação
  const showLogin = document.getElementById('showLogin');
  const showRegister = document.getElementById('showRegister');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  
  // Suporte
  const supportFloat = document.getElementById('supportFloat');

  // --- 3. FUNÇÕES AUXILIARES ---
  const showModal = () => {
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  const hideModal = () => {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  };
  
  const showSupportModal = () => {
    supportModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  
  const hideSupportModal = () => {
    supportModalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  };

  const showLoginForm = () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    modalTitle.textContent = 'LOGIN';
    modalSubtitle.textContent = 'Acesse sua conta';
    showLogin.classList.add('active');
    showRegister.classList.remove('active');
  };

  const showRegisterForm = () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    modalTitle.textContent = 'CADASTRO';
    modalSubtitle.textContent = 'Crie sua conta para acessar todos os serviços';
    showRegister.classList.add('active');
    showLogin.classList.remove('active');
  };

  // --- 4. NAVBAR RESPONSIVA ---
  navToggle?.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    // Animação do hamburguer
    const spans = navToggle.querySelectorAll('span');
    if (navMenu.classList.contains('active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    }
  });

  // Fechar menu mobile ao clicar em link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      const spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = 'none';
      spans[1].style.opacity = '1';
      spans[2].style.transform = 'none';
    });
  });

  // --- 5. SCROLL NAVBAR ---
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(255, 255, 255, 0.98)';
      navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
      navbar.style.background = 'rgba(255, 255, 255, 0.95)';
      navbar.style.boxShadow = 'none';
    }
  });

  // --- 6. EVENT LISTENERS PARA MODAIS ---
  // Abrir modal de login
  openLoginModal?.addEventListener('click', () => {
    showLoginForm();
    showModal();
  });

  heroLoginBtn?.addEventListener('click', () => {
    showLoginForm();
    showModal();
  });

  // Abrir modal de cadastro
  heroRegisterBtn?.addEventListener('click', () => {
    showRegisterForm();
    showModal();
  });

  // Fechar modais
  closeModal?.addEventListener('click', hideModal);
  closeSupportModal?.addEventListener('click', hideSupportModal);
  cancelSupport?.addEventListener('click', hideSupportModal);

  // Toggle entre login e cadastro
  showLogin?.addEventListener('click', showLoginForm);
  showRegister?.addEventListener('click', showRegisterForm);

  // Suporte
  supportFloat?.addEventListener('click', showSupportModal);

  // Fechar modal clicando fora
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) hideModal();
  });

  supportModalOverlay?.addEventListener('click', (e) => {
    if (e.target === supportModalOverlay) hideSupportModal();
  });

  // Fechar modal com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
      hideSupportModal();
    }
  });

  // --- 7. LOGIN ---
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    submitBtn.disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('senha').value;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;

      if (data.user) {
        // Sucesso
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Sucesso!';
        submitBtn.style.background = '#48bb78';
        
        setTimeout(() => {
          alert('Login realizado com sucesso!');
          hideModal();
          loginForm.reset();
          // Redirecionar ou atualizar UI conforme necessário
           window.location.href = '../home/index.html';
        }, 1000);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Tratamento de erros mais amigável
      let errorMessage = 'Erro no login. Tente novamente.';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Confirme seu email antes de fazer login.';
      }
      
      alert(errorMessage);
      
      // Restaurar botão
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      submitBtn.style.background = '';
    }
  });

  // --- 8. CADASTRO ---
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regSenha').value;
    const confirmPassword = document.getElementById('regConfirmarSenha').value;
    const nome = document.getElementById('regNome').value;

    // Validações
    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
    submitBtn.disabled = true;

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
        
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        return;
      }

      if (data.user) {
        // Sucesso
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Cadastrado!';
        submitBtn.style.background = '#48bb78';
        
        setTimeout(() => {
          alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer o login.');
          hideModal();
          registerForm.reset();
          
          // Restaurar botão
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
          submitBtn.style.background = '';
        }, 1500);
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      alert(`Erro inesperado no cadastro: ${error.message}`);
      
      // Restaurar botão
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // --- 9. FORMULÁRIO DE SUPORTE ---
  supportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = supportForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    const supportData = {
      nome: document.getElementById('supportName').value,
      email: document.getElementById('supportEmail').value,
      tipo_problema: document.getElementById('supportType').value,
      mensagem: document.getElementById('supportMessage').value,
      data_criacao: new Date().toISOString(),
      status: 'pendente'
    };

    // Loading state
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;

    try {
      const { data, error } = await supabase
        .from('suporte')
        .insert([supportData]);

      if (error) throw error;

      // Sucesso
      submitBtn.innerHTML = '<i class="fas fa-check"></i> Enviado!';
      submitBtn.style.background = '#48bb78';
      
      setTimeout(() => {
        alert('Solicitação de suporte enviada com sucesso! Nossa equipe entrará em contato em breve.');
        hideSupportModal();
        supportForm.reset();
        
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        submitBtn.style.background = '';
      }, 1500);
      
    } catch (error) {
      console.error('Erro ao enviar suporte:', error);
      alert(`Erro ao enviar solicitação: ${error.message}`);
      
      // Restaurar botão
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // --- 10. VALIDAÇÃO EM TEMPO REAL ---
  // Validação de e-mail
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

  // Validação de senha
  const regSenha = document.getElementById('regSenha');
  const regConfirmarSenha = document.getElementById('regConfirmarSenha');

  regSenha?.addEventListener('input', function() {
    const strength = this.value.length >= 6 ? 'forte' : 'fraca';
    
    if (this.value.length > 0 && this.value.length < 6) {
      this.style.borderColor = '#f56565';
    } else if (this.value.length >= 6) {
      this.style.borderColor = '#48bb78';
    } else {
      this.style.borderColor = '#e2e8f0';
    }
  });

  regConfirmarSenha?.addEventListener('input', function() {
    const senha = regSenha.value;
    if (this.value && this.value !== senha) {
      this.style.borderColor = '#f56565';
    } else if (this.value && this.value === senha) {
      this.style.borderColor = '#48bb78';
    } else {
      this.style.borderColor = '#e2e8f0';
    }
  });

  // --- 11. SMOOTH SCROLLING PARA LINKS INTERNOS ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // --- 12. ANIMAÇÕES DE ENTRADA ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observar elementos para animação
  document.querySelectorAll('.feature, .service-card, .footer-section').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // --- 13. LOADING INICIAL ---
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });

  console.log('Landing Page Moderna carregada com sucesso! ✨');

} catch (error) {
  console.error("Erro crítico no script:", error);
  alert("Ocorreu um erro crítico. Recarregue a página e tente novamente.");
}
