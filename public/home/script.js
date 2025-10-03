// ===== CONFIGURAÇÃO DO SUPABASE =====
////const SUPABASE_URL = 'https://xyelsqywlwihbdgncilk.supabase.co';
//const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5ZWxzcXl3bHdpaGJkZ25jaWxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNDU3OTQsImV4cCI6MjA3MzYyMTc5NH0.0agkUvqX2EFL2zYbOW8crEwtmHd_WzZvuf-jzb2VkW8';
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ESTADO GLOBAL DA APLICAÇÃO =====
let currentUser = null;
let userProfile = null; // Armazenará o perfil da tabela 'profiles'
let userAnuncios = [];
let publicAnuncios = [];
let currentPage = 1;
let totalPages = 1;
let itemsPerPage = 6;

// ===== GERENCIAMENTO DE AUTENTICAÇÃO =====
class AuthManager {
    constructor() {
        this.checkUserSession();
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                this.handleUserSignIn(session);
            } else if (event === 'SIGNED_OUT') {
                this.handleUserSignOut();
            }
        });
    }

    async checkUserSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await this.handleUserSignIn(session);
        } else {
            this.handleUserSignOut();
        }
    }

    async handleUserSignIn(session) {
        currentUser = session.user;
        await this.fetchUserProfile();
        this.updateUIAfterLogin();
        if (anunciosManager) {
            anunciosManager.loadAnuncios();
        }
    }

    handleUserSignOut() {
        currentUser = null;
        userProfile = null;
        this.updateUIAfterLogout();
        // Opcional: redirecionar para a página de login se a página atual exigir autenticação
         if (document.body.classList.contains('protected-page')) {
         window.location.href = '../assets/public/login/index.html';
        // }
    }

    async fetchUserProfile() {
        if (!currentUser) return;
        try {
            const { data, error, status } = await supabase
                .from('profiles')
                .select(`*`)
                .eq('id', currentUser.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                userProfile = data;
            }
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
        }
    }

    updateUIAfterLogin() {
        const userDropdown = document.getElementById('userDropdown');
        const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
        const btnGerenciarBusiness = document.getElementById('btnGerenciarBusiness');

        if (userDropdown) userDropdown.style.display = 'block';

        if (userProfile) {
            userDropdownManager.updateUserInfo(userProfile);
            if (userProfile.is_partner) {
                if (btnGerenciarBusiness) btnGerenciarBusiness.style.display = 'inline-flex';
                if (btnAbrirModalCadastro) btnAbrirModalCadastro.style.display = 'none';
            } else {
                if (btnGerenciarBusiness) btnGerenciarBusiness.style.display = 'none';
                if (btnAbrirModalCadastro) btnAbrirModalCadastro.style.display = 'inline-flex';
            }
        } else {
             // Se não tem perfil, talvez seja um usuário novo
             if (btnGerenciarBusiness) btnGerenciarBusiness.style.display = 'none';
             if (btnAbrirModalCadastro) btnAbrirModalCadastro.style.display = 'inline-flex';
        }
    }

    updateUIAfterLogout() {
        const userDropdown = document.getElementById('userDropdown');
        const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
        const btnGerenciarBusiness = document.getElementById('btnGerenciarBusiness');

        if (userDropdown) userDropdown.style.display = 'none';
        if (btnAbrirModalCadastro) btnAbrirModalCadastro.style.display = 'none';
        if (btnGerenciarBusiness) btnGerenciarBusiness.style.display = 'none';
    }

    async logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            const { error } = await supabase.auth.signOut();
            if (error) {
                toastManager.show('Erro ao fazer logout', 'error');
                console.error('Logout error:', error);
            } else {
                toastManager.show('Você saiu com sucesso!', 'success');
                setTimeout(() => window.location.href = '../assets/public/login/index.html', 1000);
            }
        }
    }
}


