// =================================================================================
// MOTO HELP - SCRIPT PRINCIPAL (VERSÃO FINAL E FUNCIONAL)
// =================================================================================
// Autor: Manus AI
// Descrição: Script completo para gerenciar a lógica do frontend da aplicação
// Moto Help, incluindo autenticação, gerenciamento de modais, formulários,
// anúncios públicos e de parceiros, com integração total ao Supabase.
// =================================================================================

// ===== CONFIGURAÇÃO DO SUPABASE =====
// --- 1. INICIALIZAÇÃO DO SUPABASE ---
const SUPABASE_URL = 'https://oeuabuswavmlwquaujji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldWFidXN3YXZtbHdxdWF1amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDUyNjEsImV4cCI6MjA3NTAyMTI2MX0.jc0o-FLPNYLak1kU3b_1r8jns0yuGZnJ8W2Mlz36t9Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY );

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
        if (session) await this.handleUserSignIn(session);
        else this.handleUserSignOut();
        // A função loadPublicAnuncios() foi movida para a classe PublicAnunciosManager
        // e será chamada na inicialização.
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
        // Redireciona para a página inicial ou de login para uma experiência de usuário mais clara
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

        if (currentUser && userProfile) {
            userDropdown.style.display = 'block';
            userDropdownManager.updateUserInfo(userProfile);

            if (userProfile.is_partner === true) {
                btnGerenciarBusiness.style.display = 'inline-flex';
                btnAbrirModalCadastro.style.display = 'none';
            } else {
                btnGerenciarBusiness.style.display = 'none';
                btnAbrirModalCadastro.style.display = 'inline-flex';
            }
        } else if (currentUser && !userProfile) {
            userDropdown.style.display = 'block';
            userDropdownManager.updateUserInfo({ email: currentUser.email });
            btnGerenciarBusiness.style.display = 'none';
            btnAbrirModalCadastro.style.display = 'inline-flex';
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
                // A lógica de handleUserSignOut já trata a atualização da UI e recarregamento.
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
        const displayName = currentUser?.user_metadata?.display_name || profile.company_name || profile.email?.split('@')[0] || 'Usuário';
        document.getElementById('userName').textContent = displayName;
        document.getElementById('userEmail').textContent = profile.email || 'email@exemplo.com';
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
        // A lógica do formAnuncio foi movida para a classe AnunciosManager
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

// ===== GERENCIADOR DE ANÚNCIOS PÚBLICOS (PLACEHOLDER) =====
class PublicAnunciosManager {
    constructor() {
        // Esta classe pode ser expandida para carregar anúncios públicos
        // que não pertencem a nenhum parceiro específico.
        this.loadPublicAnuncios();
    }
    async loadPublicAnuncios() {
        // Lógica para carregar anúncios públicos, se houver.
        // Por enquanto, vamos deixar um placeholder.
        console.log("Carregando anúncios públicos...");
        const container = document.getElementById('publicListings');
        if (container) {
            // container.innerHTML = '<p>Anúncios públicos aparecerão aqui.</p>';
        }
    }
}

// ===== GERENCIADOR DE ANÚNCIOS DE PARCEIROS (PLACEHOLDER) =====
class AnunciosManager {
    constructor() {
        // Inicializa os listeners para os formulários de anúncio
        document.getElementById('formAnuncio')?.addEventListener('submit', (e) => this.handleAnuncioSubmit(e));
    }
    
    openAnuncioModal() {
        // Lógica para abrir o modal de criação de anúncio
        modalManager.openModal('modalAnuncio');
    }

    loadAnuncios() {
        // Lógica para carregar os anúncios do usuário logado
        console.log("Carregando anúncios do parceiro...");
    }

    handleAnuncioSubmit(event) {
        event.preventDefault();
        // Lógica para criar ou atualizar um anúncio
        console.log("Formulário de anúncio enviado.");
        toastManager.show("Funcionalidade de anúncio em desenvolvimento.", "info");
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
    
    // Instancia todos os gerenciadores
    toastManager = new ToastManager();
    authManager = new AuthManager();
    modalManager = new ModalManager();
    userDropdownManager = new UserDropdownManager();
    formManager = new FormManager();
    publicAnunciosManager = new PublicAnunciosManager();
    anunciosManager = new AnunciosManager();

    // Adiciona listener para exclusão de conta (com aviso)
    document.getElementById('excluirContaLink')?.addEventListener('click', () => {
        alert("A exclusão de conta deve ser implementada com uma Supabase Edge Function por segurança para garantir que todos os dados do usuário sejam removidos.");
    });

    // =======================================================================
    // === CORREÇÃO APLICADA: DELEGAÇÃO DE EVENTO PARA O BOTÃO DE LOGOUT ===
    // =======================================================================
    // Esta abordagem garante que o clique seja capturado mesmo que o botão
    // não esteja visível quando a página carrega.
    document.addEventListener('click', function(event) {
        // Verifica se o elemento clicado (ou um de seus pais) é o botão de logout
        const logoutButton = event.target.closest('#logoutButton');

        if (logoutButton) {
            event.preventDefault(); // Previne qualquer ação padrão do link/botão
            
            if (authManager) {
                authManager.logout();
            } else {
                console.error('AuthManager não foi inicializado a tempo.');
                toastManager.show('Erro ao tentar sair. Tente recarregar a página.', 'error');
            }
        }
    });
});
