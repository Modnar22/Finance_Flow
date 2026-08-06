# FinanceFlow v1.0.0

Dashboard financeiro pessoal com interface moderna e funcionalidades completas.

## Desenvolvido por

**Mateus Gouveia**  
GitHub: [github.com/Modnar22](https://github.com/Modnar22)

## Funcionalidades

- Dashboard com visão geral (saldo, receitas, despesas, crédito)
- Gerenciamento de transações com parcelamento
- Controle de cartões de crédito
- Orçamento mensal por categoria
- Transações recorrentes (geração automática)
- Gráficos interativos (pizza e barras)
- Modo claro/escuro
- Exportação e importação de backups (JSON)
- Atalhos de teclado
- Interface responsiva
- Tutorial interativo para novos usuários
- App desktop via Electron

## Como Usar (Navegador)

Basta abrir o arquivo `index.html` em qualquer navegador moderno.

## Como Usar (Electron - App Desktop)

### Pré-requisitos
- Node.js 18+ instalado
- npm

### Instalação

```bash
cd financial-dashboard
npm install
```

### Executar em modo desenvolvimento

```bash
npm start
```

### Gerar instalador

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Os instaladores serão gerados na pasta `dist/`.

## Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| `N` | Nova transação |
| `T` | Alternar tema claro/escuro |
| `←` `→` | Navegar entre meses |
| `1` | Dashboard |
| `2` | Transações |
| `3` | Orçamento |
| `4` | Recorrentes |
| `5` | Histórico |
| `6` | Configurações |
| `Esc` | Fechar modal |

## Estrutura

```
financial-dashboard/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos
├── js/
│   ├── storage.js      # Gerenciamento de dados (localStorage)
│   ├── utils.js        # Utilitários
│   ├── charts.js       # Gráficos (Chart.js)
│   ├── tutorial.js     # Sistema de tutorial
│   └── app.js          # Lógica principal
├── assets/             # Ícones
├── main.js             # Electron main process
├── preload.js          # Electron preload
├── package.json        # Configuração npm/Electron
└── README.md           # Este arquivo
```

## Licença

MIT License - © 2026 Mateus Gouveia
