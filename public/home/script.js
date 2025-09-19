//=============== ARQUIVO: home/script.js ===============
// (Código 100% completo e funcional)

document.addEventListener('DOMContentLoaded', async () => {
  // --- 1. CONFIGURAÇÃO E AUTENTICAÇÃO ---
  const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

  let currentUser = null;
  let userAnuncio = null;
  let todosAnuncios = [];

  // Verifica a sessão do usuário
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
      alert('Você precisa estar logado para acessar esta página.');
      window.location.href = '../login/index.html';
      return;
  }
  currentUser = session.user;
  console.log('Usuário autenticado:', currentUser.email);

  // --- 2. REFERÊNCIAS AOS ELEMENTOS DO DOM ---
  const listingsContainer = document.getElementById('listingsContainer');
  const searchInput = document.getElementById('searchInput');
  const filterCheckboxes = document.querySelectorAll('input[name="filter"]');
  const logoutButton = document.getElementById('logoutButton');

  // Modais
  const modalCadastro = document.getElementById('modalCadastro');
  const modalEditar = document.getElementById('modalEditar');
  const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
  const btnMeuPerfil = document.getElementById('meuPerfil');
  const closeButtons = document.querySelectorAll('.close-btn');

  // Formulários
  const formCadastro = document.getElementById('formCadastro');
  const formEditar = document.getElementById('formEditar');
  const excluirContaLink = document.getElementById('excluirContaLink');

  // --- 3. FUNÇÕES PRINCIPAIS ---

  // Função para buscar todos os anúncios e o anúncio do usuário logado
  async function fetchData() {
      // Busca todos os anúncios
      const { data: anunciosData, error: anunciosError } = await supabase
          .from('anuncios')
          .select('*');
      if (anunciosError) {
          console.error('Erro ao buscar anúncios:', anunciosError);
          return;
      }
      todosAnuncios = anunciosData;

      // Busca o anúncio específico do usuário logado
      const { data: userAnuncioData, error: userAnuncioError } = await supabase
          .from('anuncios')
          .select('*')
          .eq('user_id', currentUser.id)
          .single(); // .single() espera um único resultado

      if (userAnuncioError && userAnuncioError.code !== 'PGRST116') { // PGRST116 = "not a single row"
          console.error('Erro ao buscar anúncio do usuário:', userAnuncioError);
      }
      userAnuncio = userAnuncioData;

      // Atualiza a UI
      renderAnuncios();
      updateUIForUserAnuncio();
  }

  // Função para renderizar os anúncios na tela
  function renderAnuncios() {
      const searchTerm = searchInput.value.toLowerCase();
      const activeFilters = Array.from(filterCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);

      const anunciosFiltrados = todosAnuncios.filter(anuncio => {
          const matchesSearch =
              anuncio.nome_empresa?.toLowerCase().includes(searchTerm) ||
              anuncio.categoria.toLowerCase().includes(searchTerm) ||
              anuncio.endereco.toLowerCase().includes(searchTerm);

          const matchesFilter = activeFilters.length === 0 || activeFilters.includes(anuncio.categoria);

          return matchesSearch && matchesFilter;
      });

      listingsContainer.innerHTML = '';
      if (anunciosFiltrados.length === 0) {
          listingsContainer.innerHTML = '<p>Nenhum anúncio encontrado.</p>';
          return;
      }

      anunciosFiltrados.forEach(anuncio => {
          const card = document.createElement('div');
          card.className = 'listing-card';
          card.innerHTML = `
              <div class="card-header">
                  <h3 class="card-title">${anuncio.nome_empresa || 'Profissional Autônomo'}</h3>
                  <span class="card-category ${anuncio.categoria}">${anuncio.categoria}</span>
              </div>
              <div class="card-body">
                  <p><i class="fa-solid fa-location-dot"></i> ${anuncio.endereco}</p>
                  <p><i class="fa-solid fa-phone"></i> ${anuncio.telefone}</p>
                  <p><i class="fa-solid fa-envelope"></i> ${anuncio.email}</p>
              </div>
          `;
          listingsContainer.appendChild(card);
      });
  }

  // Atualiza a UI com base na existência de um anúncio do usuário
  function updateUIForUserAnuncio() {
      if (userAnuncio) {
          btnAbrirModalCadastro.style.display = 'none'; // Esconde "SEJA UM PARCEIRO"
          btnMeuPerfil.style.display = 'block'; // Mostra "Meu Perfil"
      } else {
          btnAbrirModalCadastro.style.display = 'block';
          btnMeuPerfil.style.display = 'none';
      }
  }

  // --- 4. GERENCIAMENTO DE MODAIS ---
  function openModal(modal) {
      modal.style.display = 'flex';
  }

  function closeModal(modal) {
      modal.style.display = 'none';
  }

  btnAbrirModalCadastro.addEventListener('click', () => openModal(modalCadastro));
  btnMeuPerfil.addEventListener('click', () => {
      if (!userAnuncio) {
          alert('Dados do anúncio não encontrados.');
          return;
      }
      // Preenche o formulário de edição com os dados atuais
      document.getElementById('edit_nome_empresa').value = userAnuncio.nome_empresa || '';
      document.getElementById('edit_email').value = userAnuncio.email;
      document.getElementById('edit_telefone').value = userAnuncio.telefone;
      document.getElementById('cpf_cnpj_editar').value = userAnuncio.cpf_cnpj;
      document.getElementById('edit_endereco').value = userAnuncio.endereco;
      document.getElementById('edit_categoria').value = userAnuncio.categoria;
      const isEmpresaRadio = document.querySelector(`input[name="is_empresa"][value="${userAnuncio.is_empresa ? 'sim' : 'nao'}"]`);
      if(isEmpresaRadio) isEmpresaRadio.checked = true;
      
      openModal(modalEditar);
  });

  closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
          closeModal(e.target.closest('.modal, .modalEditar'));
      });
  });

  // --- 5. MANIPULADORES DE EVENTOS (FORMS, FILTROS, LOGOUT) ---

  // Logout
  logoutButton.addEventListener('click', async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
          alert('Erro ao fazer logout.');
      } else {
          window.location.href = '../login/index.html';
      }
  });

  // Filtros e busca
  searchInput.addEventListener('input', renderAnuncios);
  filterCheckboxes.forEach(cb => cb.addEventListener('change', renderAnuncios));

  // Formulário de Cadastro de Anúncio
  formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(formCadastro);
      const isEmpresa = formData.get('is_empresa') === 'sim';

      const anuncioData = {
          user_id: currentUser.id,
          is_empresa: isEmpresa,
          nome_empresa: isEmpresa ? formData.get('nome_empresa') : null,
          email: formData.get('email'),
          telefone: formData.get('telefone'),
          cpf_cnpj: formData.get('cpf_cnpj'),
          endereco: formData.get('endereco'),
          categoria: formData.get('categoria'),
      };

      const { error } = await supabase.from('anuncios').insert(anuncioData);

      if (error) {
          console.error('Erro ao cadastrar anúncio:', error);
          alert(`Erro ao cadastrar: ${error.message}`);
      } else {
          alert('Anúncio cadastrado com sucesso!');
          closeModal(modalCadastro);
          formCadastro.reset();
          await fetchData(); // Recarrega os dados
      }
  });

  // Formulário de Edição de Anúncio
  formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(formEditar);
      const isEmpresa = formData.get('is_empresa') === 'sim';

      const updatedData = {
          is_empresa: isEmpresa,
          nome_empresa: isEmpresa ? formData.get('nome_empresa') : null,
          email: formData.get('email'),
          telefone: formData.get('telefone'),
          cpf_cnpj: formData.get('cpf_cnpj_editar'),
          endereco: formData.get('endereco'),
          categoria: formData.get('categoria'),
      };

      const { error } = await supabase
          .from('anuncios')
          .update(updatedData)
          .eq('user_id', currentUser.id);

      if (error) {
          console.error('Erro ao atualizar anúncio:', error);
          alert(`Erro ao atualizar: ${error.message}`);
      } else {
          alert('Dados atualizados com sucesso!');
          closeModal(modalEditar);
          await fetchData(); // Recarrega os dados
      }
  });

  // Excluir Conta/Anúncio
  excluirContaLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!confirm('Tem certeza que deseja excluir seu anúncio? Esta ação não pode ser desfeita.')) {
          return;
      }

      const { error } = await supabase
          .from('anuncios')
          .delete()
          .eq('user_id', currentUser.id);

      if (error) {
          console.error('Erro ao excluir anúncio:', error);
          alert(`Erro ao excluir: ${error.message}`);
      } else {
          alert('Anúncio excluído com sucesso.');
          closeModal(modalEditar);
          await fetchData(); // Recarrega os dados
      }
  });
  
  // Lógica para mostrar/esconder campo "Nome da Empresa"
  document.querySelectorAll('input[name="is_empresa"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
          const form = e.target.closest('form');
          const container = form.id === 'formCadastro' 
              ? document.getElementById('empresaFieldContainer') 
              : document.getElementById('edit_empresaFieldContainer');
          
          if (e.target.value === 'sim') {
              container.style.display = 'block';
              container.querySelector('input').required = true;
          } else {
              container.style.display = 'none';
              container.querySelector('input').required = false;
          }
      });
  });


  // --- 6. INICIALIZAÇÃO ---
  await fetchData();
});
