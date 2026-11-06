const app = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    selectedType: 'expense',
    selectedRecurringType: 'expense',

    init() {
        Storage.init();
        this.loadTheme();
        this.bindEvents();
        Charts.init();
        this.populateCategorySelects();
        this.populateCardSelect();
        this.updateMonthDisplay();
        this.refreshAll();
        this.updateNavButtons();
        Tutorial.init();
    },

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                const section = link.dataset.section;
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById('section-' + section).classList.add('active');
                if (section === 'transactions') this.renderTransactions();
                if (section === 'budget') this.renderBudgets();
                if (section === 'recurring') this.renderRecurring();
                if (section === 'history') this.renderHistory();
                if (section === 'settings') this.renderSettings();
            });
        });

        // Month nav
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // Modal
        document.getElementById('btnAddTransaction').addEventListener('click', () => this.openModal());
        document.getElementById('btnCloseModal').addEventListener('click', () => this.closeModal());
        document.getElementById('btnCancelModal').addEventListener('click', () => this.closeModal());
        document.getElementById('modalOverlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closeModal();
        });

        // Type switcher
        document.querySelectorAll('.type-opt').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-opt').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedType = btn.dataset.type;
                this.updateCardSelectorVisibility();
            });
        });

        // Form
        document.getElementById('transactionForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveTransaction();
        });

        // Installment preview & card selector
        document.getElementById('inputInstallments').addEventListener('input', () => {
            this.updateInstallmentPreview();
            this.updateCardSelectorVisibility();
        });
        document.getElementById('inputAmount').addEventListener('input', () => this.updateInstallmentPreview());

        // Card selector change
        document.getElementById('inputCard').addEventListener('change', () => this.updateCardLimitInfo());

        // Filters
        document.getElementById('filterType').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filterCategory').addEventListener('change', () => this.renderTransactions());
        document.getElementById('searchInput').addEventListener('input', () => this.renderTransactions());

        // History pills
        document.querySelectorAll('.pill[data-month]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.pill[data-month]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderHistory(parseInt(btn.dataset.month));
            });
        });

        // Recurring modal
        document.getElementById('btnAddRecurring').addEventListener('click', () => this.openRecurringModal());
        document.getElementById('btnCloseRecurringModal').addEventListener('click', () => this.closeRecurringModal());
        document.getElementById('btnCancelRecurringModal').addEventListener('click', () => this.closeRecurringModal());
        document.getElementById('recurringModalOverlay').addEventListener('click', e => {
            if (e.target === e.currentTarget) this.closeRecurringModal();
        });
        document.getElementById('recurringForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveRecurring();
        });

        // Recurring type switcher
        document.querySelectorAll('.type-opt[data-form="recurring"]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.type-opt[data-form="recurring"]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedRecurringType = btn.dataset.type;
            });
        });

        // Mobile menu
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Keyboard shortcuts
        document.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === 'n' || e.key === 'N') { e.preventDefault(); this.openModal(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.changeMonth(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); this.changeMonth(1); }
            if (e.key === 'Escape') this.closeModal();
            if (e.key === '1') this.navigateTo('dashboard');
            if (e.key === '2') this.navigateTo('transactions');
            if (e.key === '3') this.navigateTo('budget');
            if (e.key === '4') this.navigateTo('recurring');
            if (e.key === '5') this.navigateTo('history');
            if (e.key === '6') this.navigateTo('settings');
            if (e.key === 't' || e.key === 'T') this.toggleTheme();
        });
    },

    // ========== THEME ==========
    loadTheme() {
        const theme = localStorage.getItem('fc_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeIcon(theme);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('fc_theme', next);
        this.updateThemeIcon(next);
    },

    updateThemeIcon(theme) {
        const icon = document.getElementById('themeIcon');
        icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    },

    navigateTo(section) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === section));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('section-' + section).classList.add('active');
        if (section === 'transactions') this.renderTransactions();
        if (section === 'budget') this.renderBudgets();
        if (section === 'recurring') this.renderRecurring();
        if (section === 'history') this.renderHistory();
        if (section === 'settings') this.renderSettings();
    },

    changeMonth(delta) {
        const newMonth = this.currentMonth + delta;
        const newYear = newMonth > 11 ? this.currentYear + 1 : newMonth < 0 ? this.currentYear - 1 : this.currentYear;
        const normalizedMonth = newMonth > 11 ? 0 : newMonth < 0 ? 11 : newMonth;

        const range = this.getMonthRange();
        const targetKey = newYear * 100 + normalizedMonth;
        if (targetKey < range.min || targetKey > range.max) return;

        this.currentMonth = normalizedMonth;
        this.currentYear = newYear;
        this.updateMonthDisplay();
        this.updateNavButtons();
        this.refreshAll();
    },

    getMonthRange() {
        const transactions = Storage.getTransactions();
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        let minKey = currentYear * 100 + currentMonth;
        let maxKey = currentYear * 100 + currentMonth;

        transactions.forEach(t => {
            const d = new Date(t.date);
            const key = d.getFullYear() * 100 + d.getMonth();
            if (key < minKey) minKey = key;
            if (key > maxKey) maxKey = key;
        });

        return { min: minKey, max: maxKey };
    },

    updateNavButtons() {
        const range = this.getMonthRange();
        const currentKey = this.currentYear * 100 + this.currentMonth;
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');

        prevBtn.disabled = currentKey <= range.min;
        nextBtn.disabled = currentKey >= range.max;
        prevBtn.style.opacity = currentKey <= range.min ? '0.3' : '1';
        nextBtn.style.opacity = currentKey >= range.max ? '0.3' : '1';
    },

    updateMonthDisplay() {
        document.getElementById('currentMonth').textContent = Utils.getMonthName(this.currentMonth) + ' ' + this.currentYear;
    },

    refreshAll() {
        const created = Storage.generateRecurringTransactions();
        if (created > 0) {
            Utils.toast(`${created} transação(ões) recorrente(s) gerada(s)!`, 'info');
        }
        this.renderDashboard();
        this.renderTransactions();
        Charts.update(this.currentYear, this.currentMonth);
        this.updateNavButtons();
    },

    // ========== DASHBOARD ==========
    renderDashboard() {
        const tx = Storage.getTransactionsByMonth(this.currentYear, this.currentMonth);
        const summary = Utils.calculateSummary(tx);
        const totalLimit = Storage.getTotalCreditLimit();
        const totalUsed = Storage.getTotalUsedCredit();
        const totalAvailable = Storage.getTotalAvailableCredit();

        document.getElementById('monthBalance').textContent = Utils.formatCurrency(summary.balance);
        document.getElementById('monthIncome').textContent = Utils.formatCurrency(summary.income);
        document.getElementById('monthExpense').textContent = Utils.formatCurrency(summary.expense);
        document.getElementById('creditLimit').textContent = Utils.formatCurrency(totalAvailable);
        document.getElementById('creditUsed').textContent = Utils.formatCurrency(totalUsed);
        document.getElementById('creditTotal').textContent = Utils.formatCurrency(totalLimit);

        const pct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;
        document.getElementById('creditBarFill').style.width = pct + '%';

        // Render individual cards
        this.renderCardsDashboard();

        const sorted = [...tx].sort((a, b) => new Date(b.date) - new Date(a.date));
        this.renderTxList('recentList', sorted);
    },

    renderCardsDashboard() {
        const cards = Storage.getCards();
        const container = document.getElementById('cardsDashboard');

        if (cards.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="cards-grid">
                ${cards.map(card => {
                    const used = Storage.calculateUsedCreditByCard(card.id);
                    const available = Storage.calculateAvailableCreditByCard(card.id);
                    const pct = card.limit > 0 ? Math.min((used / card.limit) * 100, 100) : 0;
                    const barColor = pct >= 90 ? 'var(--danger)' : pct >= 70 ? 'var(--warning)' : card.color;
                    return `
                        <div class="credit-card-item" style="--card-color: ${card.color}">
                            <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${card.color}"></div>
                            <div class="credit-card-header">
                                <div class="credit-card-name">
                                    <span class="credit-card-dot" style="background:${card.color}"></span>
                                    ${Utils.escapeHtml(card.name)}
                                </div>
                            </div>
                            <div class="credit-card-value" style="color:${card.color}">${Utils.formatCurrency(available)}</div>
                            <div class="credit-card-progress">
                                <div class="credit-card-progress-fill" style="width:${pct}%;background:${barColor}"></div>
                            </div>
                            <div class="credit-card-footer">
                                <span>Usado: <strong>${Utils.formatCurrency(used)}</strong></span>
                                <span>Limite: <strong>${Utils.formatCurrency(card.limit)}</strong></span>
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
    },

    // ========== TRANSACTIONS ==========
    renderTransactions() {
        let tx = Storage.getTransactionsByMonth(this.currentYear, this.currentMonth);

        const type = document.getElementById('filterType').value;
        if (type !== 'all') tx = tx.filter(t => t.type === type);

        const cat = document.getElementById('filterCategory').value;
        if (cat !== 'all') tx = tx.filter(t => t.categoryId === cat);

        const search = document.getElementById('searchInput').value.toLowerCase().trim();
        if (search) {
            tx = tx.filter(t =>
                t.description.toLowerCase().includes(search) ||
                t.amount.toString().includes(search) ||
                (t.note && t.note.toLowerCase().includes(search))
            );
        }

        const summary = Utils.calculateSummary(tx);
        document.getElementById('txTotals').innerHTML = `
            <div class="tx-total-item income">
                <i class="fas fa-arrow-trend-up"></i>
                <span class="label">Receitas</span>
                <span class="value">${Utils.formatCurrency(summary.income)}</span>
            </div>
            <div class="tx-total-item expense">
                <i class="fas fa-arrow-trend-down"></i>
                <span class="label">Despesas</span>
                <span class="value">${Utils.formatCurrency(summary.expense)}</span>
            </div>`;

        tx.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.renderTxList('transactionList', tx);
    },

    renderTxList(containerId, transactions) {
        const container = document.getElementById(containerId);
        const cats = Storage.getCategories();
        const cards = Storage.getCards();

        if (!transactions.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-receipt"></i></div>
                    <h4>Nenhuma transação</h4>
                    <p>Adicione sua primeira transação para começar</p>
                </div>`;
            return;
        }

        container.innerHTML = transactions.map(t => {
            const cat = cats.find(c => c.id === t.categoryId);
            const catName = cat ? cat.name : 'Sem categoria';
            const catColor = cat ? cat.color : '#71717a';
            const icon = t.type === 'income' ? 'arrow-trend-up' : 'arrow-trend-down';
            const prefix = t.type === 'income' ? '+' : '-';
            const paidClass = t.paid ? 'paid' : '';

            let badge = '';
            if (t.installments && t.installments > 1) {
                badge = `<span class="tx-badge">${t.installmentCurrent}/${t.installments}</span>`;
            }

            let cardBadge = '';
            if (t.cardId) {
                const card = cards.find(c => c.id === t.cardId);
                if (card) {
                    cardBadge = `<span class="tx-badge" style="background:${card.color}20;color:${card.color}"><i class="fas fa-credit-card" style="font-size:0.6rem"></i> ${Utils.escapeHtml(card.name)}</span>`;
                }
            }

            let paidBtn = '';
            if (t.type === 'expense') {
                paidBtn = `<button class="btn-paid ${t.paid ? 'is-paid' : ''}" onclick="app.togglePaid('${t.id}')">
                    <i class="fas ${t.paid ? 'fa-circle-check' : 'fa-circle'}"></i> ${t.paid ? 'Pago' : 'Pagar'}
                </button>`;
            }

            let deleteGroupBtn = '';
            if (t.installments > 1 && t.groupId) {
                deleteGroupBtn = `<button class="tx-btn delete-group" onclick="app.deleteGroup('${t.groupId}')" title="Excluir todas as parcelas">
                    <i class="fas fa-trash-can"></i>
                </button>`;
            }

            return `
                <div class="tx-item ${paidClass}">
                    <div class="tx-icon ${t.type}"><i class="fas fa-${icon}"></i></div>
                    <div class="tx-info">
                        <div class="tx-desc">${Utils.escapeHtml(t.description)}${badge}${cardBadge}</div>
                        <div class="tx-meta">
                            <span class="tx-cat-dot" style="background:${catColor}"></span>
                            ${catName} · ${Utils.formatDate(t.date)}${t.note ? ' · ' + Utils.escapeHtml(t.note) : ''}
                        </div>
                    </div>
                    <div class="tx-right">
                        <span class="tx-amount ${t.type}">${prefix} ${Utils.formatCurrency(t.amount)}</span>
                        ${paidBtn}
                        <div class="tx-actions">
                            <button class="tx-btn edit" onclick="app.editTransaction('${t.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                            ${deleteGroupBtn}
                            <button class="tx-btn delete" onclick="app.deleteTransaction('${t.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    // ========== MODAL ==========
    populateCategorySelects() {
        const cats = Storage.getCategories();
        document.getElementById('inputCategory').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        document.getElementById('filterCategory').innerHTML = '<option value="all">Categorias</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    },

    populateCardSelect() {
        const cards = Storage.getCards();
        document.getElementById('inputCard').innerHTML = '<option value="">Nenhum cartão</option>' +
            cards.map(c => `<option value="${c.id}">${c.name} (Limite: ${Utils.formatCurrency(c.limit)})</option>`).join('');
    },

    updateCardSelectorVisibility() {
        const section = document.getElementById('cardSelectorSection');
        const cards = Storage.getCards();

        if (this.selectedType === 'expense' && cards.length > 0) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
            document.getElementById('inputCard').value = '';
            document.getElementById('cardLimitInfo').classList.remove('visible');
        }
    },

    updateCardLimitInfo() {
        const cardId = document.getElementById('inputCard').value;
        const infoEl = document.getElementById('cardLimitInfo');
        const amount = parseFloat(document.getElementById('inputAmount').value) || 0;
        const installments = parseInt(document.getElementById('inputInstallments').value) || 1;

        if (!cardId) {
            infoEl.classList.remove('visible');
            return;
        }

        const card = Storage.getCardById(cardId);
        if (!card) return;

        const used = Storage.calculateUsedCreditByCard(cardId);
        const available = card.limit - used;
        const installmentValue = amount / installments;

        infoEl.classList.add('visible');
        infoEl.innerHTML = `
            <strong>${Utils.escapeHtml(card.name)}</strong><br>
            Disponível: ${Utils.formatCurrency(available)}<br>
            Parcela mensal: ${Utils.formatCurrency(installmentValue)}<br>
            ${installmentValue > available ? '<span style="color:var(--danger)">Atenção: parcela excede o limite disponível!</span>' : '<span style="color:var(--success)">Dentro do limite</span>'}
        `;
    },

    openModal(editId) {
        document.getElementById('modalOverlay').classList.add('active');
        document.getElementById('modalTitle').textContent = editId ? 'Editar Transação' : 'Nova Transação';
        document.getElementById('editTransactionId').value = '';
        document.getElementById('transactionForm').reset();
        document.getElementById('inputDate').value = Utils.getTodayString();
        document.getElementById('inputInstallments').value = 1;
        document.getElementById('inputCard').value = '';
        document.getElementById('cardLimitInfo').classList.remove('visible');

        document.querySelectorAll('.type-opt').forEach(b => b.classList.remove('active'));
        document.querySelector('.type-opt[data-type="expense"]').classList.add('active');
        this.selectedType = 'expense';
        this.updateInstallmentPreview();
        this.updateCardSelectorVisibility();
        this.populateCardSelect();

        if (editId) {
            const tx = Storage.getTransactions().find(t => t.id === editId);
            if (tx) {
                document.getElementById('editTransactionId').value = tx.id;
                let desc = tx.description;
                if (tx.installments > 1 && tx.groupId) desc = desc.replace(/\s*\(\d+\/\d+\)$/, '');
                document.getElementById('inputDescription').value = desc;
                document.getElementById('inputAmount').value = tx.installments > 1 && tx.groupId ? tx.amount * tx.installments : tx.amount;
                document.getElementById('inputCategory').value = tx.categoryId;
                document.getElementById('inputDate').value = tx.date;
                document.getElementById('inputNote').value = tx.note || '';
                document.getElementById('inputInstallments').value = tx.installments || 1;
                document.getElementById('inputCard').value = tx.cardId || '';

                document.querySelectorAll('.type-opt').forEach(b => b.classList.remove('active'));
                const btn = document.querySelector(`.type-opt[data-type="${tx.type}"]`);
                if (btn) btn.classList.add('active');
                this.selectedType = tx.type;
                this.updateInstallmentPreview();
                this.updateCardSelectorVisibility();
                this.updateCardLimitInfo();
            }
        }
    },

    closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
    },

    updateInstallmentPreview() {
        const n = parseInt(document.getElementById('inputInstallments').value) || 1;
        const amt = parseFloat(document.getElementById('inputAmount').value) || 0;
        const label = document.getElementById('installmentLabel');
        const preview = document.getElementById('installmentPreview');

        if (n <= 1) {
            label.textContent = '1x (à vista)';
            preview.innerHTML = '';
        } else {
            label.textContent = `${n}x de ${Utils.formatCurrency(amt / n)}`;
            const base = new Date((document.getElementById('inputDate').value || Utils.getTodayString()) + 'T00:00:00');
            let tags = '';
            for (let i = 0; i < Math.min(n, 6); i++) {
                const d = new Date(base); d.setMonth(d.getMonth() + i);
                tags += `<span class="installment-tag">${i + 1}/${n} - ${Utils.getMonthNameShort(d.getMonth())}</span>`;
            }
            if (n > 6) tags += `<span class="installment-tag">+${n - 6} parcelas</span>`;
            preview.innerHTML = tags;
        }
    },

    saveTransaction() {
        const editId = document.getElementById('editTransactionId').value;
        const installments = parseInt(document.getElementById('inputInstallments').value) || 1;
        const totalAmount = parseFloat(document.getElementById('inputAmount').value);
        const description = document.getElementById('inputDescription').value.trim();
        const categoryId = document.getElementById('inputCategory').value;
        const dateStr = document.getElementById('inputDate').value;
        const note = document.getElementById('inputNote').value.trim();
        const type = this.selectedType;
        const cardId = document.getElementById('inputCard').value || null;

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const isPast = new Date(dateStr + 'T00:00:00') < today;

        if (editId) {
            const existing = Storage.getTransactions().find(t => t.id === editId);
            if (existing && existing.groupId && existing.installments > 1) {
                const amt = totalAmount / installments;
                const all = Storage.getTransactions();
                all.forEach(t => {
                    if (t.groupId === existing.groupId) {
                        t.description = `${description} (${t.installmentCurrent}/${installments})`;
                    }
                });
                Storage.saveTransactions(all);
                Storage.updateGroup(existing.groupId, { type, categoryId, note, amount: amt, cardId });
            } else {
                Storage.updateTransaction(editId, { type, description, amount: totalAmount, categoryId, date: dateStr, note, installments, installmentCurrent: 1, groupId: null, paid: isPast, cardId });
            }
        } else {
            if (installments > 1) {
                const amt = totalAmount / installments;
                const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                const base = new Date(dateStr + 'T00:00:00');
                for (let i = 0; i < installments; i++) {
                    const d = new Date(base); d.setMonth(d.getMonth() + i);
                    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
                    Storage.addTransaction({
                        type, description: `${description} (${i + 1}/${installments})`, amount: amt, categoryId,
                        date: `${y}-${m}-${day}`, note, installments, installmentCurrent: i + 1, groupId, paid: d < today, cardId
                    });
                }
            } else {
                Storage.addTransaction({ type, description, amount: totalAmount, categoryId, date: dateStr, note, installments: 1, installmentCurrent: 1, groupId: null, paid: isPast, cardId });
            }
        }

        this.closeModal();
        this.refreshAll();
        this.populateCategorySelects();
        Utils.toast(editId ? 'Transação atualizada!' : 'Transação criada!', 'success');
    },

    editTransaction(id) { this.openModal(id); },

    togglePaid(id) {
        const tx = Storage.getTransactions().find(t => t.id === id);
        if (!tx) return;

        if (tx.installments > 1 && tx.groupId) {
            if (tx.paid) {
                if (confirm('Marcar TODAS as parcelas restantes como pagas?')) {
                    Storage.markGroupAsPaid(tx.groupId, true);
                    Utils.toast('Todas as parcelas marcadas como pagas', 'success');
                }
            } else {
                Storage.togglePaid(id);
                Utils.toast('Parcela marcada como paga', 'success');
            }
        } else {
            Storage.togglePaid(id);
            Utils.toast(tx.paid ? 'Desmarcado como pago' : 'Marcado como pago', 'info');
        }
        this.refreshAll();
    },

    deleteTransaction(id) {
        const tx = Storage.getTransactions().find(t => t.id === id);
        if (!tx) return;

        if (tx.installments > 1 && tx.groupId) {
            if (confirm(`Parcelamento (${tx.installments}x). Excluir todas as parcelas?`)) {
                Storage.getTransactions().filter(t => t.groupId === tx.groupId).forEach(t => Storage.deleteTransaction(t.id));
                Utils.toast('Parcelamento excluído', 'success');
            } else if (confirm('Excluir apenas esta parcela?')) {
                Storage.deleteTransaction(id);
                Utils.toast('Parcela excluída', 'success');
            }
        } else {
            if (confirm('Excluir esta transação?')) {
                Storage.deleteTransaction(id);
                Utils.toast('Transação excluída', 'success');
            }
        }
        this.refreshAll();
    },

    deleteGroup(groupId) {
        const all = Storage.getTransactions();
        const g = all.filter(t => t.groupId === groupId);
        if (!g.length) return;
        const desc = g[0].description.replace(/\s*\(\d+\/\d+\)$/, '');
        const total = g.reduce((s, t) => s + t.amount, 0);

        if (confirm(`Excluir "${desc}"?\n\n${g[0].installments}x de ${Utils.formatCurrency(total / g[0].installments)}\nTotal: ${Utils.formatCurrency(total)}`)) {
            g.forEach(t => Storage.deleteTransaction(t.id));
            Utils.toast('Parcelamento excluído', 'success');
            this.refreshAll();
        }
    },

    // ========== CARDS ==========
    addCard() {
        const name = document.getElementById('inputCardName').value.trim();
        const limit = parseFloat(document.getElementById('inputCardLimit').value) || 0;
        const color = document.getElementById('inputCardColor').value;

        if (!name) { Utils.toast('Digite um nome para o cartão', 'error'); return; }
        if (limit <= 0) { Utils.toast('Defina um limite maior que zero', 'error'); return; }

        Storage.addCard({ name, limit, color });
        document.getElementById('inputCardName').value = '';
        document.getElementById('inputCardLimit').value = '';
        this.populateCardSelect();
        this.renderSettings();
        this.renderDashboard();
        Utils.toast(`Cartão "${name}" adicionado!`, 'success');
    },

    editCard(id) {
        const card = Storage.getCardById(id);
        if (!card) return;

        const newName = prompt('Nome do cartão:', card.name);
        if (newName === null) return;

        const newLimit = prompt('Limite do cartão:', card.limit);
        if (newLimit === null) return;

        Storage.updateCard(id, { name: newName, limit: parseFloat(newLimit) || 0 });
        this.populateCardSelect();
        this.renderSettings();
        this.renderDashboard();
        this.renderTransactions();
        Utils.toast('Cartão atualizado!', 'success');
    },

    removeCard(id) {
        const card = Storage.getCardById(id);
        if (!card) return;

        if (confirm(`Remover cartão "${card.name}"?\n\nAs transações associadas não serão excluídas, mas ficarão sem cartão.`)) {
            Storage.removeCard(id);
            this.populateCardSelect();
            this.renderSettings();
            this.renderDashboard();
            this.renderTransactions();
            Utils.toast('Cartão removido', 'info');
        }
    },

    // ========== SETTINGS ==========
    renderSettings() {
        // Categories
        document.getElementById('categoryList').innerHTML = Storage.getCategories().map(c => `
            <div class="category-chip">
                <span class="category-chip-dot" style="background:${c.color}"></span>
                ${Utils.escapeHtml(c.name)}
                <button class="cat-edit-btn" onclick="app.editCategory('${c.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="app.removeCategory('${c.id}')"><i class="fas fa-xmark"></i></button>
            </div>`).join('');

        // Cards
        const cards = Storage.getCards();
        document.getElementById('cardList').innerHTML = cards.length === 0
            ? '<p style="font-size:0.8rem;color:var(--text-3);text-align:center;padding:12px">Nenhum cartão adicionado</p>'
            : cards.map(card => {
                const used = Storage.calculateUsedCreditByCard(card.id);
                const available = Storage.calculateAvailableCreditByCard(card.id);
                return `
                    <div class="card-item">
                        <div class="card-item-color" style="background:${card.color}"></div>
                        <div class="card-item-info">
                            <div class="card-item-name">${Utils.escapeHtml(card.name)}</div>
                            <div class="card-item-limit">
                                Limite: <strong>${Utils.formatCurrency(card.limit)}</strong> · 
                                Disponível: <strong>${Utils.formatCurrency(available)}</strong> · 
                                Usado: <strong>${Utils.formatCurrency(used)}</strong>
                            </div>
                        </div>
                        <div class="card-item-actions">
                            <button class="tx-btn edit" onclick="app.editCard('${card.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                            <button class="tx-btn delete" onclick="app.removeCard('${card.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
            }).join('');
    },

    addCategory() {
        const name = document.getElementById('inputNewCategory').value.trim();
        const color = document.getElementById('inputCategoryColor').value;
        if (!name) { Utils.toast('Digite um nome para a categoria', 'error'); return; }
        Storage.addCategory({ name, color, icon: 'tag' });
        document.getElementById('inputNewCategory').value = '';
        this.populateCategorySelects();
        this.renderSettings();
        Utils.toast(`Categoria "${name}" criada!`, 'success');
    },

    editCategory(id) {
        const cat = Storage.getCategoryById(id);
        if (!cat) return;
        const newName = prompt('Nome da categoria:', cat.name);
        if (newName === null || !newName.trim()) return;
        const newColor = prompt('Cor (hex):', cat.color);
        if (newColor === null) return;
        Storage.updateCategory(id, { name: newName.trim(), color: newColor || cat.color });
        this.populateCategorySelects();
        this.renderSettings();
        Utils.toast('Categoria atualizada!', 'success');
    },

    removeCategory(id) {
        if (confirm('Remover esta categoria?')) {
            Storage.removeCategory(id);
            this.populateCategorySelects();
            this.renderSettings();
            Utils.toast('Categoria removida', 'info');
        }
    },

    // ========== BUDGET ==========
    renderBudgets() {
        const budgets = Storage.getBudgets();
        const cats = Storage.getCategories().filter(c => !['cat_9', 'cat_10'].includes(c.id));
        const tx = Storage.getTransactionsByMonth(this.currentYear, this.currentMonth);
        const expByCat = Utils.getExpensesByCategory(tx);

        let totalBudget = 0, totalSpent = 0;

        document.getElementById('budgetList').innerHTML = cats.map(cat => {
            const budget = budgets[cat.id] || 0;
            const spent = expByCat[cat.id] || 0;
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const status = pct >= 90 ? 'over' : pct >= 70 ? 'warn' : 'ok';

            totalBudget += budget;
            totalSpent += spent;

            return `
                <div class="budget-item">
                    <div class="budget-item-top">
                        <div class="budget-item-name">
                            <span class="tx-cat-dot" style="background:${cat.color}"></span> ${cat.name}
                        </div>
                        <div class="budget-item-values">
                            <span>Gasto: <strong>${Utils.formatCurrency(spent)}</strong></span>
                            <span>Orçamento: <strong>${Utils.formatCurrency(budget)}</strong></span>
                        </div>
                    </div>
                    <div class="progress-bar"><div class="progress-fill ${status}" style="width:${pct}%"></div></div>
                    <div class="budget-input-row">
                        <label>Definir orçamento:</label>
                        <input type="number" step="0.01" min="0" value="${budget || ''}" placeholder="R$ 0,00"
                            onchange="app.updateBudget('${cat.id}', this.value)">
                        <span class="budget-remaining">${budget > 0 ? `Restante: ${Utils.formatCurrency(Math.max(budget - spent, 0))}` : 'Sem orçamento'}</span>
                    </div>
                </div>`;
        }).join('');

        document.getElementById('totalBudget').textContent = Utils.formatCurrency(totalBudget);
        document.getElementById('totalSpent').textContent = Utils.formatCurrency(totalSpent);
        document.getElementById('totalRemaining').textContent = Utils.formatCurrency(Math.max(totalBudget - totalSpent, 0));
    },

    updateBudget(catId, value) {
        Storage.setBudget(catId, parseFloat(value) || 0);
        this.renderBudgets();
    },

    // ========== RECURRING ==========
    renderRecurring() {
        const recurring = Storage.getRecurring();
        const cats = Storage.getCategories();
        const container = document.getElementById('recurringList');

        if (!recurring.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fas fa-rotate"></i></div>
                    <h4>Nenhuma transação recorrente</h4>
                    <p>Adicione despesas ou receitas que se repetem todo mês</p>
                </div>`;
            return;
        }

        container.innerHTML = recurring.map(r => {
            const cat = cats.find(c => c.id === r.categoryId);
            const catName = cat ? cat.name : 'Sem categoria';
            const catColor = cat ? cat.color : '#71717a';
            const icon = r.type === 'income' ? 'arrow-trend-up' : 'arrow-trend-down';
            const prefix = r.type === 'income' ? '+' : '-';
            const statusClass = r.active ? '' : 'inactive';

            return `
                <div class="tx-item ${statusClass}">
                    <div class="tx-icon ${r.type}"><i class="fas fa-${icon}"></i></div>
                    <div class="tx-info">
                        <div class="tx-desc">
                            ${Utils.escapeHtml(r.description)}
                            <span class="tx-badge" style="background:${r.active ? 'var(--success-subtle)' : 'var(--surface-4)'};color:${r.active ? 'var(--success)' : 'var(--text-3)'}">
                                ${r.active ? 'Ativa' : 'Inativa'}
                            </span>
                        </div>
                        <div class="tx-meta">
                            <span class="tx-cat-dot" style="background:${catColor}"></span>
                            ${catName} · Dia ${r.day} de cada mês
                        </div>
                    </div>
                    <div class="tx-right">
                        <span class="tx-amount ${r.type}">${prefix} ${Utils.formatCurrency(r.amount)}</span>
                        <div class="tx-actions" style="opacity:1">
                            <button class="tx-btn edit" onclick="app.toggleRecurring('${r.id}')" title="${r.active ? 'Pausar' : 'Ativar'}">
                                <i class="fas fa-${r.active ? 'pause' : 'play'}"></i>
                            </button>
                            <button class="tx-btn edit" onclick="app.editRecurring('${r.id}')" title="Editar"><i class="fas fa-pen"></i></button>
                            <button class="tx-btn delete" onclick="app.deleteRecurring('${r.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    openRecurringModal(editId) {
        document.getElementById('recurringModalOverlay').classList.add('active');
        document.getElementById('recurringModalTitle').textContent = editId ? 'Editar Recorrente' : 'Nova Transação Recorrente';
        document.getElementById('editRecurringId').value = '';
        document.getElementById('recurringForm').reset();
        document.getElementById('inputRecDay').value = 1;

        document.querySelectorAll('.type-opt[data-form="recurring"]').forEach(b => b.classList.remove('active'));
        document.querySelector('.type-opt[data-form="recurring"][data-type="expense"]').classList.add('active');
        this.selectedRecurringType = 'expense';

        const cats = Storage.getCategories();
        document.getElementById('inputRecCategory').innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        if (editId) {
            const r = Storage.getRecurring().find(r => r.id === editId);
            if (r) {
                document.getElementById('editRecurringId').value = r.id;
                document.getElementById('inputRecDescription').value = r.description;
                document.getElementById('inputRecAmount').value = r.amount;
                document.getElementById('inputRecCategory').value = r.categoryId;
                document.getElementById('inputRecDay').value = r.day;
                document.querySelectorAll('.type-opt[data-form="recurring"]').forEach(b => b.classList.remove('active'));
                const btn = document.querySelector(`.type-opt[data-form="recurring"][data-type="${r.type}"]`);
                if (btn) btn.classList.add('active');
                this.selectedRecurringType = r.type;
            }
        }
    },

    closeRecurringModal() {
        document.getElementById('recurringModalOverlay').classList.remove('active');
    },

    saveRecurring() {
        const editId = document.getElementById('editRecurringId').value;
        const description = document.getElementById('inputRecDescription').value.trim();
        const amount = parseFloat(document.getElementById('inputRecAmount').value);
        const categoryId = document.getElementById('inputRecCategory').value;
        const day = parseInt(document.getElementById('inputRecDay').value);
        const type = this.selectedRecurringType;

        if (editId) {
            Storage.updateRecurring(editId, { description, amount, categoryId, day, type });
            Utils.toast('Recorrência atualizada!', 'success');
        } else {
            Storage.addRecurring({ description, amount, categoryId, day, type });
            Utils.toast('Recorrência criada!', 'success');
        }

        this.closeRecurringModal();
        this.renderRecurring();
    },

    editRecurring(id) {
        this.openRecurringModal(id);
    },

    toggleRecurring(id) {
        const r = Storage.getRecurring().find(r => r.id === id);
        if (r) {
            Storage.updateRecurring(id, { active: !r.active });
            Utils.toast(r.active ? 'Recorrência pausada' : 'Recorrência ativada', 'info');
            this.renderRecurring();
        }
    },

    deleteRecurring(id) {
        const r = Storage.getRecurring().find(r => r.id === id);
        if (r && confirm(`Excluir "${r.description}"?`)) {
            Storage.removeRecurring(id);
            Utils.toast('Recorrência excluída', 'success');
            this.renderRecurring();
        }
    },

    // ========== HISTORY ==========
    renderHistory(month) {
        if (month === undefined) month = this.currentMonth;
        const tx = Storage.getTransactionsByMonth(this.currentYear, month);
        const summary = Utils.calculateSummary(tx);

        document.getElementById('historySummary').innerHTML = `
            <div class="history-stat">
                <span class="history-stat-label">Receitas</span>
                <span class="history-stat-value" style="color:var(--success)">${Utils.formatCurrency(summary.income)}</span>
            </div>
            <div class="history-stat">
                <span class="history-stat-label">Despesas</span>
                <span class="history-stat-value" style="color:var(--danger)">${Utils.formatCurrency(summary.expense)}</span>
            </div>
            <div class="history-stat">
                <span class="history-stat-label">Saldo</span>
                <span class="history-stat-value" style="color:${summary.balance >= 0 ? 'var(--success)' : 'var(--danger)'}">${Utils.formatCurrency(summary.balance)}</span>
            </div>
            <div class="history-stat">
                <span class="history-stat-label">Transações</span>
                <span class="history-stat-value">${tx.length}</span>
            </div>`;

        tx.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.renderTxList('historyList', tx);
    },

    // ========== EXPORT / IMPORT ==========
    exportAll() {
        Utils.downloadFile(JSON.stringify(Storage.exportData(), null, 2), 'financecontrol_backup_' + Utils.getTodayString() + '.json', 'application/json');
        Utils.toast('Backup exportado com sucesso!', 'success');
    },

    importAll(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.transactions && !data.categories && !data.budgets && !data.cards) {
                    Utils.toast('Arquivo de backup inválido', 'error');
                    return;
                }
                if (confirm('Importar dados do backup?\n\nIsso SUBSTITUIRÁ todos os dados atuais.')) {
                    Storage.importData(data);
                    this.populateCategorySelects();
                    this.populateCardSelect();
                    this.refreshAll();
                    this.renderSettings();
                    Utils.toast('Dados importados com sucesso!', 'success');
                }
            } catch (err) {
                Utils.toast('Erro ao ler arquivo: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    },

    clearAllData() {
        if (confirm('ATENÇÃO: Isso apagará TODOS os seus dados. Continuar?')) {
            if (confirm('Tem ABSOLUTA certeza?')) {
                Storage.clearAll();
                this.populateCategorySelects();
                this.populateCardSelect();
                this.refreshAll();
                this.renderSettings();
                Utils.toast('Todos os dados foram apagados', 'info');
            }
        }
    },

    cleanDuplicates() {
        const removed = Storage.cleanDuplicateRecurring();
        if (removed > 0) {
            Utils.toast(`${removed} transação(ões) duplicada(s) removida(s)!`, 'success');
            this.refreshAll();
        } else {
            Utils.toast('Nenhuma duplicata encontrada', 'info');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
