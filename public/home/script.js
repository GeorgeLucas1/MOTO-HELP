// ===== CONFIGURAÇÃO DO SUPABASE =====
// --- 1. INICIALIZAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://oeuabuswavmlwquaujji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldWFidXN3YXZtbHdxdWF1amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDUyNjEsImV4cCI6MjA3NTAyMTI2MX0.jc0o-FLPNYLak1kU3b_1r8jns0yuGZnJ8W2Mlz36t9Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ESTADO GLOBAL DA APLICAÇÃO =====
let currentUser = null;
let userProfile = null;
let publicAnuncios = []; // Armazena todos os anúncios para filtragem no cliente
let userAnuncios = []; // Armazena anúncios locais do usuário
let currentPage = 1;
const itemsPerPage = 6;
let totalPages = 20;
let searchDebounceTimer;

// ===== GERENCIADOR DE NOTIFICAÇÕES (TOASTS) =====
class ToastManager {
    constructor() { this.container = this.createContainer(); }
    createContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    show(message, type = 'info', duration = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        toast.innerHTML = `<i class="fas ${iconMap[type]}"></i><p>${message}</p><button class="toast-close">&times;</button>`;
        this.container.appendChild(toast);
        toast.querySelector('.toast-close').addEventListener('click', () => this.remove(toast));
        setTimeout(() => this.remove(toast), duration);
    }
    remove(toast) {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => toast.remove());
    }
}

// ===== GERENCIADOR DE AUTENTICAÇÃO =====
class AuthManager {
    constructor() {
        this.checkUserSession();
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') this.handleUserSignIn(session);
            else if (event === 'SIGNED_OUT') this.handleUserSignOut();
        });
    }
    async checkUserSession() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await this.handleUserSignIn(session, false); // Não mostrar saudação no carregamento inicial
        else this.handleUserSignOut();
    }
    async handleUserSignIn(session, showGreeting = true) {
        currentUser = session.user;
        await this.fetchUserProfile();
        this.updateUI();

        if (showGreeting) {
            const displayName = currentUser?.user_metadata?.display_name || userProfile?.company_name || currentUser?.email?.split('@')[0] || 'Usuário';
            const horaAtual = new Date().getHours();
            let saudacao;
            if (horaAtual >= 5 && horaAtual < 12) saudacao = 'Bom dia';
            else if (horaAtual >= 12 && horaAtual < 18) saudacao = 'Boa tarde';
            else saudacao = 'Boa noite';
            setTimeout(() => {
                alert(`${saudacao}, ${displayName}! Bem-vindo(a) de volta.`);
            }, 100);
        }
    }
    handleUserSignOut() {
        currentUser = null;
        userProfile = null;
        this.updateUI();
        window.location.reload();
    }
    async fetchUserProfile() {
        if (!currentUser) return;
        try {
            const { data, error, status } = await supabase.from('profiles').select(`*`).eq('id', currentUser.id).single();
            if (error && status !== 406) throw error;
            userProfile = data;
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
            userProfile = null;
        }
    }
    updateUI() {
        const userDropdown = document.getElementById('userDropdown');
        const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
        const btnGerenciarBusiness = document.getElementById('btnGerenciarBusiness');

        if (currentUser) { // Apenas checar se existe um usuário logado
            userDropdown.style.display = 'block';
            userDropdownManager.updateUserInfo(userProfile || { email: currentUser.email });

            // Modificado: Botão Gerenciar Business aparece para todos os usuários logados
            // pois os anúncios agora são gerenciados localmente
            btnGerenciarBusiness.style.display = 'inline-flex';
            
            // Botão de cadastro de parceiro só aparece se ainda não for parceiro
            if (userProfile && userProfile.is_partner === true) {
                btnAbrirModalCadastro.style.display = 'none';
            } else {
                btnAbrirModalCadastro.style.display = 'inline-flex';
            }
        } else {
            userDropdown.style.display = 'none';
            btnGerenciarBusiness.style.display = 'none';
            btnAbrirModalCadastro.style.display = 'inline-flex';
        }
    }
    
    async logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            const { error } = await supabase.auth.signOut();
            if (error) {
                toastManager.show('Erro ao fazer logout.', 'error');
            } else {
                toastManager.show('Você saiu com sucesso!', 'success');
            }
        }
    }
}

