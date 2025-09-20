//=============== ARQUIVO: login/script.js ===============
// (Nenhuma alteração necessária, código pronto para uso)

document.addEventListener('DOMContentLoaded', () => {
    // --- Supabase Client Initialization ---
    const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

    // --- DOM Element References ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const openRegisterModal = document.getElementById('openRegisterModal');
    const closeModal = document.getElementById('closeModal');
    const cancelRegister = document.getElementById('cancelRegister');
    const modalOverlay = document.getElementById('modalOverlay');

    // --- Modal Handling ---
    const openModal = () => {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModalFunction = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        registerForm.reset();
    };

    openRegisterModal.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalFunction);
    cancelRegister.addEventListener('click', closeModalFunction);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModalFunction();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModalFunction();
    });

    // --- Login Form Handler ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('senha').value;

        if (!email || !password) {
            alert('Por favor, preencha o email e a senha.');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            if (data.user) {
                alert('Login realizado com sucesso!');
                window.location.href = '../home/index.html';
            } else {
                alert('Nenhum usuário encontrado com essas credenciais.');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            alert(`Erro no login: ${error.message}`);
        }
    });

    // --- Register Form Handler ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('regNome').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regSenha').value;
        const confirmarSenha = document.getElementById('regConfirmarSenha').value;

        if (!nome || !email || !password || !confirmarSenha) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        if (password !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: nome } }
            });

            if (error) throw error;

            if (data.user) {
                alert('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta antes de fazer o login.');
                closeModalFunction();
            }
        } catch (error) {
            console.error('Erro no cadastro:', error);
            alert(`Erro no cadastro: ${error.message}`);
        }
    });
});

const firebaseConfig = { 
  apiKey: "AIzaSyCVfkVtnPU_YRGjCyoJAamPXgjB60avEyk",
  authDomain: "motohelp-c808b.firebaseapp.com",
  databaseURL: "https://motohelp-c808b-default-rtdb.firebaseio.com",
  projectId: "motohelp-c808b",
  storageBucket: "motohelp-c808b.firebasestorage.app",
  messagingSenderId: "338786673596",
  appId: "1:338786673596:web:7f58297d48f7392b4381b9",
  measurementId: "G-D76C6EV586"
};
firebase.initializeApp(firebaseConfig);

// --- 2. LÓGICA DE AUTENTICAÇÃO ---
const googleLoginButton = document.getElementById('googleLoginButton');

googleLoginButton.addEventListener('click', async () => {
  try {
    // Passo 1: Fazer login com Google
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    console.log('Abrindo pop-up de login do Google...');
    const { user: firebaseUser } = await auth.signInWithPopup(googleProvider);

    if (!firebaseUser) {
      throw new Error('Login com Google falhou. Nenhum usuário retornado.');
    }

    console.log('Login com Google (Firebase) bem-sucedido:', firebaseUser.displayName);

    // Passo 2: Obter token JWT do Firebase
    console.log('Obtendo token JWT do Firebase...');
    const firebaseToken = await firebaseUser.getIdToken();

    // Passo 3: Login no Supabase usando o token
    console.log('Autenticando no Supabase com o token...');
    const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
      provider: 'firebase',
      token: firebaseToken,
    });

    if (supabaseError) {
      throw supabaseError;
    }

    console.log('Login no Supabase bem-sucedido!', data.user.email);
    alert('Login realizado com sucesso! Redirecionando...');
    
    // Passo 4: Redirecionar
    window.location.href = '/home.html';

  } catch (error) {
    console.error('Erro durante o login:', error);
    alert(`Erro no login: ${error.message}`);
  }
});

// --- 3. Manter sessão se recarregar a página ---
firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const firebaseToken = await user.getIdToken();
      await supabase.auth.signInWithIdToken({
        provider: 'firebase',
        token: firebaseToken,
      });
    }
  }
});
