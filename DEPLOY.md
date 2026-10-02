# Publicar para apresentação

A arquitetura gratuita recomendada é:

- **Frontend:** Vercel, conectado ao GitHub.
- **Backend:** Render, usando `render.yaml`.
- **Banco:** Neon PostgreSQL gratuito, conectado ao Render por `DATABASE_URL`.

## 1. Antes de publicar

1. Revogue a senha de aplicativo do Gmail que estava no `backend/app/settings.py`.
2. Gere uma nova chave secreta para produção.
3. Confira se o arquivo `.env` local não será enviado ao GitHub.
4. Faça commit apenas dos arquivos do projeto, nunca de senhas, tokens ou bancos locais.

O arquivo `backend/app/settings.py` agora lê as configurações por variáveis de ambiente. O SQLite continua sendo usado localmente quando `DATABASE_URL` não existe.

## 2. GitHub

Na raiz do projeto:

```powershell
git add .
git commit -m "Preparar deploy da aplicacao"
git push origin main
```

Se ainda não existir um repositório remoto, crie um repositório privado no GitHub e conecte-o antes do `git push`.

## 3. Banco Neon

Crie um projeto PostgreSQL no Neon e copie a URL de conexão. Ela será usada no Render como `DATABASE_URL`.

Não coloque essa URL em nenhum arquivo do projeto.

## 4. Backend no Render

1. Crie um **Web Service** a partir do repositório GitHub.
2. O Render pode usar o arquivo `render.yaml` automaticamente.
3. Configure estas variáveis:

```text
DATABASE_URL=URL_DO_NEON
DJANGO_ALLOWED_HOSTS=seu-servico.onrender.com
CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app
CSRF_TRUSTED_ORIGINS=https://seu-frontend.vercel.app
DJANGO_SECRET_KEY=uma-chave-longa-e-aleatoria
```

As variáveis `EMAIL_HOST_USER` e `EMAIL_HOST_PASSWORD` são opcionais. Sem elas, o Django usa o console de e-mail.

O comando de build executa migrações e coleta arquivos estáticos. O serviço gratuito do Render pode dormir após um período sem acesso; o primeiro carregamento pode demorar.

## 5. Frontend na Vercel

1. Importe o mesmo repositório na Vercel.
2. Defina `frontend` como **Root Directory**.
3. Use `npm run build` como build command.
4. Use `dist` como output directory.
5. Configure:

```text
VITE_API_URL=https://seu-servico.onrender.com
```

O arquivo `frontend/vercel.json` mantém as rotas do React funcionando ao atualizar a página.

## 6. Ordem recomendada

Publique primeiro o backend, copie a URL dele, configure `VITE_API_URL` na Vercel e então copie a URL do frontend para `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` no Render.

Depois, abra a URL do frontend e teste cadastro, login, agendamento e consulta da API.
