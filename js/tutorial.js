const Tutorial = {
    currentStep: 0,
    highlightedEl: null,
    steps: [
        {
            title: 'Bem-vindo ao FinanceFlow!',
            text: 'Seu controle financeiro pessoal. Vamos mostrar as principais funcionalidades.',
            icon: 'fa-rocket',
            target: null,
            shortcut: null,
            position: 'center'
        },
        {
            title: 'Nova Transação',
            text: 'Adicione receitas e despesas clicando neste botão. Suporta parcelamento e cartão de crédito.',
            icon: 'fa-plus',
            target: '#btnAddTransaction',
            shortcut: 'N',
            position: 'bottom'
        },
        {
            title: 'Navegação de Meses',
            text: 'Navegue entre os meses para ver seus lançamentos. O dashboard atualiza automaticamente.',
            icon: 'fa-calendar',
            target: '.month-nav',
            shortcut: '←  →',
            position: 'bottom'
        },
        {
            title: 'Dashboard',
            text: 'Visão geral com saldo, receitas, despesas, limite de crédito e gráficos.',
            icon: 'fa-chart-pie',
            target: '.stats-grid',
            shortcut: '1',
            position: 'bottom'
        },
        {
            title: 'Transações',
            text: 'Lista completa com filtros por tipo, categoria e busca por nome ou valor.',
            icon: 'fa-arrow-right-arrow-left',
            target: '[data-section="transactions"]',
            shortcut: '2',
            position: 'right'
        },
        {
            title: 'Orçamento',
            text: 'Defina limites de gasto por categoria e acompanhe o progresso mensal.',
            icon: 'fa-bullseye',
            target: '[data-section="budget"]',
            shortcut: '3',
            position: 'right'
        },
        {
            title: 'Transações Recorrentes',
            text: 'Cadastre despesas fixas (aluguel, assinaturas) para gerar automaticamente todo mês.',
            icon: 'fa-rotate',
            target: '[data-section="recurring"]',
            shortcut: '4',
            position: 'right'
        },
        {
            title: 'Cartões de Crédito',
            text: 'Gerencie seus cartões e acompanhe o limite disponível em tempo real.',
            icon: 'fa-credit-card',
            target: '.stat-credit',
            shortcut: null,
            position: 'bottom'
        },
        {
            title: 'Modo Claro/Escuro',
            text: 'Alterne entre os temas claro e escuro para sua preferência.',
            icon: 'fa-circle-half-stroke',
            target: '#themeToggle',
            shortcut: 'T',
            position: 'bottom'
        },
        {
            title: 'Tudo Pronto!',
            text: 'Explore todas as funcionalidades. Seus dados ficam salvos no navegador. Faça backup regularmente!',
            icon: 'fa-check-circle',
            target: null,
            shortcut: null,
            position: 'center'
        }
    ],

    init() {
        const seen = localStorage.getItem('fc_tutorial_seen');
        this.bindEvents();
        if (!seen) {
            setTimeout(() => this.start(), 800);
        }
    },

    bindEvents() {
        document.getElementById('tutorialNext').addEventListener('click', () => this.next());
        document.getElementById('tutorialSkip').addEventListener('click', () => this.finish());
        document.getElementById('tutorialClose').addEventListener('click', () => this.finish());

        document.addEventListener('keydown', e => {
            if (!document.getElementById('tutorialOverlay').classList.contains('active')) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.next();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                this.finish();
            }
        });

        window.addEventListener('resize', () => this.updatePosition());
        window.addEventListener('scroll', () => this.updatePosition(), true);
    },

    start() {
        this.currentStep = 0;
        document.getElementById('tutorialOverlay').classList.add('active');
        this.renderDots();
        this.renderStep();
    },

    renderDots() {
        const container = document.getElementById('tutorialDots');
        container.innerHTML = this.steps.map((_, i) =>
            `<div class="tutorial-dot${i === 0 ? ' active' : ''}"></div>`
        ).join('');
    },

    renderStep() {
        const step = this.steps[this.currentStep];
        const total = this.steps.length;

        document.getElementById('tutorialStepBadge').textContent = `${this.currentStep + 1}/${total}`;
        document.getElementById('tutorialTitle').textContent = step.title;
        document.getElementById('tutorialText').textContent = step.text;
        document.getElementById('tutorialIcon').innerHTML = `<i class="fas ${step.icon}"></i>`;

        const shortcutEl = document.getElementById('tutorialShortcut');
        if (step.shortcut) {
            shortcutEl.style.display = 'inline-flex';
            document.getElementById('tutorialKbd').textContent = step.shortcut;
        } else {
            shortcutEl.style.display = 'none';
        }

        document.querySelectorAll('.tutorial-dot').forEach((dot, i) => {
            dot.className = 'tutorial-dot';
            if (i === this.currentStep) dot.classList.add('active');
            else if (i < this.currentStep) dot.classList.add('completed');
        });

        const nextBtn = document.getElementById('tutorialNext');
        nextBtn.innerHTML = this.currentStep === total - 1
            ? 'Concluir <i class="fas fa-check"></i>'
            : 'Próximo <i class="fas fa-arrow-right"></i>';

        this.removeHighlight();
        this.updatePosition();
    },

    removeHighlight() {
        if (this.highlightedEl) {
            this.highlightedEl.classList.remove('tutorial-highlight');
            this.highlightedEl = null;
        }
        document.getElementById('tutorialSpotlight').classList.remove('visible');
    },

    updatePosition() {
        const step = this.steps[this.currentStep];
        const spotlight = document.getElementById('tutorialSpotlight');
        const card = document.getElementById('tutorialCard');

        if (!step.target) {
            spotlight.classList.remove('visible');
            card.style.top = '50%';
            card.style.left = '50%';
            card.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const el = document.querySelector(step.target);
        if (!el) {
            spotlight.classList.remove('visible');
            card.style.top = '50%';
            card.style.left = '50%';
            card.style.transform = 'translate(-50%, -50%)';
            return;
        }

        this.highlightedEl = el;
        el.classList.add('tutorial-highlight');

        const rect = el.getBoundingClientRect();
        const padding = 6;

        spotlight.style.top = (rect.top - padding) + 'px';
        spotlight.style.left = (rect.left - padding) + 'px';
        spotlight.style.width = (rect.width + padding * 2) + 'px';
        spotlight.style.height = (rect.height + padding * 2) + 'px';
        spotlight.classList.add('visible');

        const cardWidth = Math.min(380, window.innerWidth - 40);
        const cardHeight = 260;
        const gap = 20;

        let top, left;

        switch (step.position) {
            case 'bottom':
                top = rect.bottom + gap;
                left = rect.left + (rect.width / 2) - (cardWidth / 2);
                break;
            case 'top':
                top = rect.top - cardHeight - gap;
                left = rect.left + (rect.width / 2) - (cardWidth / 2);
                break;
            case 'right':
                top = rect.top + (rect.height / 2) - (cardHeight / 2);
                left = rect.right + gap;
                break;
            case 'left':
                top = rect.top + (rect.height / 2) - (cardHeight / 2);
                left = rect.left - cardWidth - gap;
                break;
            default:
                top = rect.bottom + gap;
                left = rect.left + (rect.width / 2) - (cardWidth / 2);
        }

        if (left < 20) left = 20;
        if (left + cardWidth > window.innerWidth - 20) {
            left = window.innerWidth - cardWidth - 20;
        }
        if (top < 20) top = 20;
        if (top + cardHeight > window.innerHeight - 20) {
            top = window.innerHeight - cardHeight - 20;
        }

        card.style.top = top + 'px';
        card.style.left = left + 'px';
        card.style.transform = 'none';
    },

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.finish();
        }
    },

    finish() {
        this.removeHighlight();
        document.getElementById('tutorialOverlay').classList.remove('active');
        document.getElementById('tutorialSpotlight').classList.remove('visible');
        localStorage.setItem('fc_tutorial_seen', '1');
    },

    restart() {
        localStorage.removeItem('fc_tutorial_seen');
        this.start();
    }
};
