class GeminiChatBot {
    constructor() {
        // ==================================================================
        // IMPORTANTE: Substitua pela sua chave de API real válida
        // Obtenha uma em: https://ai.google.dev/gemini-api/docs/api-key
        // ==================================================================
        this.apiKey = 'AIzaSyA3o21GKXs8nRG5j4_G5TBLp1ZcXvRUmus'; 
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
        this.conversationHistory = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.setupPersonality();
        this.createChatBotElements();
        this.setupEventListeners();
    }

    setupPersonality() {
        this.systemPrompt = `
Você é o MOTO AI, um assistente virtual fofo e especializado em motocicletas e serviços automotivos. 
Você trabalha para o Moto Help, uma plataforma que conecta motociclistas com oficinas e mecânicos especializados.

Características da sua personalidade:
- Sempre muito simpático, prestativo e entusiasmado.
- Usa emojis relacionados a motos (🏍️, 🔧, ⚙️, 🛠️) com frequência.
- Ajuda em planejar troca de peças de motos.
- Você é capaz de criar descrições dos anúncios dos anunciantes.
- Ajudar com os problemas de motos e de carros.
- Quando perguntarem de preços, fale que Moto Help é uma plataforma que oferece oficinas e empresas confiáveis.
- As respostas têm que ser diretas, evite dar respostas curtas.
- Se a pergunta for difícil e não souber responder, fale que Moto Help é uma plataforma que oferece serviços de divulgações de empresas, oficina e mão de obra qualificada.
- Entender as causas dos problemas e dar uma dica no que fazer relacionado ao problema do carro ou moto.
- Utilizar termos técnicos quando um usuário enviar causas dos problemas do carro e indicar a possível causa.
- Consultar estimativa dos preços de peças de motos como capacete, óleo e etc.
- Se perguntarem quem desenvolveu o Moto Help, diga que foi trabalho de conclusão da Fametro.
- Conhece muito sobre motocicletas, manutenção, peças e serviços.
- Sempre tenta ajudar o usuário a encontrar soluções para problemas com motos.
- Promove os serviços da plataforma Moto Help quando apropriado.
- Você não consulta o banco de dados diretamente. Se o usuário perguntar sobre buscar um mecânico ou oficina, peça a ele para usar a barra de pesquisa do site.
- Fala de forma amigável e acessível, evitando termos muito técnicos.
- Sempre termina as respostas perguntando se pode ajudar em mais alguma coisa.
        `;
    }

    createChatBotElements() {
        const chatBotOverlayHTML = `
<div id="chatbot-overlay" class="chatbot-overlay">
    <div id="chatbot-popup">
        <div class="chatbot-header">
            <div class="chatbot-avatar"><i class="fas fa-robot"></i></div>
            <div class="chatbot-info">
                <h3>MOTO AI-Chat-bot</h3>
                <span>Agente com Inteligência Artificial desenvolvido para auxiliar na tomada de decisões.</span>
            </div>
            <button class="chatbot-close" id="chatbot-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages">
            <div class="message bot-message">
                <div class="message-avatar"><i class="fas fa-robot"></i></div>
                <div class="message-content">
                    <p>Olá! 🏍️ Eu sou o MOTO AI-Chat-bot, seu assistente virtual do Moto Help! Como posso te ajudar hoje?</p>
                </div>
            </div>
        </div>
        <div class="chatbot-input-area">
            <div class="input-container">
                <input type="text" id="chatbot-input" placeholder="Digite sua mensagem..." maxlength="500">
                <button id="chatbot-send" disabled><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>
</div>`;
        const chatBotButtonHTML = `<div id="chatbot-button"><div class="chatbot-icon"><i class="fas fa-robot"></i></div></div>`;
        document.body.insertAdjacentHTML("beforeend", chatBotOverlayHTML);
        document.body.insertAdjacentHTML("beforeend", chatBotButtonHTML);
    }

