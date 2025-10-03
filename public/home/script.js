// =================================================================================
// MOTO HELP - SCRIPT PRINCIPAL (VERSÃO FINAL E FUNCIONAL)
// =================================================================================
// Autor: Manus AI
// Descrição: Script completo para gerenciar a lógica do frontend da aplicação
// Moto Help, incluindo autenticação, gerenciamento de modais, formulários,
// anúncios públicos e de parceiros, com integração total ao Supabase.
// =================================================================================

// ===== CONFIGURAÇÃO DO SUPABASE =====
// ATENÇÃO: Use as mesmas credenciais da sua página de login.
const SUPABASE_URL = 'https://oeuabuswavmlwquaujji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldWFidXN3YXZtbHdxdWF1amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDUyNjEsImV4cCI6MjA3NTAyMTI2MX0.jc0o-FLPNYLak1kU3b_1r8jns0yuGZnJ8W2Mlz36t9Y';
const supabase = window.supabase?.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

// ===== ESTADO GLOBAL DA APLICAÇÃO =====
let currentUser = null;
let userProfile = null;
let publicAnuncios = [];
let userAnuncios = [];
let currentPage = 1;
const itemsPerPage = 6;
let totalPages = 1;
let searchDebounceTimer;

// ===== GERENCIADOR DE NOTIFICAÇÕES (TOASTS) =====
class ToastManager {
    constructor() {
        this.container = this.createContainer();
    }
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
        if (session) {
            await this.handleUserSignIn(session);
        } else {
            this.handleUserSignOut();
        }
        publicAnunciosManager.loadPublicAnuncios();
    }
    async handleUserSignIn(session) {
        currentUser = session.user;
        await this.fetchUserProfile();
        this.updateUI();
    }
    handleUserSignOut() {
        currentUser = null;
        userProfile = null;
        this.updateUI();
    }
    async fetchUserProfile() {
        if (!currentUser) return;
        try {
            const { data, error, status } = await supabase.from('profiles').select(`*`).eq('id', currentUser.id).single();
            if (error && status !== 406) throw error;
            userProfile = data; // Armazena o perfil encontrado
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error.message);
            userProfile = null; // Garante que o perfil seja nulo se houver erro
        }
    }
    updateUI() {
        const userDropdown = document.getElementById('userDropdown');
        const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
        const btnGerenciarBusiness = document.getElementById('btnGerenciarBusiness');

        // A condição `currentUser` verifica o login.
        // A condição `userProfile` verifica se o registro na tabela 'profiles' foi encontrado.
        if (currentUser && userProfile) {
            // Usuário está logado E seu perfil foi carregado com sucesso.
            userDropdown.style.display = 'block';
            userDropdownManager.updateUserInfo(userProfile);

            if (userProfile.is_partner === true) {
                // Se o campo 'is_partner' for explicitamente true.
                btnGerenciarBusiness.style.display = 'inline-flex';
                btnAbrirModalCadastro.style.display = 'none';
            } else {
                // Se for logado, tiver perfil, mas não for parceiro.
                btnGerenciarBusiness.style.display = 'none';
                btnAbrirModalCadastro.style.display = 'inline-flex';
            }
        } else if (currentUser && !userProfile) {
            // Caso de contingência: usuário logado, mas perfil não encontrado (erro ou trigger falhou).
            // Mostra o menu com informações básicas e a opção de se tornar parceiro.
            userDropdown.style.display = 'block';
            userDropdownManager.updateUserInfo({ email: currentUser.email }); // Usa o email da autenticação
            btnGerenciarBusiness.style.display = 'none';
            btnAbrirModalCadastro.style.display = 'inline-flex';
        } else {
            // Usuário totalmente deslogado.
            userDropdown.style.display = 'none';
            btnGerenciarBusiness.style.display = 'none';
            btnAbrirModalCadastro.style.display = 'inline-flex'; // Mantém visível para convidar ao login
        }
    }
    async logout() {
        if (confirm('Tem certeza que deseja sair?')) {
            const { error } = await supabase.auth.signOut();
            if (error) toastManager.show('Erro ao fazer logout.', 'error');
            else toastManager.show('Você saiu com sucesso!', 'success');
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
        document.getElementById('userName').textContent = profile.company_name || profile.email?.split('@')[0] || 'Usuário';
        document.getElementById('userEmail').textContent = profile.email || 'email@exemplo.com';
    }
}