// ===== GERENCIAMENTO DE MODAIS =====
class ModalManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupModalClosing();
  }

  bindEvents() {
    const btnCadastro = document.getElementById('btnAbrirModalCadastro');
    if (btnCadastro) {
      btnCadastro.addEventListener('click', () => this.openModal('modalCadastro'));
    }

    const btnGerenciarBusiness = document.getElementById('btnGerenciarBusiness');
    if (btnGerenciarBusiness) {
      btnGerenciarBusiness.addEventListener('click', () => this.openModal('modalAnuncios'));
    }

    const editProfileButton = document.getElementById('editProfileButton');
    if (editProfileButton) {
      editProfileButton.addEventListener('click', () => {
        this.closeDropdown();
        this.openModal('modalEditar');
      });
    }
    this.setupConditionalFields();
  }

  setupModalClosing() {
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close-modal')) {
        const modal = e.target.closest('.modal');
        if (modal) {
          this.closeModal(modal.id);
        }
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
          this.closeModal(activeModal.id);
        }
      }
    });
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      if (modalId === 'modalAnuncios') {
        anunciosManager.loadAnuncios();
      } else if (modalId === 'modalEditar') {
        this.loadUserDataForEdit();
      }
      
      setTimeout(() => {
        const firstInput = modal.querySelector('input, textarea, select');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => {
        modal.style.display = 'none';
        document.body.style.overflow = '';
      }, 250);
    }
  }

  closeDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }
  }

  loadUserDataForEdit() {
    if (userProfile) {
      document.getElementById('edit_email').value = userProfile.email || '';
      document.getElementById('edit_telefone').value = userProfile.phone || '';
      document.getElementById('cpf_cnpj_editar').value = userProfile.cpf_cnpj || '';
      document.getElementById('edit_endereco').value = userProfile.address || '';
      document.getElementById('edit_categoria').value = userProfile.category || '';
      
      const isEmpresa = !!userProfile.company_name;
      document.querySelector('#formEditar input[name="is_empresa"][value="' + (isEmpresa ? 'sim' : 'nao') + '"]').checked = true;
      const container = document.getElementById('edit_empresaFieldContainer');
      container.style.display = isEmpresa ? 'block' : 'none';
      document.getElementById('edit_nome_empresa').value = userProfile.company_name || '';
      document.getElementById('edit_nome_empresa').required = isEmpresa;
    }
  }

  setupConditionalFields() {
    const setup = (formId, containerId) => {
      const form = document.getElementById(formId);
      if (!form) return;

      const radios = form.querySelectorAll('input[name="is_empresa"]');
      const container = document.getElementById(containerId);
      const input = container ? container.querySelector('input') : null;

      radios.forEach(radio => {
        radio.addEventListener('change', () => {
          if (container) {
            const show = radio.value === 'sim' && radio.checked;
            container.style.display = show ? 'block' : 'none';
            if (input) input.required = show;
            if (!show && input) input.value = '';
          }
        });
      });
    };

    setup('formCadastro', 'empresaFieldContainer');
    setup('formEditar', 'edit_empresaFieldContainer');
  }
}

// ===== GERENCIAMENTO DE DROPDOWN DE USUÁRIO =====
class UserDropdownManager {
  constructor() {
    this.init();
  }

  init() {
    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuButton && userDropdown) {
      userMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });
      document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target)) {
          userDropdown.classList.remove('active');
        }
      });
    }
  }

  updateUserInfo(profile) {
    if (profile) {
      const userName = document.getElementById('userName');
      const userEmail = document.getElementById('userEmail');
      
      if (userName) {
        userName.textContent = profile.company_name || profile.email?.split('@')[0] || 'Usuário';
      }
      if (userEmail) {
        userEmail.textContent = profile.email || '';
      }
    }
  }
}

