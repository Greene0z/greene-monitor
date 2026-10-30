# Auditoria Greene Monitor (30/10/2026)

## Banco (Supabase mzdwkmpqxmmozmhaojge)
- 26 tabelas em public, todas com RLS e 28 políticas.
- Dados: 2 usuários, 12 check-ins, 42 itens de loja, 13 conquistas, inventário vazio.
- Nenhuma migração estava registrada: o banco foi criado pelo SQL Editor.
- Corrigido pela migração 001: funções RPC executáveis por anon e search_path da game_level_for_xp.
- Pendente (painel Supabase): ativar proteção contra senhas vazadas em Authentication.

## IA
- Edge Function rapid-worker (greene-ai.ts) já existe e usa a API da OpenAI.
- Exige o secret OPENAI_API_KEY (serviço pago). Não configurado por mim; depende de autorização do dono.
- CORS da função está com "*"; restringir ao domínio do GitHub Pages quando a IA for ativada.

## Front-end
- app.js (141 KB) e style.css (42 KB) são arquivos únicos; planejar divisão em módulos.
- README.md descreve a V1; os README antigos devem ir para docs/.
- Tema roxo aplicado por theme-purple.css (sobrescreve variáveis de style.css; os temas Forest/Midnight/Paper/Arcane e as cores de destaque ficam suplantados pelo roxo).

## Não testado
Nenhum build, lint ou teste visual foi executado neste ambiente. Validar no navegador antes de mesclar na main.
