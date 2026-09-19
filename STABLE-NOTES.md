# Notas da versão Stable

## Backup
Faça backups JSON periódicos. O CSV é complementar e foi pensado para leitura em planilhas; não substitui o JSON para restauração.

## Restauração
A restauração JSON é uma operação de mesclagem. Ela foi pensada principalmente para restaurar dados de um backup do próprio Greene. Gere um backup atual imediatamente antes de testar a restauração.

Anexos do módulo Notas: o JSON guarda metadados, mas não os bytes dos arquivos enviados ao Supabase Storage. A restauração não recria arquivos binários ausentes.

## PWA / offline
A PWA mantém o shell estático em cache. Ela não transforma o Greene em um banco offline-first: criar, editar, excluir e sincronizar registros continua dependendo de conexão com o Supabase. Quando não houver rede, o indicador informa `Sem conexão` e os formulários não são descartados automaticamente.

## RPG
A gamificação é opcional. Métricas subjetivas ou negativas (humor, estresse, qualidade do sono etc.) não removem XP. O RPG é uma camada de apresentação e recompensa sobre os dados reais, não substitui as métricas do monitor.