// ===== GERENCIADOR DE MODAIS =====
class ModalManager {
    constructor() { this.init(); }
    init() {
        document.getElementById('btnAbrirModalCadastro')?.addEventListener('click', () => {
            if (currentUser) {
                this.openModal('modalCadastro');
            } else {
                toastManager.show('Você precisa fazer login para se tornar um parceiro.', 'info');
                // Sugestão: redirecionar para a página de login
                // setTimeout(() => { window.location.href = '/login.html'; }, 2000);
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
        document.getElementById('formAnuncio')?.addEventListener('submit', (e) => anunciosManager.handleAnuncioSubmit(e));
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

// ===== GERENCIADOR DE ANÚNCIOS PÚBLICOS =====
class PublicAnunciosManager {
    constructor() { this.init(); }
    init() {
        const searchInput = document.getElementById('searchInput');
        const clearSearchBtn = document.getElementById('clearSearch');
        searchInput?.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
            searchDebounceTimer = setTimeout(() => this.filterAndSearch(), 300);
        });
        clearSearchBtn?.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchBtn.style.display = 'none';
            this.filterAndSearch();
        });
        document.querySelectorAll('input[name="filter"]').forEach(cb => cb.addEventListener('change', () => this.filterAndSearch()));
    }
    async loadPublicAnuncios(page = 1, searchTerm = '', categories = []) {
        this.showLoadingState(true);
        try {
            const startIndex = (page - 1) * itemsPerPage;
            let query = supabase.from('anuncios').select(`*, profiles ( company_name, email )`, { count: 'exact' }).eq('status', 'ativo');
            if (searchTerm) query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,services.ilike.%${searchTerm}%`);
            if (categories.length > 0) query = query.in('category', categories);
            const { data, error, count } = await query.range(startIndex, startIndex + itemsPerPage - 1).order('created_at', { ascending: false });
            if (error) throw error;
            publicAnuncios = data || [];
            totalPages = Math.ceil(count / itemsPerPage);
            currentPage = page;
            this.renderPublicAnuncios();
            this.renderPagination();
            this.updateResultsCount(count);
        } catch (error) {
            console.error('Erro ao carregar anúncios públicos:', error);
            this.showEmptyState(true);
        } finally {
            this.showLoadingState(false);
        }
    }
    renderPublicAnuncios() {
        const container = document.getElementById('listingsContainer');
        if (!container) return;
        if (publicAnuncios.length === 0) {
            this.showEmptyState(true);
            container.innerHTML = '';
            return;
        }
        this.showEmptyState(false);
        container.innerHTML = publicAnuncios.map((anuncio, index) => this.createPublicAnuncioCard(anuncio, index)).join('');
    }
    createPublicAnuncioCard(anuncio, index) {
        const nomeEmpresa = anuncio.profiles?.company_name || anuncio.profiles?.email?.split('@')[0] || 'Profissional';
        const precoFormatado = anuncio.price ? `R$ ${parseFloat(anuncio.price).toFixed(2).replace('.', ',')}` : 'A consultar';
        const icon = anuncio.category === 'oficina' ? 'fa-tools' : 'fa-user-cog';
        return `<div class="listing-card" style="animation-delay: ${index * 50}ms;"><div class="card-header"><h3 class="card-title">${anuncio.title}</h3><span class="card-category"><i class="fas ${icon}"></i> ${anuncio.category}</span></div><p class="card-provider">Por: ${nomeEmpresa}</p><p class="card-description">${anuncio.description}</p>${anuncio.services ? `<div class="card-services"><strong>Serviços:</strong> ${anuncio.services}</div>` : ''}<div class="card-footer"><span class="card-price">${precoFormatado}</span>${anuncio.contact ? `<span class="card-contact"><i class="fas fa-phone-alt"></i> ${anuncio.contact}</span>` : ''}</div></div>`;
    }
    renderPagination() {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }
        let html = `<button class="pagination-button" ${currentPage === 1 ? 'disabled' : ''} onclick="publicAnunciosManager.goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
        const maxPages = 5;
        let start = Math.max(1, currentPage - Math.floor(maxPages / 2));
        let end = Math.min(totalPages, start + maxPages - 1);
        if (end - start + 1 < maxPages) start = Math.max(1, end - maxPages + 1);
        if (start > 1) {
            html += `<button class="pagination-button" onclick="publicAnunciosManager.goToPage(1)">1</button>`;
            if (start > 2) html += `<span class="pagination-ellipsis">...</span>`;
        }
        for (let i = start; i <= end; i++) html += `<button class="pagination-button ${i === currentPage ? 'active' : ''}" onclick="publicAnunciosManager.goToPage(${i})">${i}</button>`;
        if (end < totalPages) {
            if (end < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
            html += `<button class="pagination-button" onclick="publicAnunciosManager.goToPage(${totalPages})">${totalPages}</button>`;
        }
        html += `<button class="pagination-button" ${currentPage === totalPages ? 'disabled' : ''} onclick="publicAnunciosManager.goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        paginationContainer.innerHTML = html;
    }
    goToPage(page) {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            this.filterAndSearch(page);
            document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    }
    filterAndSearch(page = 1) {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const selectedCategories = Array.from(document.querySelectorAll('input[name="filter"]:checked')).map(cb => cb.value);
        this.loadPublicAnuncios(page, searchTerm, selectedCategories);
    }
    updateResultsCount(total) {
        const el = document.getElementById('resultsCount');
        if (el) el.textContent = `${total} resultado${total !== 1 ? 's' : ''}`;
    }
    showLoadingState(show) { document.getElementById('loadingState').style.display = show ? 'flex' : 'none'; }
    showEmptyState(show) { document.getElementById('emptyState').style.display = show ? 'flex' : 'none'; }
}

// ===== GERENCIADOR DE ANÚNCIOS DO PARCEIRO =====
class AnunciosManager {
    async loadAnuncios() {
        if (!currentUser) return;
        try {
            const { data, error } = await supabase.from('anuncios').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
            if (error) throw error;
            userAnuncios = data || [];
            this.renderAnuncios();
            this.updateStats();
        } catch (error) {
            console.error('Erro ao carregar seus anúncios:', error);
            toastManager.show('Erro ao carregar seus anúncios.', 'error');
        }
    }
    renderAnuncios() {
        const listContainer = document.getElementById('anunciosList');
        const emptyState = document.getElementById('emptyAnuncios');
        if (!listContainer || !emptyState) return;
        if (userAnuncios.length === 0) {
            emptyState.style.display = 'block';
            listContainer.innerHTML = '';
            return;
        }
        emptyState.style.display = 'none';
        listContainer.innerHTML = userAnuncios.map(anuncio => this.createAnuncioCard(anuncio)).join('');
    }
    createAnuncioCard(anuncio) {
        return `<div class="anuncio-card"><div class="anuncio-card-header"><h4 class="anuncio-title">${anuncio.title}</h4><span class="anuncio-status ${anuncio.status}">${anuncio.status}</span></div><p class="anuncio-description">${anuncio.description}</p><div class="anuncio-meta"><span><i class="fas fa-tag"></i> ${anuncio.category}</span>${anuncio.price ? `<span><i class="fas fa-dollar-sign"></i> ${anuncio.price}</span>` : ''}<span><i class="fas fa-calendar-alt"></i> ${new Date(anuncio.created_at).toLocaleDateString()}</span></div><div class="anuncio-actions"><button class="btn btn-sm btn-outline" onclick="anunciosManager.editAnuncio(${anuncio.id})"><i class="fas fa-edit"></i> Editar</button><button class="btn btn-sm btn-outline" onclick="anunciosManager.toggleStatus(${anuncio.id}, '${anuncio.status}')"><i class="fas fa-toggle-${anuncio.status === 'ativo' ? 'on' : 'off'}"></i> ${anuncio.status === 'ativo' ? 'Desativar' : 'Ativar'}</button><button class="btn btn-sm btn-danger" onclick="anunciosManager.deleteAnuncio(${anuncio.id})"><i class="fas fa-trash"></i> Excluir</button></div></div>`;
    }
    updateStats() {
        document.getElementById('totalAnuncios').textContent = userAnuncios.length;
        document.getElementById('anunciosAtivos').textContent = userAnuncios.filter(a => a.status === 'ativo').length;
    }
    openAnuncioModal(anuncio = null) {
        const form = document.getElementById('formAnuncio');
        document.getElementById('anuncioModalTitle').textContent = anuncio ? 'Editar Anúncio' : 'Novo Anúncio';
        if (anuncio) {
            document.getElementById('anuncioId').value = anuncio.id;
            document.getElementById('tituloAnuncio').value = anuncio.title;
            document.getElementById('descricaoAnuncio').value = anuncio.description;
            document.getElementById('categoriaAnuncio').value = anuncio.category;
            document.getElementById('precoAnuncio').value = anuncio.price || '';
            document.getElementById('servicosAnuncio').value = anuncio.services || '';
            document.getElementById('contatoAnuncio').value = anuncio.contact || '';
            document.querySelector(`input[name="status"][value="${anuncio.status}"]`).checked = true;
        } else {
            form.reset();
            document.getElementById('anuncioId').value = '';
            document.querySelector('input[name="status"][value="ativo"]').checked = true;
        }
        modalManager.openModal('modalAnuncio');
    }
    async handleAnuncioSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const anuncioId = formData.get('id');
        const anuncioData = {
            title: formData.get('titulo'), description: formData.get('descricao'), category: formData.get('categoria'), price: formData.get('preco') || null, services: formData.get('servicos'), contact: formData.get('contato'), status: formData.get('status'), user_id: currentUser.id
        };
        try {
            const { error } = anuncioId ? await supabase.from('anuncios').update(anuncioData).eq('id', anuncioId) : await supabase.from('anuncios').insert([anuncioData]);
            if (error) throw error;
            toastManager.show(`Anúncio ${anuncioId ? 'atualizado' : 'criado'} com sucesso!`, 'success');
            modalManager.closeModal('modalAnuncio');
            this.loadAnuncios();
            publicAnunciosManager.filterAndSearch();
        } catch (error) {
            console.error('Erro ao salvar anúncio:', error);
            toastManager.show('Erro ao salvar o anúncio.', 'error');
        }
    }
    editAnuncio(id) {
        const anuncio = userAnuncios.find(a => a.id === id);
        if (anuncio) this.openAnuncioModal(anuncio);
    }
    async toggleStatus(id, currentStatus) {
        const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';
        try {
            const { error } = await supabase.from('anuncios').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            toastManager.show(`Status do anúncio alterado para ${newStatus}.`, 'success');
            this.loadAnuncios();
            publicAnunciosManager.filterAndSearch();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            toastManager.show('Erro ao alterar o status.', 'error');
        }
    }
    async deleteAnuncio(id) {
        if (!confirm('Tem certeza que deseja excluir este anúncio? Esta ação é irreversível.')) return;
        try {
            const { error } = await supabase.from('anuncios').delete().eq('id', id);
            if (error) throw error;
            toastManager.show('Anúncio excluído com sucesso!', 'success');
            this.loadAnuncios();
            publicAnunciosManager.filterAndSearch();
        } catch (error) {
            console.error('Erro ao excluir anúncio:', error);
            toastManager.show('Erro ao excluir o anúncio.', 'error');
        }
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
    document.getElementById('logoutButton')?.addEventListener('click', () => authManager.logout());
    document.getElementById('excluirContaLink')?.addEventListener('click', () => {
        alert("A exclusão de conta deve ser implementada com uma Supabase Edge Function por segurança.");
    });
});
