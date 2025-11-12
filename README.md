# 🏍️ MOTO HELP - Sistema de Ajuda para Motociclistas

Este projeto é uma plataforma web interativa desenvolvida para auxiliar motociclistas, com sistema completo de autenticação e gerenciamento de usuários. Utiliza **Supabase** para autenticação e gerenciamento de dados em tempo real.

## 📸 Capturas de Tela

*(Adicione suas capturas de tela aqui)*

- Tela Inicial
- Tela de Login
- Tela de Cadastro
- Portal Principal
- Menu de Navegação
- Área de Serviços
- Favoritos

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
│
├── public/
│   └── assets/              # Recursos estáticos (imagens, ícones)
│
├── home/
│   ├── index.html           # Página inicial
│   ├── script.js            # Scripts da página inicial
│   ├── styles.css           # Estilos da página inicial
│   └── gemini-config.js     # Configurações adicionais
│
├── login/
│   ├── index.html           # Página de login
│   ├── script.js            # Lógica de autenticação
│   └── styles.css           # Estilos da tela de login
│
├── routes/                  # Gerenciamento de rotas
├── views/                   # Views adicionais
├── .env                     # Variáveis de ambiente (não versionado)
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização e responsividade
- **JavaScript (ES6+)** - Lógica e interatividade
- **Supabase** - Backend as a Service (Authentication + Database)

## ⚙️ Pré-requisitos

Antes de começar, você precisará ter:

- Navegador web moderno
- Conta no [Supabase](https://supabase.com)
- Editor de código (recomendado: VS Code)
- Node.js instalado (opcional, para servidor local)

## 🔧 Configuração do Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Acesse as configurações do projeto e copie:
   - `Project URL`
   - `anon/public key`
4. Crie um arquivo `.env` na raiz do projeto:

```env
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
```

5. Configure as tabelas necessárias no Supabase Dashboard

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
git clone https://github.com/seu-usuario/moto-help.git

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
- Recuperação de senha
- Logout e gerenciamento de sessão

### Portal do Usuário
- Dashboard personalizado
- Acesso a serviços de auxílio
- Sistema de favoritos
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

**GEORGE LUCAS SILVA LEITÃO**
- GitHub: [@georgelucas](https://github.com/georgelucas)

**Rafhael Ellinkel Lopes Dias**

**João Viktor Mota da Silva Pierre**

## 👩‍🏫 Orientadora

**Luana Leal**

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Contato

Para dúvidas ou sugestões, entre em contato através do email: contato@motohelp.com

---

💼 Projeto desenvolvido para estudos e prática em desenvolvimento web com foco em autenticação e gerenciamento de usuários.

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
