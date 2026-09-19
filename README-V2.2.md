# Greene Monitor V2.2 — Intelligence & Organization

Esta versão amplia a V2.1.1 sem apagar os dados existentes.

## Instalação
1. No site atual, gere um **Backup / Exportar JSON**.
2. Abra **Supabase → SQL Editor → New query**.
3. Execute o conteúdo de `migration-v2.2.sql` **uma única vez**.
4. No GitHub, substitua somente:
   - `index.html`
   - `style.css`
   - `app.js`
5. **Mantenha o seu `config.js` atual.** Este pacote não inclui `config.js`.
6. Faça commit, aguarde o GitHub Pages publicar e use `Ctrl+Shift+R`.

## Principais novidades

### Analytics
- períodos de 7, 30 e 90 dias;
- período personalizado;
- comparação com o período imediatamente anterior;
- gráficos de energia, humor, foco, estresse, sono, leitura e estudo;
- resumo do período;
- resumo da semana e do mês atuais;
- insights descritivos com tamanho da amostra, sem afirmar causalidade.

### Objetivos automáticos
Uma meta pode acompanhar automaticamente:
- páginas lidas;
- minutos de estudo;
- minutos de exercício;
- hábitos concluídos.

### Notas / PKM
- Inbox;
- pastas;
- templates;
- templates iniciais automáticos;
- nota diária;
- Markdown e tabela simples;
- `[[links]]` e backlinks;
- relações com livros, objetivos, estudos e dias;
- anexos;
- carregamento paginado de notas;
- conteúdo da nota carregado sob demanda para reduzir latência.

### Dashboard e personalização
- cards configuráveis;
- ordem dos cards alterável;
- nome “Greene” pode ser substituído pelo nome que o usuário quiser;
- cores de destaque;
- modo claro/escuro preservado.

### Conta e segurança
- alteração de senha;
- e-mail de redefinição de senha;
- backup JSON completo das tabelas;
- exclusão da própria conta e dos dados vinculados.

### Fundação RPG V2.3
O banco já recebe a base para:
- personagem;
- opção de apresentação **feminina, masculina ou neutra**;
- nome do personagem;
- XP, nível e moedas;
- inventário;
- conquistas;
- quests e progresso de quests.

A arte pixel art completa, criador visual, itens e sistema de recompensas entram na V2.3. A V2.2 mostra apenas uma prévia estrutural do avatar nas Configurações e no dashboard.

## Teste recomendado
1. Abra **Configurações** e altere “Nome do seu espaço”. Confirme que a marca muda na lateral.
2. Selecione apresentação feminina/masculina/neutra e salve o personagem.
3. Reordene e oculte alguns cards do dashboard.
4. Em **Notas**, crie uma pasta, um template e uma nota diária.
5. Troque rapidamente entre notas para verificar a melhora de desempenho.
6. Vincule uma nota a um livro ou objetivo.
7. Crie uma meta automática, por exemplo 100 páginas no mês.
8. Abra **Análises** e teste 7/30/90 dias e um intervalo personalizado.
9. Teste o backup completo.
10. Teste “Esqueci minha senha” apenas se quiser validar o fluxo de recuperação.

## Atenção
- Não execute schemas antigos novamente.
- Não substitua seu `config.js`.
- O backup JSON contém metadados dos anexos, não os bytes dos arquivos armazenados no Storage.
- A exclusão de conta é definitiva; a interface exige digitar `EXCLUIR` antes de executar.
