//=============== ARQUIVO: login/script.js (VERSÃO CORRETA E LIMPA) ===============

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. INICIALIZAÇÃO DOS SERVIÇOS ---

  // Configuração do Supabase
  const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

  // Configuração do Firebase
  const firebaseConfig = {
      apiKey: "AIzaSyCVfkVtnPU_YRGjCyoJAamPXgjB60avEyk",
      authDomain: "motohelp-c808b.firebaseapp.com",
      projectId: "motohelp-c808b",
      storageBucket: "motohelp-c808b.appspot.com", // Corrigido para o domínio correto do storage
      messagingSenderId: "338786673596",
      appId: "1:338786673596:web:7f58297d48f7392b4381b9"
  };
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // --- 2. REFERÊNCIAS DO DOM ---
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const googleLoginButton = document.getElementById('googleLoginButton');
  
  // Assumindo que você tem um botão para abrir o modal de cadastro
  const openRegisterModal = document.getElementById('openRegisterModal');
  if(openRegisterModal) {
      openRegisterModal.addEventListener('click', () => {
          // Adicione sua lógica para mostrar o modal de cadastro
          document.getElementById('modalOverlay').classList.add('active');
      });
  }


  // --- 3. FUNÇÃO CENTRAL DE LOGIN NO SUPABASE ---
  async function signInToSupabase(firebaseUser) {
      try {
          const firebaseToken = await firebaseUser.getIdToken();
          const { error } = await supabase.auth.signInWithIdToken({
              provider: 'firebase',
              token: firebaseToken,
          });
          if (error) throw error;
          
          console.log('Sessão do Supabase sincronizada com sucesso!');
          window.location.href = '../home/index.html'; // Redireciona para a home
      } catch (error) {
          console.error('Erro ao sincronizar com Supabase:', error);
          alert(`Erro crítico ao acessar o serviço: ${error.message}`);
      }
  }

  // --- 4. MANIPULADORES DE EVENTOS (HANDLERS) ---

  // Login com E-mail/Senha via Firebase
  if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('senha').value;
          try {
              const { user } = await auth.signInWithEmailAndPassword(email, password);
              alert('Login (Firebase) bem-sucedido! Sincronizando...');
              await signInToSupabase(user);
          } catch (error) {
              alert(`Erro no login: ${error.message}`);
          }
      });
  }

  // Cadastro com E-mail/Senha via Firebase
  if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('regEmail').value;
          const password = document.getElementById('regSenha').value;
          try {
              const { user } = await auth.createUserWithEmailAndPassword(email, password);
              alert('Cadastro (Firebase) bem-sucedido! Sincronizando...');
              await signInToSupabase(user);
          } catch (error) {
              alert(`Erro no cadastro: ${error.message}`);
          }
      });
  }

  // Login com Google via Firebase
  if (googleLoginButton) {
      googleLoginButton.addEventListener('click', async () => {
          const googleProvider = new firebase.auth.GoogleAuthProvider();
          try {
              const { user } = await auth.signInWithPopup(googleProvider);
              alert('Login com Google (Firebase) bem-sucedido! Sincronizando...');
              await signInToSupabase(user);
          } catch (error) {
              // Não mostra o alerta se o usuário simplesmente fechou o pop-up
              if (error.code !== 'auth/popup-closed-by-user') {
                  alert(`Erro no login com Google: ${error.message}`);
              }
          }
      });
  }
});
