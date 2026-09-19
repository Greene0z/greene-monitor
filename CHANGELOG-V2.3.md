# V2.3 — Resumo técnico

- Mantém a V2.2 como base.
- Adiciona catálogo de cosméticos (`game_items`).
- Adiciona definições de conquistas (`game_achievement_defs`).
- Reaproveita `game_profiles`, `game_inventory`, `game_user_achievements`, `game_quests` e `game_quest_progress`.
- Adiciona XP de atividade, XP bônus e checkpoint de moedas ao perfil.
- Adiciona funções SQL para sincronizar progressão, quests, conquistas e compras.
- Todas as recompensas são vinculadas ao `auth.uid()` no backend.
- Quests usam uma data informada pelo frontend para respeitar a data local do usuário.
- O frontend usa atualizações assíncronas/debounce para não tornar os registros diários lentos.
