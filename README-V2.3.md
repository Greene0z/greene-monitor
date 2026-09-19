# Greene Monitor V2.3 — RPG Foundation

A V2.3 adiciona a camada RPG sobre a V2.2 sem remover os módulos existentes.

## Instalação
1. Abra a versão atual e gere **Backup / Exportar JSON**.
2. No Supabase, abra **SQL Editor → New query**.
3. Execute `migration-v2.3.sql` **uma única vez**.
4. No GitHub, substitua somente:
   - `index.html`
   - `style.css`
   - `app.js`
5. **Não substitua nem altere seu `config.js`.**
6. Faça commit, aguarde o GitHub Pages publicar e use `Ctrl+Shift+R`.

Não execute novamente as migrações antigas.

## O que entrou

### Criador de personagem pixel art
- apresentação feminina, masculina e neutra;
- nome do personagem;
- cinco tons de pele;
- várias cores de cabelo;
- estilos de cabelo;
- tipos de olhos;
- roupas;
- acessórios;
- cores das roupas;
- botão Randomizar;
- preview animado;
- salvamento da configuração no `avatar_config`.

A arte desta versão é original e gerada pelo próprio frontend usando SVG em grade pixelada. Não há sprites de terceiros no pacote.

### Progressão
- XP baseado em atividades reais registradas;
- níveis;
- classes de progressão: Novato, Aprendiz, Aventureiro, Especialista, Mestre, Guardião e Lendário;
- moedas internas;
- seis atributos: Conhecimento, Consistência, Vitalidade, Disciplina, Foco e Reflexão;
- XP obtido não é reduzido por humor, sono ou avaliações pessoais ruins.

### Quests
Quests diárias e semanais são criadas automaticamente:
- hábitos;
- leitura;
- estudo;
- exercício;
- dias ativos na semana;
- leitura semanal.

Quando a meta é atingida, o botão **Resgatar** entrega XP bônus e moedas.

### Conquistas
Inclui conquistas iniciais para:
- primeiro check-in;
- leitura;
- estudos;
- hábitos;
- notas;
- exercício;
- sono;
- livros concluídos.

Algumas liberam títulos e cosméticos.

### Loja
- cosméticos comprados exclusivamente com moedas internas;
- nenhuma relação com dinheiro real;
- itens comprados ficam disponíveis no criador de personagem.

### Dashboard
O antigo card de prévia RPG agora mostra:
- personagem real;
- nível;
- título/classe;
- moedas;
- barra de XP.

Clicar no card abre o módulo RPG.

## Primeira sincronização
Ao abrir a V2.3 pela primeira vez, o sistema calcula XP a partir do histórico já existente. Portanto, uma conta antiga pode começar acima do nível 1.

## Teste recomendado
1. Abra **Personagem**.
2. Entre em **Personagem** dentro das abas do RPG e personalize o avatar.
3. Troque entre Feminina, Masculina e Neutra.
4. Use **Randomizar**, salve e atualize a página.
5. Confira XP, nível, moedas e atributos.
6. Faça uma atividade que complete uma quest e abra novamente a área RPG.
7. Resgate uma quest concluída.
8. Verifique **Conquistas** e resgate alguma que já tenha atingido.
9. Se tiver moedas suficientes, compre um cosmético em **Loja** e equipe-o no criador.
10. Confirme que o card RPG no dashboard mostra o avatar salvo.

## Observações
- O sistema RPG pode continuar sendo desligado em Configurações.
- A progressão é cosmética/motivacional; não altera nem esconde os dados reais do monitor.
- Registros negativos de humor, foco ou sono não retiram XP.
- As quests usam a data local enviada pelo navegador para evitar troca de dia causada por UTC.