// ===== GERENCIAMENTO DE ANÚNCIOS PÚBLICOS =====
class PublicAnunciosManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadPublicAnuncios();
    this.bindSearchEvents();
  }

  bindSearchEvents() {
    const searchInput = document.getElementById('searchInput');
    const filterCheckboxes = document.querySelectorAll('input[name="filter"]');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterAndSearch());
    }
    filterCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.filterAndSearch());
    });
  }

  async loadPublicAnuncios(page = 1) {
    try {
      this.showLoadingState();
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;

      const { data, error, count } = await supabase
        .from('anuncios')
        .select(`
          *,
          profiles!inner(company_name, email)
        `, { count: 'exact' })
        .eq('status', 'ativo')
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      if (error) throw error;

      publicAnuncios = data || [];
      totalPages = Math.ceil(count / itemsPerPage);
      currentPage = page;

      this.renderPublicAnuncios();
      this.renderPagination();
      this.updateResultsCount(count);
      
    } catch (error) {
      console.error('Erro ao carregar anúncios públicos:', error);
      this.showEmptyState();
    }
  }

  renderPublicAnuncios() {
    const publicListings = document.getElementById('publicListings');
    const emptyState = document.getElementById('emptyState');
    const loadingState = document.getElementById('loadingState');
    
    if (!publicListings) return;

    if (loadingState) loadingState.style.display = 'none';
    if (publicAnuncios.length === 0) {
      this.showEmptyState();
      publicListings.innerHTML = '';
      return;
    }
    if(emptyState) emptyState.style.display = 'none';

    publicListings.innerHTML = '';
    publicAnuncios.forEach((anuncio, index) => {
      const anuncioCard = this.createPublicAnuncioCard(anuncio, index);
      publicListings.appendChild(anuncioCard);
    });
  }

  createPublicAnuncioCard(anuncio, index) {
    const card = document.createElement('div');
    card.className = 'public-anuncio-card';
    card.style.animationDelay = `${index * 100}ms`;

    const nomeEmpresa = anuncio.profiles?.company_name || 
                       anuncio.profiles?.email?.split('@')[0] || 
                       'Profissional Autônomo';

    const precoFormatado = anuncio.price ? 
      `R$ ${parseFloat(anuncio.price).toFixed(2).replace('.', ',')}` : 
      'Consulte';

    card.innerHTML = `
      <div class="public-anuncio-status ${anuncio.status}">${anuncio.status}</div>
      <div class="public-anuncio-header">
        <div class="public-anuncio-empresa">${nomeEmpresa}</div>
        <h3 class="public-anuncio-title">${anuncio.title}</h3>
        <span class="public-anuncio-categoria">
          <i class="fas fa-${anuncio.category === 'oficina' ? 'tools' : 'user-cog'}"></i>
          ${anuncio.category}
        </span>
      </div>
      <div class="public-anuncio-body">
        <p class="public-anuncio-description">${anuncio.description}</p>
        ${anuncio.services ? `
          <div class="public-anuncio-servicos">
            <div class="public-anuncio-servicos-title">Serviços Oferecidos</div>
            <div class="public-anuncio-servicos-list">${anuncio.services}</div>
          </div>
        ` : ''}
      </div>
      <div class="public-anuncio-footer">
        <div class="public-anuncio-preco">${precoFormatado}</div>
        ${anuncio.contact ? `
          <div class="public-anuncio-contato">
            <i class="fas fa-phone"></i>
            ${anuncio.contact}
          </div>
        ` : ''}
      </div>
    `;
    return card;
  }

  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    paginationHTML += `<button class="pagination-button" ${currentPage === 1 ? 'disabled' : ''} onclick="publicAnunciosManager.goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;

    if (startPage > 1) {
      paginationHTML += `<button class="pagination-button" onclick="publicAnunciosManager.goToPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button class="pagination-button ${i === currentPage ? 'active' : ''}" onclick="publicAnunciosManager.goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
      paginationHTML += `<button class="pagination-button" onclick="publicAnunciosManager.goToPage(${totalPages})">${totalPages}</button>`;
    }

    paginationHTML += `<button class="pagination-button" ${currentPage === totalPages ? 'disabled' : ''} onclick="publicAnunciosManager.goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    pagination.innerHTML = paginationHTML;
  }

  goToPage(page) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      this.loadPublicAnuncios(page);
      document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    }
  }

  showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    if (loadingState) loadingState.style.display = 'flex';
  }

  showEmptyState() {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.style.display = 'flex';
  }

  updateResultsCount(total) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = `${total} anúncio${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`;
    }
  }

  filterAndSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedCategories = Array.from(document.querySelectorAll('input[name="filter"]:checked')).map(cb => cb.value);

    // Re-carrega os anúncios públicos com os filtros aplicados
    this.loadPublicAnunciosFiltered(searchTerm, selectedCategories);
  }

  async loadPublicAnunciosFiltered(searchTerm, categories, page = 1) {
    try {
      this.showLoadingState();
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage - 1;

      let query = supabase
        .from('anuncios')
        .select(`
          *,
          profiles!inner(company_name, email)
        `, { count: 'exact' })
        .eq('status', 'ativo');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (categories && categories.length > 0) {
        query = query.in('category', categories);
      }

      const { data, error, count } = await query
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      if (error) throw error;

      publicAnuncios = data || [];
      totalPages = Math.ceil(count / itemsPerPage);
      currentPage = page;

      this.renderPublicAnuncios();
      this.renderPagination();
      this.updateResultsCount(count);
      
    } catch (error) {
      console.error('Erro ao carregar anúncios públicos filtrados:', error);
      this.showEmptyState();
    }
  }
}

// ===== GERENCIAMENTO DE ANÚNCIOS DO USUÁRIO =====
class AnunciosManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const btnNovoAnuncio = document.getElementById('btnNovoAnuncio');
    if (btnNovoAnuncio) {
      btnNovoAnuncio.addEventListener('click', () => this.openAnuncioModal());
    }
    const formAnuncio = document.getElementById('formAnuncio');
    if (formAnuncio) {
      formAnuncio.addEventListener('submit', (e) => this.handleAnuncioSubmit(e));
    }
  }

  async loadAnuncios() {
    if (!currentUser) {
      this.showEmptyState();
      return;
    }

    try {
      this.showLoadingState();
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      userAnuncios = data || [];
      this.renderAnuncios();
      this.updateStats();
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
      toastManager.show('Erro ao carregar seus anúncios', 'error');
      this.showEmptyState();
    }
  }

  renderAnuncios() {
    const anunciosList = document.getElementById('anunciosList');
    const emptyAnuncios = document.getElementById('emptyAnuncios');
    if (!anunciosList || !emptyAnuncios) return;

    if (userAnuncios.length === 0) {
      this.showEmptyState();
      return;
    }

    emptyAnuncios.style.display = 'none';
    anunciosList.innerHTML = '';
    userAnuncios.forEach(anuncio => {
      const anuncioCard = this.createAnuncioCard(anuncio);
      anunciosList.appendChild(anuncioCard);
    });
  }

  createAnuncioCard(anuncio) {
    const card = document.createElement('div');
    card.className = 'anuncio-card';
    card.innerHTML = `
      <div class="anuncio-card-header">
        <h4 class="anuncio-title">${anuncio.title}</h4>
        <span class="anuncio-status ${anuncio.status}">${anuncio.status}</span>
      </div>
      <div class="anuncio-meta">
        <span><i class="fas fa-tag"></i> ${anuncio.category}</span>
        ${anuncio.price ? `<span><i class="fas fa-dollar-sign"></i> R$ ${anuncio.price}</span>` : ''}
        <span><i class="fas fa-calendar"></i> ${new Date(anuncio.created_at).toLocaleDateString()}</span>
      </div>
      <p class="anuncio-description">${anuncio.description}</p>
      <div class="anuncio-actions">
        <button class="btn btn-sm btn-ghost" onclick="anunciosManager.editAnuncio(${anuncio.id})"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-sm btn-ghost" onclick="anunciosManager.toggleStatus(${anuncio.id})"><i class="fas fa-toggle-${anuncio.status === 'ativo' ? 'on' : 'off'}"></i> ${anuncio.status === 'ativo' ? 'Desativar' : 'Ativar'}</button>
        <button class="btn btn-sm btn-danger" onclick="anunciosManager.deleteAnuncio(${anuncio.id})"><i class="fas fa-trash"></i> Excluir</button>
      </div>
    `;
    return card;
  }

  showLoadingState() {
    const anunciosList = document.getElementById('anunciosList');
    if (anunciosList) {
      anunciosList.innerHTML = `<div class="loading-anuncios"><div class="loading-spinner"></div> Carregando...</div>`;
    }
  }

  showEmptyState() {
    const emptyAnuncios = document.getElementById('emptyAnuncios');
    if (emptyAnuncios) emptyAnuncios.style.display = 'block';
  }

  updateStats() {
    const totalAnuncios = document.getElementById('totalAnuncios');
    const anunciosAtivos = document.getElementById('anunciosAtivos');
    if (totalAnuncios) totalAnuncios.textContent = userAnuncios.length;
    if (anunciosAtivos) anunciosAtivos.textContent = userAnuncios.filter(a => a.status === 'ativo').length;
  }

  openAnuncioModal(anuncio = null) {
    const modal = document.getElementById('modalAnuncio');
    const modalTitle = document.getElementById('anuncioModalTitle');
    const form = document.getElementById('formAnuncio');
    
    if (anuncio) {
      modalTitle.textContent = 'Editar Anúncio';
      this.fillAnuncioForm(anuncio);
    } else {
      modalTitle.textContent = 'Novo Anúncio';
      form.reset();
      document.getElementById('anuncioId').value = '';
    }
    modalManager.openModal('modalAnuncio');
  }

  fillAnuncioForm(anuncio) {
    document.getElementById('anuncioId').value = anuncio.id;
    document.getElementById('tituloAnuncio').value = anuncio.title;
    document.getElementById('descricaoAnuncio').value = anuncio.description;
    document.getElementById('categoriaAnuncio').value = anuncio.category;
    document.getElementById('precoAnuncio').value = anuncio.price || '';
    document.getElementById('servicosAnuncio').value = anuncio.services || '';
    document.getElementById('contatoAnuncio').value = anuncio.contact || '';
    const statusRadio = document.querySelector(`input[name="status"][value="${anuncio.status}"]`);
    if (statusRadio) statusRadio.checked = true;
  }

  async handleAnuncioSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
      toastManager.show('Você precisa estar logado para isso', 'error');
      return;
    }

    const formData = new FormData(e.target);
    const anuncioData = {
      title: formData.get('titulo'),
      description: formData.get('descricao'),
      category: formData.get('categoria'),
      price: formData.get('preco') || null,
      services: formData.get('servicos'),
      contact: formData.get('contato'),
      status: formData.get('status'),
      user_id: currentUser.id
    };

    const anuncioId = formData.get('id');
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
      const { error } = anuncioId
        ? await supabase.from('anuncios').update(anuncioData).eq('id', anuncioId)
        : await supabase.from('anuncios').insert([anuncioData]);

      if (error) throw error;

      toastManager.show(`Anúncio ${anuncioId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
      modalManager.closeModal('modalAnuncio');
      this.loadAnuncios();
      publicAnunciosManager.loadPublicAnuncios(); // Atualiza a lista pública
    } catch (error) {
      console.error('Erro ao salvar anúncio:', error);
      toastManager.show('Erro ao salvar anúncio', 'error');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }

  async editAnuncio(id) {
    const anuncio = userAnuncios.find(a => a.id === id);
    if (anuncio) this.openAnuncioModal(anuncio);
  }

  async toggleStatus(id) {
    const anuncio = userAnuncios.find(a => a.id === id);
    if (!anuncio) return;

    const newStatus = anuncio.status === 'ativo' ? 'inativo' : 'ativo';
    try {
      const { error } = await supabase.from('anuncios').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toastManager.show(`Anúncio ${newStatus === 'ativo' ? 'ativado' : 'desativado'}!`, 'success');
      this.loadAnuncios();
      publicAnunciosManager.loadPublicAnuncios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toastManager.show('Erro ao alterar status', 'error');
    }
  }

  async deleteAnuncio(id) {
    if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
    try {
      const { error } = await supabase.from('anuncios').delete().eq('id', id);
      if (error) throw error;
      toastManager.show('Anúncio excluído com sucesso!', 'success');
      this.loadAnuncios();
      publicAnunciosManager.loadPublicAnuncios();
    } catch (error) {
      console.error('Erro ao excluir anúncio:', error);
      toastManager.show('Erro ao excluir anúncio', 'error');
    }
  }
}

