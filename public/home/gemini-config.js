class GeminiChatBot {
    constructor() {
        // ==================================================================
        // IMPORTANTE: Substitua pela sua chave de API real
        // ==================================================================
        this.apiKey = 'AIzaSyB-9CMGSKDd7zViPAb0N906fcQLaAvryqM'; 
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
        this.conversationHistory = []; // Armazena pares de {role: 'user'/'model', content: 'mensagem'}
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
-  voce é capaz de criar descriçoes dos anuncios dos anunciantes
-  ajudar com os problema de motos e de carros
-quando perguntarem de precos. fale que moto helpe uma plataforma que oferece oficinas e empresas confiaveis
-as resposta tem quer direta evite dá respostas curtas 
- se pergunta for dificil e nao souber responder. fale que moto help é uma plataforma que oferece serviços de divulgaçoes de empresas ,oficina e mão de obra qualificada
- entender as causa dos problema e dá uma dica no que fazer relacionado ao problema do carro ou moto
- ultilizar termos técnicos quando um usuario enviar causa dos problema do carro e indicar a possivel causa
- consultar estimativa do preços de peças de motos como capacete,oleo e etc
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
                    <p>Olá! 🏍️ Eu sou o MOTO AI, seu assistente virtual do Moto Help! Como posso te ajudar hoje?</p>
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

        if (!chatBotButton) { console.error("Botão do Chatbot não encontrado!"); return; }

        chatBotButton.addEventListener("click", () => { chatBotOverlay.classList.add("active"); input.focus(); });
        closeButton.addEventListener("click", () => chatBotOverlay.classList.remove("active"));
        chatBotOverlay.addEventListener("click", (e) => { if (e.target === chatBotOverlay) chatBotOverlay.classList.remove("active"); });
        sendButton.addEventListener("click", () => this.sendMessage());
        input.addEventListener("keypress", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.sendMessage(); } });
        input.addEventListener("input", () => { sendButton.disabled = input.value.trim() === ""; });
    }

    async sendMessage() {
        const input = document.getElementById("chatbot-input");
        const message = input.value.trim();
        if (!message || this.isTyping) return;

        this.addMessage(message, "user");
        this.conversationHistory.push({ role: "user", content: message }); // Adiciona a mensagem do usuário ao histórico

        input.value = "";
        document.getElementById("chatbot-send").disabled = true;
        this.showTypingIndicator();

        try {
            const response = await this.callGeminiAPI(); // Não passa a mensagem aqui, pois já está no histórico
            this.hideTypingIndicator();
            const formattedResponse = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
            this.addMessage(formattedResponse, "bot");
        } catch (error) {
            this.hideTypingIndicator();
            console.error("Erro ao comunicar com Gemini:", error);
            this.addMessage("Desculpe, estou com problemas técnicos no momento. 🔧 Tente novamente em alguns instantes!", "bot");
        }
    }

    async callGeminiAPI() {
        const contents = [];
        
        // Adicionar o histórico de conversação existente
        // A API Gemini exige uma alternância estrita de 'user' e 'model' no histórico.
        // O `conversationHistory` deve ser uma sequência de {role: 'user', content: '...'}, {role: 'model', content: '...'}, etc.
        for (const msg of this.conversationHistory) {
            contents.push({
                role: msg.role,
                parts: [{ text: msg.content }]
            });
        }

        const requestBody = {
            contents: contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512
            },
            // system_instruction é o campo correto para o prompt do sistema
            system_instruction: { parts: [{ text: this.systemPrompt }] }
        };

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("API Error:", errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error("Resposta inesperada da API:", data);
            return 'Desculpe, não consegui processar sua mensagem desta vez.';
        }

        const botResponse = data.candidates[0].content.parts[0].text;

        // Adicionar a resposta do bot ao histórico
        this.conversationHistory.push({ role: 'model', content: botResponse });

        // Limitar o histórico para evitar que fique muito longo
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = this.conversationHistory.slice(-10);
        }

        return botResponse;
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById("chatbot-messages");
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${sender}-message`;
        const avatarHTML = sender === "bot" ? `<div class="message-avatar"><i class="fas fa-robot"></i></div>` : "";
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