// ===== GERENCIADOR DO DROPDOWN DE USUÁRIO =====
class UserDropdownManager {
    constructor() { this.init(); }
    init() {
        const userMenuButton = document.getElementById('userMenuButton');
        const userDropdown = document.getElementById('userDropdown');
        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });
            document.addEventListener('click', (e) => {
                if (!userDropdown.contains(e.target)) userDropdown.classList.remove('active');
            });
        }
    }
    updateUserInfo(profile) {
        if (!profile) return;
        const displayName = profile.company_name || currentUser?.user_metadata?.display_name || profile.email?.split('@')[0] || 'Usuário';
        document.getElementById('userName').textContent = displayName;
    }
}

// ===== GERENCIADOR DE MODAIS =====
class ModalManager {
    constructor() { this.init(); }
    init() {
        document.getElementById('btnAbrirModalCadastro')?.addEventListener('click', () => {
            if (currentUser) this.openModal('modalCadastro');
            else {
                toastManager.show('Você precisa fazer login para se tornar um parceiro.', 'info');
                setTimeout(() => { window.location.href = '/public/login/index.html'; }, 2000);
            }
        });
        document.getElementById('btnGerenciarBusiness')?.addEventListener('click', () => this.openModal('modalAnuncios'));
        document.getElementById('editProfileButton')?.addEventListener('click', () => {
            document.getElementById('userDropdown')?.classList.remove('active');
            this.openModal('modalEditar');
        });
        document.getElementById('btnNovoAnuncio')?.addEventListener('click', () => anunciosManager.openAnuncioModal());
        document.getElementById('btnPrimeiroAnuncio')?.addEventListener('click', () => anunciosManager.openAnuncioModal());

        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) this.closeModal(modal.id);
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) this.closeModal(activeModal.id);
            }
        });
    }
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => modal.classList.add('active'), 10);

        if (modalId === 'modalAnuncios') anunciosManager.loadAnuncios();
        if (modalId === 'modalEditar') formManager.loadUserDataForEdit();
    }
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        modal.addEventListener('transitionend', () => {
            modal.style.display = 'none';
            if (!document.querySelector('.modal.active')) document.body.style.overflow = '';
        }, { once: true });
    }
}

