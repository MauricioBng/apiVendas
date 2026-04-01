# Sessão Cursor — handoff versionado

Esta pasta guarda um **resumo versionável** do contexto do projeto e das decisões da conversa, para você **commitar no Git** e retomar o trabalho em outra máquina.

## O que isso faz e o que não faz

| Faz | Não faz |
|-----|--------|
| Documento em Markdown com histórico, arquivos e decisões | Não substitui o histórico nativo do chat do Cursor |
| Pode ser aberto, copiado ou referenciado com `@docs/cursor-session/CONVERSATION-HANDOFF.md` | **Não existe** configuração no repositório que “atualize o chat” automaticamente ao abrir o projeto |
| Regra em `.cursor/rules/` lembra o agente de consultar o handoff | Sincronização de conversas entre PCs costuma depender da **conta Cursor** / backup local do app |

## Como retomar em outro computador

1. Clone o repositório e abra a pasta no Cursor (mesma conta, se quiser histórico de chat sincronizado pelo produto).
2. Abra um **novo chat** e anexe o handoff: `@docs/cursor-session/CONVERSATION-HANDOFF.md` (ou arraste o arquivo para o input).
3. Diga algo como: *“Continue a partir do handoff; última atualização conforme o arquivo.”*

## Manter o handoff alinhado

- Quando fechar um marco, **edite** `CONVERSATION-HANDOFF.md` (ou peça ao agente para atualizar) e faça commit.
- A regra `session-handoff.mdc` orienta o agente a tratar esse arquivo como referência de continuidade.

## Data da última atualização do handoff

Ver seção no topo de `CONVERSATION-HANDOFF.md`.
