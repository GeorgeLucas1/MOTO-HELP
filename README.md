# 🏍️ MOTO HELP - SISTEMA DE GESTÃO WEB PARA O MERCADO DE SERVIÇOS PARA MOTOCICLISTAS EM MANAUS

Este projeto é uma plataforma web interativa desenvolvida para auxiliar motociclistas, com sistema completo de autenticação e gerenciamento de Anúncios. Utiliza **Supabase** para autenticação e gerenciamento de dados em tempo real.

#🎥 Vídeo de Apresentação do Projeto

📌 Assista ao vídeo oficial de apresentação do Moto Help:
👉 https://www.youtube.com/watch?v=gtCFli9_CrI
## 📸 Capturas de Tela

### Tela Inicial
![Tela Inicial](https://github.com/user-attachments/assets/986687bc-2484-4d22-8343-4692f0e72f47)

### Tela de Login e Tela de Cadastro
![Tela de Login e Tela de Cadastro](https://github.com/user-attachments/assets/bd550f12-0db9-4893-9518-b5378a88085c)

### Portal Principal e Menu de Navegação
![Portal Principal e Menu de Navegação](https://github.com/user-attachments/assets/7849908c-1f91-4ab7-9176-8b79fa053f54)

### Chat-bot
![Chat-bot](https://github.com/user-attachments/assets/742b8613-050c-43c3-aca8-06a09c835bf2)

### Gerenciar Anúncios
![Gerenciar Anúncios](https://github.com/user-attachments/assets/22695212-87b3-41fe-b638-318cf100f38d)

## 🚀 Funcionalidades

- ✅ Cadastro e login de usuários com Supabase Auth
- ✅ Validação de e-mails e tratamento de erros
- ✅ Sistema de autenticação seguro
- ✅ Páginas dinâmicas e interativas
- ✅ Design responsivo com CSS personalizado
- ✅ Integração completa com Supabase (Authentication + Database)
- ✅ Gerenciamento de sessões de usuário
- ✅ Proteção de rotas autenticadas

## 🧩 Estrutura do Projeto

```
MOTO-HELP/
├── public/
│   └── assets/              # Recursos estáticos (imagens, ícones)
├── home/
│   ├── index.html           # Página inicial
│   ├── script.js            # Scripts da página inicial
│   ├── styles.css           # Estilos da página inicial
│   └── gemini-config.js     # Configurações adicionais
├── login/
│   ├── index.html           # Página de login
│   ├── script.js            # Lógica de autenticação
│   └── styles.css           # Estilos da tela de login
├── routes/                  # Gerenciamento de rotas
├── views/                   # Views adicionais
├── .env                     # Variáveis de ambiente (não versionado)
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Descrição |
| :--- | :--- |
| **HTML5** | Estrutura das páginas |
| **CSS3** | Estilização e responsividade |
| **JavaScript (ES6+)** | Lógica e interatividade |
| **Supabase** | Backend as a Service (Authentication + Database) |

## ⚙️ Pré-requisitos

Antes de começar, você precisará ter:

- Navegador web moderno
- Conta no [Supabase](https://supabase.com)
- Editor de código (recomendado: VS Code)
- Node.js instalado (opcional, para servidor local)

## ⚙️ Configuração

1. Configure as tabelas necessárias no Supabase Dashboard.

## 🚦 Como Executar o Projeto

### Opção 1: Diretamente no Navegador

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/moto-help.git

# Navegue até a pasta
cd moto-help

# Abra o arquivo index.html no navegador
```

### Opção 2: Com Servidor Local

```bash
# Clone o repositório
git clone https://github.com/GeorgeLucas1/MOTO-HELP

# Navegue até a pasta
cd moto-help

# Inicie um servidor local (Python)
python -m http.server 8000

# Ou usando Node.js com live-server
npx live-server
```

Acesse `http://localhost:8000` no navegador.

## 📋 Funcionalidades Detalhadas

### Autenticação
- Cadastro de novos usuários com validação de e-mail
- Login seguro com Supabase Auth
- Logout e gerenciamento de sessão

### Portal do Usuário
- Dashboard personalizado
- Acesso a serviços dos equipamentos vendidos
- Perfil editável

## 🔒 Segurança

- Senhas criptografadas pelo Supabase
- Tokens JWT para autenticação
- Validação client-side e server-side
- Proteção contra SQL Injection
- CORS configurado adequadamente

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 👨‍💻 Autores

- **GEORGE LUCAS SILVA LEITÃO**
  - GitHub: [@georgelucas](https://github.com/georgelucas)
- **Rafhael Ellinkel Lopes Dias**
-   - GitHub: [@rafhaeldias13-gif](https://github.com/rafhaeldias13-gif)

- **João Viktor Mota da Silva Pierre**

## 👩‍🏫 Orientadora

- **Luana Leal**



## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do email: georgelucas.leitao20004@gmail.com


---

💼 Projeto desenvolvido para estudos e prática em desenvolvimento web com foco em autenticação e gerenciamento de Anúncios.

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