// ===== GERENCIADOR DE FORMULÁRIOS =====
class FormManager {
    constructor() { this.init(); }
    init() {
        document.getElementById('formCadastro')?.addEventListener('submit', (e) => this.handlePartnerFormSubmit(e));
        document.getElementById('formEditar')?.addEventListener('submit', (e) => this.handleEditFormSubmit(e));
        this.setupConditionalField('formCadastro', 'is_empresa', 'empresaFieldContainer');
        this.setupConditionalField('formEditar', 'is_empresa', 'edit_empresaFieldContainer');
        this.setupInputMasks();
    }
    setupConditionalField(formId, radioName, containerId) {
        const form = document.getElementById(formId);
        if (!form) return;
        const radios = form.querySelectorAll(`input[name="${radioName}"]`);
        const container = document.getElementById(containerId);
        const input = container?.querySelector('input, textarea, select');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (container && input) {
                    const show = radio.value === 'sim' && radio.checked;
                    container.style.display = show ? 'block' : 'none';
                    input.required = show;
                    if (!show) input.value = '';
                }
            });
        });
    }
    async handlePartnerFormSubmit(event) {
        event.preventDefault();
        if (!currentUser) {
            toastManager.show('Você precisa estar logado para se tornar um parceiro.', 'error');
            return;
        }
        const form = event.target;
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
            toastManager.show('Erro ao se tornar parceiro. Verifique os dados.', 'error');
            console.error(error);
        } else {
            toastManager.show('Parabéns, você agora é um parceiro!', 'success');
            await authManager.fetchUserProfile();
            authManager.updateUI();
            modalManager.closeModal('modalCadastro');
        }
    }
    async handleEditFormSubmit(event) {
        event.preventDefault();
        if (!currentUser) {
            toastManager.show('Sessão expirada. Faça login novamente.', 'error');
            return;
        }
        const form = event.target;
        const formData = new FormData(form);
        const profileData = {
            phone: formData.get('telefone'),
            cpf_cnpj: formData.get('cpf_cnpj_editar'),
            address: formData.get('endereco'),
            category: formData.get('categoria'),
            company_name: formData.get('is_empresa') === 'sim' ? formData.get('edit_nome_empresa') : null,
        };
        const { error } = await supabase.from('profiles').update(profileData).eq('id', currentUser.id);
        if (error) {
            toastManager.show('Erro ao atualizar o perfil.', 'error');
            console.error(error);
        } else {
            toastManager.show('Perfil atualizado com sucesso!', 'success');
            await authManager.fetchUserProfile();
            authManager.updateUI();
            modalManager.closeModal('modalEditar');
        }
    }
    loadUserDataForEdit() {
        if (!userProfile) return;
        document.getElementById('edit_telefone').value = userProfile.phone || '';
        document.getElementById('cpf_cnpj_editar').value = userProfile.cpf_cnpj || '';
        document.getElementById('edit_endereco').value = userProfile.address || '';
        document.getElementById('edit_categoria').value = userProfile.category || '';
        const isEmpresa = !!userProfile.company_name;
        document.querySelector(`#formEditar input[name="is_empresa"][value="${isEmpresa ? 'sim' : 'nao'}"]`).checked = true;
        const container = document.getElementById('edit_empresaFieldContainer');
        const inputEmpresa = document.getElementById('edit_nome_empresa');
        container.style.display = isEmpresa ? 'block' : 'none';
        inputEmpresa.value = userProfile.company_name || '';
        inputEmpresa.required = isEmpresa;
    }
    setupInputMasks() {
        const applyMask = (input, maskFunction) => {
            input.addEventListener('input', (e) => { e.target.value = maskFunction(e.target.value); });
        };
        const phoneMask = (v) => v.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
        const cpfCnpjMask = (v) => {
            v = v.replace(/\D/g, '');
            if (v.length <= 11) v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            else v = v.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
            return v.slice(0, 18);
        };
        document.querySelectorAll('input[type="tel"]').forEach(input => applyMask(input, phoneMask));
        document.querySelectorAll('input[name*="cpf_cnpj"]').forEach(input => applyMask(input, cpfCnpjMask));
    }
}

// ===== GERENCIADOR DE ANÚNCIOS PÚBLICOS E FILTROS =====
class PublicAnunciosManager {
    constructor() {
        this.container = document.getElementById('publicListings');
        this.modalBody = document.getElementById('detailsModalBody');
        this.resultsCountEl = document.getElementById('resultsCount');
        this.loadingEl = document.getElementById('loadingState');
        this.emptyEl = document.getElementById('emptyState');
        
        this.fetchAllAnuncios();
    }