// ===== GERENCIAMENTO DE TOAST NOTIFICATIONS =====
class ToastManager {
  show(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || this.createContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${iconMap[type]}"></i><p>${message}</p><button class="toast-close">&times;</button>`;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
    setTimeout(() => this.remove(toast), duration);
  }
  createContainer() {
      const container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
      return container;
  }
  remove(toast) {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }
}

// ===== GERENCIAMENTO DE FORMULÁRIOS =====
class FormManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupFormSubmission();
    this.setupInputMasks();
  }

  setupFormSubmission() {
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
      formCadastro.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handlePartnerFormSubmit(formCadastro);
      });
    }

    const formEditar = document.getElementById('formEditar');
    if (formEditar) {
      formEditar.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleEditFormSubmit(formEditar);
      });
    }
  }

  async handlePartnerFormSubmit(form) {
      if (!currentUser) {
          toastManager.show('Você precisa estar logado para se tornar um parceiro.', 'error');
          return;
      }
      const formData = new FormData(form);
      const profileData = {
          phone: formData.get('telefone'),
          cpf_cnpj: formData.get('cpf_cnpj'),
          address: formData.get('endereco'),
          category: formData.get('categoria'),
          company_name: formData.get('is_empresa') === 'sim' ? formData.get('nome_empresa') : null,
          is_partner: true
      };

      const { error } = await supabase.from('profiles').update(profileData).eq('id', currentUser.id);

      if (error) {
          toastManager.show('Erro ao se tornar parceiro.', 'error');
          console.error(error);
      } else {
          toastManager.show('Parabéns, você agora é um parceiro!', 'success');
          await authManager.fetchUserProfile(); // Re-busca o perfil
          authManager.updateUIAfterLogin(); // Atualiza a UI
          modalManager.closeModal('modalCadastro');
      }
  }

  async handleEditFormSubmit(form) {
      if (!currentUser) {
          toastManager.show('Você precisa estar logado para editar.', 'error');
          return;
      }
      const formData = new FormData(form);
      const profileData = {
          phone: formData.get('edit_telefone'),
          cpf_cnpj: formData.get('cpf_cnpj_editar'),
          address: formData.get('edit_endereco'),
          category: formData.get('edit_categoria'),
          company_name: formData.get('is_empresa') === 'sim' ? formData.get('nome_empresa') : null,
      };

      const { error } = await supabase.from('profiles').update(profileData).eq('id', currentUser.id);

      if (error) {
          toastManager.show('Erro ao atualizar perfil.', 'error');
          console.error(error);
      } else {
          toastManager.show('Perfil atualizado com sucesso!', 'success');
          await authManager.fetchUserProfile();
          authManager.updateUIAfterLogin();
          modalManager.closeModal('modalEditar');
      }
  }

  setupInputMasks() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
        e.target.value = value.slice(0, 15);
      });
    });

    const cpfCnpjInputs = document.querySelectorAll('input[name*="cpf_cnpj"]');
    cpfCnpjInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
          value = value.replace(/^(\d{2})(\d)/, '$1.$2');
          value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
          value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
          value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }
        e.target.value = value.slice(0, 18);
      });
    });
  }
}

