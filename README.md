<div align="center">

<img src="public/Nova-logo.png" alt="App Ecolimpo — Coleta Seletiva" width="260"/>

# App Ecolimpo — Coleta Seletiva

**Aplicativo web que organiza a coleta de recicláveis nos condomínios atendidos pela Cooperativa Ecolimpo (São Sebastião – DF).**

<a href="https://app.cooperaecolimpo.com.br"><img src="https://img.shields.io/badge/🌐_Ver_site_no_ar-app.cooperaecolimpo.com.br-0b5cad?style=for-the-badge" alt="Site no ar"/></a> <img src="https://img.shields.io/badge/status-no%20ar-success?style=for-the-badge" alt="status"/>

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/> <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/> <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/> <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/> <img src="https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA"/>

</div>

---

## 📌 Sobre o projeto

Moradores dos condomínios atendidos pela cooperativa usam o app para saber **quando a coleta passa**, **como separar o lixo** e **falar com a cooperativa**. A equipe da Ecolimpo usa um **painel administrativo** para acompanhar os condomínios, ler as respostas e publicar avisos.

Projeto real, em produção, desenvolvido por mim do início ao fim: telas, servidor, banco de dados e publicação.

## ✨ Funcionalidades

- **Escolha do condomínio** e dias da coleta seletiva
- **Guia de separação** de recicláveis para os moradores
- **Lembrete no celular** (notificação push) no dia da coleta
- **Pesquisa e fale conosco** com proteção anti-robô (Cloudflare Turnstile)
- **Painel da cooperativa** com login em duas etapas: condomínios, respostas, avisos e backup
- **Cartaz com QR Code** para divulgar o app no condomínio
- Página de **privacidade** de acordo com a LGPD

## 🧠 Destaques técnicos

- Front-end em **React + Vite**, com rotas pelo React Router
- Banco de dados e autenticação no **Supabase** (PostgreSQL)
- Funções de servidor na **Vercel** (pasta `api/`) — a chave secreta nunca vai para o navegador
- Notificações com **Web Push** e tarefa diária agendada
- **Testes automatizados** (`npm test`) para regras, privacidade, painel e envio

## 🚀 Como rodar localmente

```bash
git clone https://github.com/fabiorodrigueslima/app-ecolimpo.git
cd app-ecolimpo
npm install
cp .env.example .env   # preencha as chaves do Supabase
npm run dev
```

---

## 👨‍💻 Autor

**Fabio Rodrigues de Lima** — Desenvolvedor Full Stack

[![Portfólio](https://img.shields.io/badge/Portfólio-fabiorodriguesdev.com.br-0b5cad?style=flat-square)](https://fabiorodriguesdev.com.br)
[![GitHub](https://img.shields.io/badge/GitHub-fabiorodrigueslima-181717?style=flat-square&logo=github)](https://github.com/fabiorodrigueslima)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Fabio%20Rodrigues-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/f%C3%A1bio-rodrigues-a89b543a4)
