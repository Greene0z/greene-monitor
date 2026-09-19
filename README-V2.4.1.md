# Greene Monitor V2.4.1 — Stable Hotfix

Esta versão corrige o erro SQL:

`ERROR 42703: column x.kind does not exist`

## Causa
A função `search_my_greene` criava uma subconsulta `x`, mas as cinco colunas resultantes não receberam os aliases
`kind`, `entity_id`, `label`, `detail` e `event_date`.

A correção usa:

`as x(kind, entity_id, label, detail, event_date)`

## O que fazer

### Caminho recomendado
Se a V2.4 ainda não foi publicada:
1. Abra o Supabase SQL Editor.
2. Execute `migration-v2.4.1.sql`.
3. Depois publique os arquivos da V2.4 normalmente.

A migration é idempotente e foi colocada dentro de `BEGIN/COMMIT`, então pode ser executada novamente mesmo se parte da tentativa anterior tiver sido aplicada.

### Hotfix mínimo
Se você tiver certeza de que o restante da migration V2.4 já foi aplicado, pode executar apenas:
`HOTFIX-search-v2.4.sql`

## Frontend
Não houve mudança funcional nos arquivos de frontend neste hotfix.
Não altere `config.js`.