// ===== INSTÂNCIAS GLOBAIS =====
let authManager;
let modalManager;
let userDropdownManager;
let publicAnunciosManager;
let anunciosManager;
let formManager;
let toastManager;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  authManager = new AuthManager();
  modalManager = new ModalManager();
  userDropdownManager = new UserDropdownManager();
  publicAnunciosManager = new PublicAnunciosManager();
  anunciosManager = new AnunciosManager();
  formManager = new FormManager();
  toastManager = new ToastManager();

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => authManager.logout());
  }

  const excluirContaLink = document.getElementById('excluirContaLink');
  if (excluirContaLink) {
    excluirContaLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
        if (currentUser) {
            // Idealmente, isso deveria chamar uma função de Edge do Supabase para deletar o usuário do 'auth.users'
            const { error } = await supabase.from('profiles').delete().eq('id', currentUser.id);
            if (error) {
                toastManager.show('Erro ao excluir conta.', 'error');
                console.error('Delete error:', error);
            } else {
                toastManager.show('Conta excluída com sucesso.', 'success');
                await supabase.auth.signOut(); // Força o logout
            }
        }
      }
    });
  }

  if (!supabase) {
    console.warn('Supabase não configurado.');
    toastManager.show('Erro na configuração do Supabase', 'error', 5000);
  }
});

