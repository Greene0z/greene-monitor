# Greene — Monitor Pessoal V1

Aplicação mobile-first para registrar sono, estado diário, hábitos, leituras, estudos e objetivos.

## Arquitetura
- Frontend estático: GitHub Pages
- Login + banco: Supabase
- Segurança: Row Level Security (cada usuário só acessa as próprias linhas)

## Configuração
1. Crie um projeto no Supabase.
2. Abra o SQL Editor, cole e execute `schema.sql`.
3. Em Settings/API, copie **Project URL** e a chave **anon/public**.
4. Cole esses dois valores em `config.js`. Nunca use a `service_role`.
5. Crie um repositório no GitHub e envie os arquivos.
6. Settings → Pages → Deploy from a branch → `main` / `/root`.
7. Abra a URL fornecida pelo GitHub Pages.
8. Crie sua conta pela tela inicial e faça login no celular e no PC.

Se a confirmação de e-mail estiver habilitada no Supabase, confirme o e-mail antes do primeiro login.

## V1
- Dashboard
- Check-in diário
- Sono
- Hábitos
- Biblioteca
- Estudos
- Objetivos
- Estatísticas iniciais
- Exportação JSON
- Autenticação e sincronização multi-dispositivo
