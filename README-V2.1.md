# Greene Monitor V2.1 — UX & Knowledge

## IMPORTANTE
O ZIP NÃO contém `config.js`. Mantenha o `config.js` atual do seu GitHub sem alterações.

## Atualização
1. No Greene atual, faça **Exportar JSON**.
2. No Supabase > SQL Editor, execute `migration-v2.1.sql` **uma vez**.
3. No GitHub, substitua apenas:
   - `index.html`
   - `style.css`
   - `app.js`
4. Faça commit e aguarde o GitHub Pages publicar.
5. Use Ctrl+Shift+R.

## O que mudou
- Botão do cabeçalho agora é contextual.
- Calendário não mostra um botão "Registrar" sem contexto.
- Hábitos ganharam calendário mensal por hábito.
- É possível marcar/desmarcar qualquer dia do mês diretamente no hábito.
- Estatísticas de hábito: mês, taxa, sequência e recorde.
- Novo módulo Notas:
  - Markdown simples
  - tags
  - favoritos
  - `[[links entre notas]]`
  - backlinks
  - busca
  - anexos privados pelo Supabase Storage
- Command Palette / busca global com Ctrl+K (Cmd+K no Mac).
- Botão central + no celular abre a Command Palette.
- Mais microanimações no login, navegação, cards, progresso, check-ins e carregamento.
- `prefers-reduced-motion` é respeitado.
- O comportamento anterior de Leituras foi preservado.

## Teste recomendado
1. Hábitos: toque em vários dias do calendário e atualize a página.
2. Notas: crie "Projeto A".
3. Crie outra nota contendo `[[Projeto A]]` e confira o backlink.
4. Anexe uma imagem ou PDF pequeno e tente abrir.
5. Pressione Ctrl+K e busque uma nota/livro/estudo.
6. Confira os botões de cabeçalho em cada aba.
7. Teste no celular, principalmente o botão central +.

## Observações
- Limite configurado para anexos: 20 MB por arquivo.
- O bucket `notes-attachments` é privado.
- Os caminhos dos anexos começam pelo ID do usuário e possuem políticas RLS/Storage.
- A V2.2 será dedicada a gráficos, comparações semanais/mensais e insights.
