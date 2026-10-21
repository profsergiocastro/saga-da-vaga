# A Saga da Vaga — Protótipo 01: A Inscrição

Jogo 2D cômico, satírico e educacional ambientado em uma versão ficcionalizada de São Raimundo Nonato, Piauí.

## Requisitos
- Windows 10/11
- Node.js LTS (o projeto foi verificado com Node.js 24.20.0)
- Git

## Instalar e executar
No PowerShell, entre nesta pasta e execute:

```powershell
npm.cmd install
npm.cmd run dev
```

O Vite mostrará um endereço local, normalmente http://localhost:5173. Abra-o no navegador.

## Testes
```powershell
npm.cmd test
npm.cmd run build
```

## Controles do jogo
- WASD ou setas: mover
- Enter/Espaço: interagir e avançar diálogos
- J: caderno de missões
- H: ajuda
- Esc: pausa/voltar

## Estrutura
- `src/game/Game.tsx`: ciclo principal e entrada do jogo
- `src/game/world.ts`: mapa e colisões
- `src/game/render.ts`: renderização pixel art em Canvas
- `src/game/quest.ts`: progresso, diálogos, puzzle documental e quiz
- `src/game/ui.tsx`: menus, diálogos, caderno, puzzle e quiz
- `src/styles.css`: identidade visual

## Princípios de desenvolvimento
- Manter o jogo executável localmente sem depender do Lovable.
- Validar gabaritos e explicações das questões antes de publicar conteúdo.
- Fazer commits pequenos e rodar testes após mudanças de sistemas centrais.
- Não colocar tokens, senhas ou arquivos `.env` no Git.
- A obra é um protótipo independente, não um produto oficial do IFPI.

## Próximas etapas
1. Confirmar a missão inicial no ambiente local.
2. Melhorar a primeira área explorável e a orientação do jogador.
3. Desenvolver interiores e novas missões/minigames de forma incremental.
