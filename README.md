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

## Downloads

| Sistema | Arquivo | Tamanho |
|---------|---------|---------|
| Windows | [FinanceFlow-Setup-1.0.0.exe](https://github.com/Modnar22/Finance_Flow/releases/download/v1.0.0_Windows/FinanceFlow-Setup-1.0.0.exe) | 73 MB |
| Linux (Debian/Ubuntu) | [financeflow_1.0.0_amd64.deb](https://github.com/Modnar22/Finance_Flow/releases/download/v1.0.0/financeflow_1.0.0_amd64.deb) | 70 MB |
| Android | [app-debug.apk](https://github.com/Modnar22/Finance_Flow/releases/download/v1.0.0_APK/app-debug.apk) | 1,5 MB |

**Windows:** baixe o `.exe`, dê duplo clique e siga o assistente de instalação.

**Linux:** `sudo dpkg -i financeflow_1.0.0_amd64.deb`

**Android:** baixe o `.apk` no celular e permita a instalação de fontes desconhecidas quando solicitado.

**Todas as versões:** [github.com/Modnar22/Finance_Flow/releases](https://github.com/Modnar22/Finance_Flow/releases)

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

> Os builds oficiais (Windows e Linux) são gerados e publicados nos Releases
> pelo workflow **Build Release Assets** (aba *Actions* do repositório).

### Gerar APK (Android)

O projeto Android fica na pasta `android/` (abertura no Android Studio:
*File → Open → android*). Os arquivos web (`index.html`, `css/`, `js/`) são
copiados automaticamente para o APK a cada build.

```bash
cd android
./gradlew.bat assembleDebug     # Windows
./gradlew assembleDebug         # Linux/macOS
```

O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`.

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