    setupEventListeners() {
        const chatBotButton = document.getElementById("chatbot-button");
        const chatBotOverlay = document.getElementById("chatbot-overlay");
        const closeButton = document.getElementById("chatbot-close");
        const input = document.getElementById("chatbot-input");
        const sendButton = document.getElementById("chatbot-send");

        if (!chatBotButton) { 
            console.error("Botão do Chatbot não encontrado!"); 
            return; 
        }

        chatBotButton.addEventListener("click", () => { 
            chatBotOverlay.classList.add("active"); 
            input.focus(); 
        });
        
        closeButton.addEventListener("click", () => chatBotOverlay.classList.remove("active"));
        
        chatBotOverlay.addEventListener("click", (e) => { 
            if (e.target === chatBotOverlay) chatBotOverlay.classList.remove("active"); 
        });
        
        sendButton.addEventListener("click", () => this.sendMessage());
        
        input.addEventListener("keypress", (e) => { 
            if (e.key === "Enter" && !e.shiftKey) { 
                e.preventDefault(); 
                this.sendMessage(); 
            } 
        });
        
        input.addEventListener("input", () => { 
            sendButton.disabled = input.value.trim() === ""; 
        });
    }

    async sendMessage() {
        const input = document.getElementById("chatbot-input");
        const message = input.value.trim();
        if (!message || this.isTyping) return;

        this.addMessage(message, "user");
        input.value = "";
        document.getElementById("chatbot-send").disabled = true;
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(message);
            this.hideTypingIndicator();
            const formattedResponse = response
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br>");
            this.addMessage(formattedResponse, "bot");
            
            // Adicionar a mensagem do usuário e a resposta do bot ao histórico
            this.conversationHistory.push({ role: "user", parts: [{ text: message }] });
            this.conversationHistory.push({ role: "model", parts: [{ text: response }] });

        } catch (error) {
            this.hideTypingIndicator();
            console.error("Erro ao comunicar com Gemini:", error);
            
            let errorMessage = "Desculpe, estou com problemas técnicos no momento. 🔧";
            
            if (error.message.includes('403')) {
                errorMessage = "⚠️ Erro de autenticação! Verifique se a chave de API está correta e ativa. Configure uma chave válida em: https://ai.google.dev/gemini-api/docs/api-key";
            } else if (error.message.includes('404')) {
                errorMessage = "⚠️ Modelo não encontrado. Verifique o nome do modelo na API.";
            } else if (error.message.includes('429')) {
                errorMessage = "⚠️ Limite de requisições atingido. Aguarde alguns momentos e tente novamente.";
            }
            
            this.addMessage(errorMessage, "bot");
        }
    }

    async callGeminiAPI(userMessage) {
        // Validar chave de API
        if (!this.apiKey || this.apiKey === 'SUA_CHAVE_API_AQUI') {
            throw new Error('403 - Chave de API não configurada');
        }

        // Construir histórico formatado
        const contents = [];
        
        // 1. Adicionar o prompt do sistema como primeira mensagem do usuário
        // O Gemini API usa o primeiro 'user' content para o system instruction
        contents.push({
            role: "user",
            parts: [{ text: this.systemPrompt }]
        });

        // 2. Adicionar o histórico da conversa (alternando user/model)
        // O histórico deve ser adicionado *antes* da mensagem atual do usuário
        // O histórico atual está vazio, mas a estrutura está pronta para uso futuro
        // for (const message of this.conversationHistory) {
        //     contents.push(message);
        // }

        // 3. Adicionar a mensagem atual do usuário
        contents.push({
            role: "user",
            parts: [{ text: userMessage }]
        });

        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("API Error Details:", errorBody);
            throw new Error(`HTTP error! status: ${response.status} - ${JSON.stringify(errorBody)}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error("Resposta inesperada da API:", data);
            
            // Verificar se foi bloqueado por segurança
            if (data.candidates?.[0]?.finishReason === 'SAFETY') {
                return 'Desculpe, não posso responder a essa pergunta por questões de segurança. Posso ajudar com outra coisa? 🏍️';
            }
            
            return 'Desculpe, não consegui processar sua mensagem desta vez. Tente reformular sua pergunta! 😊';
        }

        return data.candidates[0].content.parts[0].text;
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById("chatbot-messages");
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;
        const avatarHTML = sender === "bot" 
            ? `<div class="message-avatar"><i class="fas fa-robot"></i></div>` 
            : "";
        messageDiv.innerHTML = `${avatarHTML}<div class="message-content"><p>${content}</p></div>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        this.isTyping = true;

        const messagesContainer = document.getElementById("chatbot-messages");
        if (document.getElementById("typing-indicator")) return;

        const typingDiv = document.createElement("div");
        typingDiv.id = "typing-indicator";
        typingDiv.className = "message bot-message typing";
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-content">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>`;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById("typing-indicator");
        if (typingIndicator) typingIndicator.remove();
    }
}

// Inicializa o chatbot após o carregamento completo da página
document.addEventListener("DOMContentLoaded", () => {
    new GeminiChatBot();
});
