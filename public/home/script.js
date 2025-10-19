// ===== CONFIGURAÇÃO DO SUPABASE =====
const SUPABASE_URL = 'https://oeuabuswavmlwquaujji.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ldWFidXN3YXZtbHdxdWF1amppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NDUyNjEsImV4cCI6MjA3NTAyMTI2MX0.jc0o-FLPNYLak1kU3b_1r8jns0yuGZnJ8W2Mlz36t9Y';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ESTADO GLOBAL DA APLICAÇÃO =====
let currentUser = null;
let userProfile = null;
let publicAnuncios = [];
let currentPage = 1;
const itemsPerPage = 6;
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
        if (session) await this.handleUserSignIn(session, false);
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
                toastManager.show(`${saudacao}, ${displayName}! Bem-vindo(a) de volta.`, 'success');
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
            const { data, error, status } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();
                
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

        if (currentUser) {
            userDropdown.style.display = 'block';
            userDropdownManager.updateUserInfo(userProfile || { email: currentUser.email });
            
            if (userProfile && userProfile.is_partner === true) {
                btnAbrirModalCadastro.style.display = 'none';
                btnGerenciarBusiness.style.display = 'inline-flex';
            } else {
                btnAbrirModalCadastro.style.display = 'inline-flex';
                btnGerenciarBusiness.style.display = 'none';
            }
        } else {
            userDropdown.style.display = 'none';
            btnGerenciarBusiness.style.display = 'none';
            btnAbrirModalCadastro.style.display = 'none';
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
        document.getElementById('userEmailDisplay').textContent = `SEU EMAIL É: ${profile.email}`;
        document.getElementById('userTypeDisplay').textContent = `SEU TIPO DE CADASTRO É: ${profile.is_partner ? 'PARCEIRO OFICIAL' : 'USUARIO COMUM'}`;
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
        
        document.getElementById('btnGerenciarBusiness')?.addEventListener('click', () => {
            if (userProfile && userProfile.is_partner === true) {
                this.openModal('modalAnuncios');
            } else {
                toastManager.show('Apenas parceiros podem gerenciar anúncios.', 'error');
            }
        });
        
        document.getElementById('editProfileButton')?.addEventListener('click', () => {
            if (userProfile && userProfile.is_partner === true) {
                document.getElementById('userDropdown')?.classList.remove('active');
                this.openModal('modalEditar');
            } else {
                toastManager.show('Você precisa ser um parceiro para editar o perfil Business.', 'error');
            }
        });
        
        document.getElementById('btnNovoAnuncio')?.addEventListener('click', () => anunciosManager.openAnuncioModal());

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
            id: currentUser.id,
            email: currentUser.email,
            full_name: formData.get('nome_completo'),
            phone: formData.get('telefone'),
            cpf_cnpj: formData.get('cpf_cnpj'),
            address: formData.get('endereco'),
            category: formData.get('categoria'),
            company_name: formData.get('is_empresa') === 'sim' ? formData.get('nome_empresa') : null,
            is_partner: true,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await supabase
            .from('profiles')
            .upsert(profileData, { 
                onConflict: 'id',
                ignoreDuplicates: false 
            });
            
        if (error) {
            toastManager.show('Erro ao se tornar parceiro. Verifique os dados.', 'error');
            console.error('Erro detalhado:', error);
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
        
        if (!userProfile || !userProfile.is_partner) {
            toastManager.show('Apenas parceiros podem editar o perfil Business.', 'error');
            return;
        }
        
        const form = event.target;
        const formData = new FormData(form);
        
        const profileData = {
            full_name: formData.get('edit_nome_completo'),
            phone: formData.get('telefone'),
            cpf_cnpj: formData.get('cpf_cnpj_editar'),
            address: formData.get('endereco'),
            category: formData.get('categoria'),
            company_name: formData.get('is_empresa') === 'sim' ? formData.get('edit_nome_empresa') : null,
        };
        
        const { error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', currentUser.id);
            
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
        document.getElementById('nome_completo_edit').value = userProfile.full_name || '';
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
        console.log('🔄 Iniciando busca de anúncios...');
        console.log('🔗 Supabase URL:', SUPABASE_URL);
        console.log('🔑 Supabase client ativo:', !!supabase);
        
        try {
            // Testa conexão básica primeiro
            const { data: testData, error: testError } = await supabase
                .from('anuncios')
                .select('*')
                .limit(1);
            
            console.log('🧪 Teste de conexão:', { testData, testError });
            
            if (testError) {
                console.error('❌ ERRO NA CONEXÃO:', testError);
                throw new Error(`Falha na conexão: ${testError.message}`);
            }

            // Query completa - testa primeiro SEM o JOIN
            console.log('📥 Buscando anúncios sem JOIN...');
            const { data: dataSimples, error: errorSimples } = await supabase
                .from('anuncios')
                .select('*')
                .eq('status', 'ativo');
            
            console.log('✅ Anúncios sem JOIN:', dataSimples?.length);
            
            // Agora tenta com JOIN
            const { data, error } = await supabase
                .from('anuncios')
                .select(`
                    *,
                    profiles!user_id (
                        id,
                        email,
                        full_name,
                        phone,
                        address,
                        category,
                        company_name,
                        is_partner
                    )
                `)
                .eq('status', 'ativo')
                .order('created_at', { ascending: false });

            console.log('📡 Resposta do Supabase:', { 
                data: data, 
                error: error,
                totalAnuncios: data?.length 
            });

            if (error) {
                console.error('❌ ERRO DO SUPABASE:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });
                throw error;
            }
            
            publicAnuncios = data || [];
            console.log('✅ Anúncios carregados com SUCESSO:', publicAnuncios.length);
            
            if (publicAnuncios.length > 0) {
                console.log('📋 Exemplo de anúncio:', publicAnuncios[0]);
                console.table(publicAnuncios.map(a => ({
                    titulo: a.titulo,
                    categoria: a.categoria,
                    status: a.status,
                    empresa: a.profiles?.company_name || 'N/A'
                })));
            } else {
                console.warn('⚠️ ARRAY VAZIO! Possíveis causas:');
                console.warn('1. Todos os anúncios estão com status diferente de "ativo"');
                console.warn('2. RLS está bloqueando');
                console.warn('3. Tabela está vazia');
            }
            
            this.applyFiltersAndRender(); 
        } catch (error) {
            console.error('❌ ERRO CRÍTICO:', error);
            console.error('Stack trace:', error.stack);
            this.setError(`Erro ao carregar: ${error.message}`);
        } finally {
            this.setLoading(false);
        }
    }

    applyFiltersAndRender() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput?.value?.toLowerCase()?.trim() || '';
        const activeCategories = Array.from(document.querySelectorAll('input[name="filter"]:checked')).map(cb => cb.value);

        console.log('🔍 FILTROS APLICADOS:', { 
            searchTerm, 
            activeCategories,
            totalAnuncios: publicAnuncios.length 
        });

        let filteredAnuncios = [...publicAnuncios];

        // Filtro de categoria
        if (activeCategories.length > 0) {
            console.log('📂 Filtrando por categorias:', activeCategories);
            filteredAnuncios = filteredAnuncios.filter(anuncio => {
                console.log(`- Anúncio "${anuncio.titulo}": categoria="${anuncio.categoria}"`);
                const match = activeCategories.includes(anuncio.categoria);
                console.log(`  → Match: ${match}`);
                return match;
            });
            console.log('✅ Após filtro de categoria:', filteredAnuncios.length);
        }

        // Filtro de busca
        if (searchTerm) {
            console.log('🔎 Filtrando por busca:', searchTerm);
            filteredAnuncios = filteredAnuncios.filter(anuncio => {
                const profile = anuncio.profiles;
                const searchString = [
                    anuncio.titulo || '',
                    anuncio.descricao || '',
                    anuncio.servicos || '',
                    profile?.company_name || '',
                    profile?.full_name || ''
                ].filter(Boolean).join(' ').toLowerCase();
                
                console.log(`- Anúncio "${anuncio.titulo}"`);
                console.log(`  String de busca: "${searchString.substring(0, 100)}..."`);
                
                const match = searchString.includes(searchTerm);
                console.log(`  → Match com "${searchTerm}": ${match}`);
                return match;
            });
            console.log('✅ Após filtro de busca:', filteredAnuncios.length);
        }
        
        console.log('📊 RESULTADO FINAL:', filteredAnuncios.length, 'anúncios');
        this.render(filteredAnuncios);
    }

    render(anuncios) {
        this.container.innerHTML = '';
        const resultsCount = document.getElementById('resultsCount');

        if (anuncios.length === 0) {
            this.setEmpty(true);
            if (resultsCount) resultsCount.textContent = 'Nenhum resultado encontrado';
            return;
        }
        
        this.setEmpty(false);
        if (resultsCount) resultsCount.textContent = `${anuncios.length} resultado${anuncios.length !== 1 ? 's' : ''} encontrado${anuncios.length !== 1 ? 's' : ''}`;

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
        const imagemHtml = anuncio.imagem ? `<div class="anuncio-image"><img src="${anuncio.imagem}" alt="${anuncio.titulo}"></div>` : '';

        card.innerHTML = `
            ${imagemHtml}
            <div class="public-anuncio-header">
                <h3 class="public-anuncio-title">${anuncio.titulo || 'Título'}</h3>
                <p class="public-anuncio-empresa">${displayName}</p>
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
        
        const precoTexto = anuncio.preco ? `R$ ${parseFloat(anuncio.preco).toFixed(2)}` : 'A consultar';
        const telefoneTexto = profile?.phone || 'Não informado';
        const enderecoTexto = profile?.address || 'Não informado';
        const anuncianteTexto = profile?.company_name || profile?.full_name || 'Não informado';

        this.modalBody.innerHTML = `
            ${imagemHtml}
            <h4 class="modal-details-title">${anuncio.titulo}</h4>
            <p class="modal-details-anunciante">
                <i class="fas fa-store"></i>
                <strong>Anunciante:</strong> ${anuncianteTexto}
            </p>
            <p class="modal-details-description">${anuncio.descricao}</p>
            
            ${anuncio.servicos ? `
                <div class="modal-details-section">
                    <h5><i class="fas fa-cogs"></i> Serviços Oferecidos</h5>
                    <p>${anuncio.servicos}</p>
                </div>
            ` : ''}
            
            <div class="modal-details-section">
                <h5><i class="fas fa-dollar-sign"></i> Preço</h5>
                <p>${precoTexto}</p>
            </div>

            <hr>
            
            <div class="modal-details-section">
                <h5><i class="fas fa-info-circle"></i> Informações de Contato</h5>
                <p class="contact-info">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Endereço:</strong> ${enderecoTexto}
                </p>
                <p class="contact-info">
                    <i class="fab fa-whatsapp"></i>
                    <strong>Telefone/WhatsApp:</strong> ${telefoneTexto}
                </p>
                ${anuncio.contato ? `
                    <p class="contact-info">
                        <i class="fas fa-globe"></i>
                        <strong>Outros Contatos:</strong> ${anuncio.contato}
                    </p>
                ` : ''}
            </div>
        `;
        modalManager.openModal('detailsModal');
    }

    setLoading(isLoading) { 
        if (this.loadingEl) this.loadingEl.style.display = isLoading ? 'block' : 'none'; 
    }
    
    setError(message) {
        if (this.emptyEl) {
            this.emptyEl.innerHTML = `<div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div><h4>Ocorreu um erro</h4><p>${message}</p>`;
            this.setEmpty(true);
        }
    }
    
    setEmpty(show) { 
        if (this.emptyEl) this.emptyEl.style.display = show ? 'block' : 'none'; 
    }
}

// ===== GERENCIADOR DE ANÚNCIOS =====
class AnunciosManager {
    constructor() {
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
        
        imagePreview.addEventListener('click', () => imageInput.click());
        
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
        
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageFile(file);
            }
        });
        
        btnRemover?.addEventListener('click', () => {
            this.removeImage();
        });
    }
    
    handleImageFile(file) {
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
    
    async loadAnuncios() {
        const container = document.getElementById('anunciosListContainer');
        if (!container) return;
        
        if (!currentUser) {
            container.innerHTML = '<p>Você precisa estar logado.</p>';
            return;
        }
        
        if (!userProfile || !userProfile.is_partner) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <h4>Acesso Negado</h4>
                    <p>Apenas parceiros podem criar e gerenciar anúncios.</p>
                    <p>Torne-se um parceiro para começar a divulgar seus serviços!</p>
                </div>
            `;
            return;
        }
        
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            
            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-bullhorn"></i></div>
                        <h4>Nenhum anúncio cadastrado</h4>
                        <p>Crie seu primeiro anúncio para começar a divulgar seus serviços</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            data.forEach(anuncio => {
                const card = this.createAnuncioManagementCard(anuncio);
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Erro ao carregar anúncios:', error.message);
            toastManager.show('Erro ao carregar seus anúncios.', 'error');
        }
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
                <button class="btn btn-sm btn-outline btn-edit-anuncio" data-id="${anuncio.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm ${anuncio.status === 'ativo' ? 'btn-warning' : 'btn-primary'} btn-toggle-anuncio" data-id="${anuncio.id}">
                    <i class="fas fa-${anuncio.status === 'ativo' ? 'pause' : 'play'}"></i>
                    ${anuncio.status === 'ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn btn-sm btn-danger btn-delete-anuncio" data-id="${anuncio.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        const btnEdit = card.querySelector('.btn-edit-anuncio');
        const btnToggle = card.querySelector('.btn-toggle-anuncio');
        const btnDelete = card.querySelector('.btn-delete-anuncio');
        
        if (btnEdit) {
            btnEdit.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openAnuncioModal(anuncio.id);
            });
        }
        
        if (btnToggle) {
            btnToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleAnuncioStatus(anuncio.id);
            });
        }
        
        if (btnDelete) {
            btnDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteAnuncio(anuncio.id);
            });
        }
        
        return card;
    }

    async openAnuncioModal(anuncioId = null) {
        if (!userProfile || !userProfile.is_partner) {
            toastManager.show('Apenas parceiros podem criar anúncios.', 'error');
            return;
        }
        
        const modal = document.getElementById('modalAnuncio');
        const form = document.getElementById('formAnuncio');
        const title = document.getElementById('anuncioModalTitle');
        
        if (anuncioId) {
            try {
                const { data, error } = await supabase
                    .from('anuncios')
                    .select('*')
                    .eq('id', anuncioId)
                    .eq('user_id', currentUser.id)
                    .single();
                    
                if (error) throw error;
                
                if (data) {
                    title.textContent = 'Editar Anúncio';
                    document.getElementById('anuncio_id').value = data.id;
                    document.getElementById('anuncio_titulo').value = data.titulo;
                    document.getElementById('anuncio_descricao').value = data.descricao;
                    document.getElementById('anuncio_categoria').value = data.categoria;
                    document.getElementById('anuncio_servicos').value = data.servicos || '';
                    document.getElementById('anuncio_preco').value = data.preco || '';
                    document.getElementById('anuncio_contato').value = data.contato || '';
                    
                    if (data.imagem) {
                        this.currentImageData = data.imagem;
                        document.getElementById('anuncio_imagem_data').value = data.imagem;
                        this.updateImagePreview(data.imagem);
                    } else {
                        this.removeImage();
                    }
                    
                    this.currentEditId = anuncioId;
                }
            } catch (error) {
                console.error('Erro ao carregar anúncio:', error.message);
                toastManager.show('Erro ao carregar o anúncio.', 'error');
                return;
            }
        } else {
            title.textContent = 'Novo Anúncio';
            form.reset();
            document.getElementById('anuncio_id').value = '';
            this.currentEditId = null;
            this.removeImage();
        }
        
        modalManager.openModal('modalAnuncio');
    }

    async handleAnuncioSubmit(event) {
        event.preventDefault();
        
        if (!currentUser) {
            toastManager.show('Você precisa estar logado.', 'error');
            return;
        }
        
        if (!userProfile || !userProfile.is_partner) {
            toastManager.show('Apenas parceiros podem criar anúncios.', 'error');
            return;
        }
        
        const form = event.target;
        const formData = new FormData(form);
        
        const anuncioData = {
            titulo: formData.get('titulo'),
            descricao: formData.get('descricao'),
            categoria: formData.get('categoria'),
            servicos: formData.get('servicos') || null,
            preco: formData.get('preco') || null,
            contato: formData.get('contato') || null,
            imagem: this.currentImageData || null,
            status: 'ativo',
            user_id: currentUser.id
        };
        
        try {
            if (this.currentEditId) {
                const { error } = await supabase
                    .from('anuncios')
                    .update(anuncioData)
                    .eq('id', this.currentEditId)
                    .eq('user_id', currentUser.id);
                    
                if (error) throw error;
                toastManager.show('Anúncio atualizado com sucesso!', 'success');
            } else {
                const { error } = await supabase
                    .from('anuncios')
                    .insert([anuncioData]);
                    
                if (error) throw error;
                toastManager.show('Anúncio criado com sucesso!', 'success');
            }
            
            modalManager.closeModal('modalAnuncio');
            this.loadAnuncios();
            publicAnunciosManager.fetchAllAnuncios();
        } catch (error) {
            console.error('Erro ao salvar anúncio:', error.message);
            toastManager.show('Erro ao salvar o anúncio. Verifique os dados.', 'error');
        }
    }
    
    async toggleAnuncioStatus(anuncioId) {
        try {
            const { data: anuncio, error: fetchError } = await supabase
                .from('anuncios')
                .select('status')
                .eq('id', anuncioId)
                .eq('user_id', currentUser.id)
                .single();
                
            if (fetchError) throw fetchError;
            
            const newStatus = anuncio.status === 'ativo' ? 'inativo' : 'ativo';
            
            const { error } = await supabase
                .from('anuncios')
                .update({ status: newStatus })
                .eq('id', anuncioId)
                .eq('user_id', currentUser.id);
                
            if (error) throw error;
            
            toastManager.show('Status do anúncio atualizado!', 'success');
            this.loadAnuncios();
            publicAnunciosManager.fetchAllAnuncios();
        } catch (error) {
            console.error('Erro ao alterar status:', error.message);
            toastManager.show('Erro ao alterar o status do anúncio.', 'error');
        }
    }
    
    async deleteAnuncio(anuncioId) {
        if (!confirm('Tem certeza que deseja excluir este anúncio?')) return;
        
        try {
            const { error } = await supabase
                .from('anuncios')
                .delete()
                .eq('id', anuncioId)
                .eq('user_id', currentUser.id);
                
            if (error) throw error;
            
            toastManager.show('Anúncio excluído com sucesso!', 'success');
            this.loadAnuncios();
            publicAnunciosManager.fetchAllAnuncios();
        } catch (error) {
            console.error('Erro ao excluir anúncio:', error.message);
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

    const searchInput = document.getElementById('searchInput');
    const filterCheckboxes = document.querySelectorAll('input[name="filter"]');
    const clearSearchBtn = document.getElementById('clearSearch');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                publicAnunciosManager.applyFiltersAndRender();
            }, 300);
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
            }
        });
    }

    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            publicAnunciosManager.applyFiltersAndRender();
        });
    });
    
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
                publicAnunciosManager.applyFiltersAndRender();
            }
        });
    }

    document.getElementById('excluirContaLink')?.addEventListener('click', async () => {
        if (confirm('ATENÇÃO: Esta ação é irreversível! Deseja realmente excluir sua conta?')) {
            try {
                await supabase.from('anuncios').delete().eq('user_id', currentUser.id);
                await supabase.from('profiles').delete().eq('id', currentUser.id);
                await supabase.auth.signOut();
                
                toastManager.show('Conta excluída com sucesso.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                console.error('Erro ao excluir conta:', error.message);
                toastManager.show('Erro ao excluir a conta. Entre em contato com o suporte.', 'error');
            }
        }
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