    async fetchAllAnuncios() {
        this.setLoading(true);
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select(`*, profiles: profiles (*)`)
                .eq('status', 'ativo');

            if (error) throw error;
            publicAnuncios = data || [];
            
            // Adicionar anúncios locais aos públicos
            this.mergeLocalAnuncios();
            this.applyFiltersAndRender(); 
        } catch (error) {
            console.error('Erro ao carregar anúncios públicos:', error.message);
            this.setError('Não foi possível carregar os anúncios.');
        } finally {
            this.setLoading(false);
        }
    }

    mergeLocalAnuncios() {
        // Mesclar anúncios locais com os públicos
        const localAnuncios = anunciosManager.getLocalAnuncios();
        const allAnuncios = [...publicAnuncios];
        
        localAnuncios.forEach(localAnuncio => {
            if (localAnuncio.status === 'ativo') {
                allAnuncios.push({
                    ...localAnuncio,
                    profiles: userProfile,
                    isLocal: true
                });
            }
        });
        
        publicAnuncios = allAnuncios;
    }

    applyFiltersAndRender() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const activeCategories = Array.from(document.querySelectorAll('input[name="filter"]:checked')).map(cb => cb.value);

        let filteredAnuncios = publicAnuncios;

        if (activeCategories.length > 0) {
            filteredAnuncios = filteredAnuncios.filter(anuncio => activeCategories.includes(anuncio.categoria));
        }

        if (searchTerm) {
            filteredAnuncios = filteredAnuncios.filter(anuncio => {
                const profile = anuncio.profiles;
                const searchString = [
                    anuncio.titulo,
                    anuncio.descricao,
                    anuncio.servicos,
                    profile?.company_name,
                    profile?.full_name
                ].join(' ').toLowerCase();
                return searchString.includes(searchTerm);
            });
        }
        this.render(filteredAnuncios);
    }

    render(anuncios) {
        this.container.innerHTML = '';
        const resultsCount = document.getElementById('resultsCount');

        if (anuncios.length === 0) {
            this.setEmpty(true);
            if (resultsCount) resultsCount.textContent = 'Nenhum resultado';
            return;
        }
        
        this.setEmpty(false);
        if (resultsCount) resultsCount.textContent = `${anuncios.length} resultado(s)`;

        anuncios.forEach(anuncio => {
            const card = this.createAnuncioCard(anuncio);
            this.container.appendChild(card);
        });
    }

    createAnuncioCard(anuncio) {
        const card = document.createElement('div');
        card.className = 'public-anuncio-card';
        
        const profile = anuncio.profiles;
        const displayName = profile?.company_name || profile?.full_name || 'Parceiro';
        const localBadge = anuncio.isLocal ? '<span class="local-badge">Local</span>' : '';
        const imagemHtml = anuncio.imagem ? `<div class="anuncio-image"><img src="${anuncio.imagem}" alt="${anuncio.titulo}"></div>` : '';

        card.innerHTML = `
            ${imagemHtml}
            <div class="public-anuncio-header">
                <h3 class="public-anuncio-title">${anuncio.titulo || 'Título'}</h3>
                <p class="public-anuncio-empresa">${displayName} ${localBadge}</p>
                <span class="public-anuncio-categoria">
                    <i class="fas ${anuncio.categoria === 'oficina' ? 'fa-tools' : 'fa-user-cog'}"></i>
                    ${anuncio.categoria}
                </span>
            </div>
            <div class="public-anuncio-body">
                <p class="public-anuncio-description">${anuncio.descricao || 'Sem descrição.'}</p>
            </div>
            <div class="public-anuncio-footer">
                <span class="public-anuncio-preco">${anuncio.preco ? `R$ ${parseFloat(anuncio.preco).toFixed(2)}` : 'A consultar'}</span>
                <button class="btn btn-primary btn-sm">Ver Detalhes</button>
            </div>
        `;
        card.addEventListener('click', () => this.showDetailsModal(anuncio));
        return card;
    }

    showDetailsModal(anuncio) {
        const profile = anuncio.profiles;
        const imagemHtml = anuncio.imagem ? `<div class="modal-anuncio-image"><img src="${anuncio.imagem}" alt="${anuncio.titulo}"></div>` : '';
        
        this.modalBody.innerHTML = `
            ${imagemHtml}
            <h4>${anuncio.titulo}</h4>
            <p><strong>Anunciante:</strong> ${profile?.company_name || profile?.full_name || 'Não informado'}</p>
            <p><strong>Descrição:</strong> ${anuncio.descricao}</p>
            ${anuncio.servicos ? `<p><strong>Serviços:</strong> ${anuncio.servicos}</p>` : ''}
            <p><strong>Preço:</strong> ${anuncio.preco ? `R$ ${parseFloat(anuncio.preco).toFixed(2)}` : 'A consultar'}</p>
            <hr>
            <h5>Informações de Contato</h5>
            <p><strong>Endereço:</strong> ${profile?.address || 'Não informado'}</p>
            <p><strong>Telefone/WhatsApp:</strong> ${profile?.phone || 'Não informado'}</p>
            ${anuncio.contato ? `<p><strong>Outros Contatos:</strong> ${anuncio.contato}</p>` : ''}
        `;
        modalManager.openModal('detailsModal');
    }

    setLoading(isLoading) { if (this.loadingEl) this.loadingEl.style.display = isLoading ? 'block' : 'none'; }
    setError(message) {
        if (this.emptyEl) {
            this.emptyEl.innerHTML = `<div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div><h4>Ocorreu um erro</h4><p>${message}</p>`;
            this.setEmpty(true);
        }
    }
    setEmpty(show) { if (this.emptyEl) this.emptyEl.style.display = show ? 'block' : 'none'; }
}

// ===== GERENCIADOR DE ANÚNCIOS LOCAIS =====
class AnunciosManager {
    constructor() {
        this.storageKey = 'motohelp_anuncios_locais';
        this.currentEditId = null;
        this.currentImageData = null;
        document.getElementById('formAnuncio')?.addEventListener('submit', (e) => this.handleAnuncioSubmit(e));
        this.setupImageUpload();
    }
    
    setupImageUpload() {
        const imageInput = document.getElementById('anuncio_imagem');
        const imagePreview = document.getElementById('imagePreview');
        const btnRemover = document.getElementById('btnRemoverImagem');
        
        if (!imageInput || !imagePreview) return;
        
        // Click no preview abre o seletor de arquivo
        imagePreview.addEventListener('click', () => imageInput.click());
        
        // Drag and drop
        imagePreview.addEventListener('dragover', (e) => {
            e.preventDefault();
            imagePreview.classList.add('dragover');
        });
        
        imagePreview.addEventListener('dragleave', () => {
            imagePreview.classList.remove('dragover');
        });
        
        imagePreview.addEventListener('drop', (e) => {
            e.preventDefault();
            imagePreview.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file);
            }
        });
        
        // Seleção de arquivo
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
            }
        });
        
        // Remover imagem
        btnRemover?.addEventListener('click', () => {
            this.removeImage();
        });
    }
    
    handleImageFile(file) {
        // Validar tamanho (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toastManager.show('A imagem deve ter no máximo 2MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImageData = e.target.result;
            document.getElementById('anuncio_imagem_data').value = this.currentImageData;
            this.updateImagePreview(this.currentImageData);
        };
        reader.readAsDataURL(file);
    }
    
    updateImagePreview(imageData) {
        const imagePreview = document.getElementById('imagePreview');
        const btnRemover = document.getElementById('btnRemoverImagem');
        
        if (imageData) {
            imagePreview.innerHTML = `<img src="${imageData}" alt="Preview">`;
            imagePreview.classList.add('has-image');
            btnRemover.style.display = 'inline-flex';
        } else {
            imagePreview.innerHTML = '<i class="fas fa-image"></i><p>Clique ou arraste uma imagem</p>';
            imagePreview.classList.remove('has-image');
            btnRemover.style.display = 'none';
        }
    }
    
    removeImage() {
        this.currentImageData = null;
        document.getElementById('anuncio_imagem_data').value = '';
        document.getElementById('anuncio_imagem').value = '';
        this.updateImagePreview(null);
    }
    
    // Obter anúncios do localStorage
    getLocalAnuncios() {
        if (!currentUser) return [];
        const stored = localStorage.getItem(`${this.storageKey}_${currentUser.id}`);
        return stored ? JSON.parse(stored) : [];
    }
    
    // Salvar anúncios no localStorage
    saveLocalAnuncios(anuncios) {
        if (!currentUser) return;
        localStorage.setItem(`${this.storageKey}_${currentUser.id}`, JSON.stringify(anuncios));
    }
    
    openAnuncioModal(anuncioId = null) {
        const modal = document.getElementById('modalAnuncio');
        const form = document.getElementById('formAnuncio');
        const title = document.getElementById('anuncioModalTitle');
        
        if (anuncioId) {
            // Editar anúncio existente
            const anuncios = this.getLocalAnuncios();
            const anuncio = anuncios.find(a => a.id === anuncioId);
            
            if (anuncio) {
                title.textContent = 'Editar Anúncio';
                document.getElementById('anuncio_id').value = anuncio.id;
                document.getElementById('anuncio_titulo').value = anuncio.titulo;
                document.getElementById('anuncio_descricao').value = anuncio.descricao;
                document.getElementById('anuncio_categoria').value = anuncio.categoria;
                document.getElementById('anuncio_servicos').value = anuncio.servicos || '';
                document.getElementById('anuncio_preco').value = anuncio.preco || '';
                document.getElementById('anuncio_contato').value = anuncio.contato || '';
                
                // Carregar imagem se existir
                if (anuncio.imagem) {
                    this.currentImageData = anuncio.imagem;
                    document.getElementById('anuncio_imagem_data').value = anuncio.imagem;
                    this.updateImagePreview(anuncio.imagem);
                } else {
                    this.removeImage();
                }
                
                this.currentEditId = anuncioId;
            }
        } else {
            // Novo anúncio
            title.textContent = 'Novo Anúncio';
            form.reset();
            this.currentEditId = null;
            this.removeImage();
        }
        
        modalManager.openModal('modalAnuncio');
    }

    loadAnuncios() {
        const container = document.getElementById('anunciosListContainer');
        if (!container) return;
        
        const anuncios = this.getLocalAnuncios();
        
        if (anuncios.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-bullhorn"></i></div>
                    <h4>Nenhum anúncio cadastrado</h4>
                    <p>Crie seu primeiro anúncio para começar a divulgar seus serviços</p>
                    <button class="btn btn-primary" id="btnPrimeiroAnuncio">
                        <i class="fas fa-plus"></i>
                        Criar Primeiro Anúncio
                    </button>
                </div>
            `;
            document.getElementById('btnPrimeiroAnuncio')?.addEventListener('click', () => this.openAnuncioModal());
            return;
        }
        
        container.innerHTML = '';
        anuncios.forEach(anuncio => {
            const card = this.createAnuncioManagementCard(anuncio);
            container.appendChild(card);
        });
    }

    createAnuncioManagementCard(anuncio) {
        const card = document.createElement('div');
        card.className = 'anuncio-management-card';
        
        const statusClass = anuncio.status === 'ativo' ? 'status-active' : 'status-inactive';
        const statusText = anuncio.status === 'ativo' ? 'Ativo' : 'Inativo';
        const imagemHtml = anuncio.imagem ? `<div class="anuncio-thumbnail"><img src="${anuncio.imagem}" alt="${anuncio.titulo}"></div>` : '';
        
        card.innerHTML = `
            ${imagemHtml}
            <div class="anuncio-card-header">
                <h4>${anuncio.titulo}</h4>
                <span class="anuncio-status ${statusClass}">${statusText}</span>
            </div>
            <div class="anuncio-card-body">
                <p><strong>Categoria:</strong> ${anuncio.categoria}</p>
                <p><strong>Descrição:</strong> ${anuncio.descricao}</p>
                ${anuncio.preco ? `<p><strong>Preço:</strong> R$ ${parseFloat(anuncio.preco).toFixed(2)}</p>` : ''}
            </div>
            <div class="anuncio-card-actions">
                <button class="btn btn-sm btn-outline" data-action="edit" data-id="${anuncio.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm ${anuncio.status === 'ativo' ? 'btn-warning' : 'btn-primary'}" data-action="toggle" data-id="${anuncio.id}">
                    <i class="fas fa-${anuncio.status === 'ativo' ? 'pause' : 'play'}"></i>
                    ${anuncio.status === 'ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn btn-sm btn-danger" data-action="delete" data-id="${anuncio.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        // Event listeners para os botões
        card.querySelector('[data-action="edit"]').addEventListener('click', () => this.openAnuncioModal(anuncio.id));
        card.querySelector('[data-action="toggle"]').addEventListener('click', () => this.toggleAnuncioStatus(anuncio.id));
        card.querySelector('[data-action="delete"]').addEventListener('click', () => this.deleteAnuncio(anuncio.id));
        
        return card;
    }

    handleAnuncioSubmit(event) {
        event.preventDefault();
        
        if (!currentUser) {
            toastManager.show('Você precisa estar logado.', 'error');
            return;
        }
        
        const form = event.target;
        const formData = new FormData(form);
        
        const anuncioData = {
            titulo: formData.get('titulo'),
            descricao: formData.get('descricao'),
            categoria: formData.get('categoria'),
            servicos: formData.get('servicos'),
            preco: formData.get('preco'),
            contato: formData.get('contato'),
            imagem: this.currentImageData || null, // Adicionar imagem
            status: 'ativo',
            user_id: currentUser.id
        };
        
        let anuncios = this.getLocalAnuncios();
        
        if (this.currentEditId) {
            // Editar anúncio existente
            const index = anuncios.findIndex(a => a.id === this.currentEditId);
            if (index !== -1) {
                anuncios[index] = { ...anuncios[index], ...anuncioData };
                toastManager.show('Anúncio atualizado com sucesso!', 'success');
            }
        } else {
            // Criar novo anúncio
            const newAnuncio = {
                ...anuncioData,
                id: Date.now().toString(),
                created_at: new Date().toISOString()
            };
            anuncios.push(newAnuncio);
            toastManager.show('Anúncio criado com sucesso!', 'success');
        }
        
        this.saveLocalAnuncios(anuncios);
        modalManager.closeModal('modalAnuncio');
        this.loadAnuncios();
        
        // Atualizar a lista pública
        publicAnunciosManager.fetchAllAnuncios();
    }
    
    toggleAnuncioStatus(anuncioId) {
        let anuncios = this.getLocalAnuncios();
        const index = anuncios.findIndex(a => a.id === anuncioId);
        
        if (index !== -1) {
            anuncios[index].status = anuncios[index].status === 'ativo' ? 'inativo' : 'ativo';
            this.saveLocalAnuncios(anuncios);
            this.loadAnuncios();
            toastManager.show('Status do anúncio atualizado!', 'success');
            
            // Atualizar a lista pública
            publicAnunciosManager.fetchAllAnuncios();
        }
    }
    
    deleteAnuncio(anuncioId) {
        if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
        
        let anuncios = this.getLocalAnuncios();
        anuncios = anuncios.filter(a => a.id !== anuncioId);
        this.saveLocalAnuncios(anuncios);
        this.loadAnuncios();
        toastManager.show('Anúncio excluído com sucesso!', 'success');
        
        // Atualizar a lista pública
        publicAnunciosManager.fetchAllAnuncios();
    }
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
let authManager, modalManager, userDropdownManager, formManager, publicAnunciosManager, anunciosManager, toastManager;

document.addEventListener('DOMContentLoaded', () => {
    if (!supabase) {
        console.error("Supabase não foi inicializado.");
        alert("Erro crítico: A conexão com o banco de dados falhou.");
        return;
    }
    
    toastManager = new ToastManager();
    authManager = new AuthManager();
    modalManager = new ModalManager();
    userDropdownManager = new UserDropdownManager();
    formManager = new FormManager();
    publicAnunciosManager = new PublicAnunciosManager();
    anunciosManager = new AnunciosManager();

    // --- CÓDIGO PARA ATIVAR FILTROS E PESQUISA ---
    const searchInput = document.getElementById('searchInput');
    const filterCheckboxes = document.querySelectorAll('input[name="filter"]');
    const clearSearchBtn = document.getElementById('clearSearch');

    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            publicAnunciosManager.applyFiltersAndRender();
        }, 300);
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    });

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            publicAnunciosManager.applyFiltersAndRender();
        });
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        publicAnunciosManager.applyFiltersAndRender();
    });

    document.getElementById('excluirContaLink')?.addEventListener('click', () => {
        alert("A exclusão de conta deve ser implementada com uma Supabase Edge Function por segurança.");
    });

    document.addEventListener('click', function(event) {
        const logoutButton = event.target.closest('#logoutButton');
        if (logoutButton) {
            event.preventDefault();
            if (authManager) {
                authManager.logout();
            } else {
                console.error('AuthManager não foi inicializado a tempo.');
                toastManager.show('Erro ao tentar sair. Tente recarregar a página.', 'error');
            }
        }
    });
});
