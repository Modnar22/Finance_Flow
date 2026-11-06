const Storage = {
    KEYS: {
        TRANSACTIONS: 'fc_transactions',
        CATEGORIES: 'fc_categories',
        BUDGETS: 'fc_budgets',
        CARDS: 'fc_cards',
        CREDIT_LIMIT: 'fc_credit_limit',
        RECURRING: 'fc_recurring',
        RECURRING_GENERATED: 'fc_recurring_generated'
    },

    defaultCategories: [
        { id: 'cat_1', name: 'Alimentação', color: '#ef4444', icon: 'utensils' },
        { id: 'cat_2', name: 'Transporte', color: '#f59e0b', icon: 'car' },
        { id: 'cat_3', name: 'Moradia', color: '#6366f1', icon: 'house' },
        { id: 'cat_4', name: 'Lazer', color: '#ec4899', icon: 'gamepad' },
        { id: 'cat_5', name: 'Saúde', color: '#10b981', icon: 'heart-pulse' },
        { id: 'cat_6', name: 'Educação', color: '#3b82f6', icon: 'graduation-cap' },
        { id: 'cat_7', name: 'Vestuário', color: '#8b5cf6', icon: 'shirt' },
        { id: 'cat_8', name: 'Assinaturas', color: '#06b6d4', icon: 'tv' },
        { id: 'cat_9', name: 'Freelance', color: '#22c55e', icon: 'laptop' },
        { id: 'cat_10', name: 'Salário', color: '#10b981', icon: 'briefcase' },
        { id: 'cat_11', name: 'Outros', color: '#71717a', icon: 'ellipsis' }
    ],

    init() {
        if (!localStorage.getItem(this.KEYS.CATEGORIES))
            localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(this.defaultCategories));
        if (!localStorage.getItem(this.KEYS.TRANSACTIONS))
            localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify([]));
        if (!localStorage.getItem(this.KEYS.BUDGETS))
            localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify({}));
        if (!localStorage.getItem(this.KEYS.CARDS))
            localStorage.setItem(this.KEYS.CARDS, JSON.stringify([]));
        if (!localStorage.getItem(this.KEYS.RECURRING))
            localStorage.setItem(this.KEYS.RECURRING, JSON.stringify([]));
        if (!localStorage.getItem(this.KEYS.RECURRING_GENERATED))
            localStorage.setItem(this.KEYS.RECURRING_GENERATED, JSON.stringify([]));
        this.migrateCreditLimit();
    },

    migrateCreditLimit() {
        const oldLimit = JSON.parse(localStorage.getItem(this.KEYS.CREDIT_LIMIT) || '0');
        if (oldLimit > 0 && this.getCards().length === 0) {
            this.addCard({ name: 'Cartão Principal', limit: oldLimit, color: '#6366f1' });
            localStorage.removeItem(this.KEYS.CREDIT_LIMIT);
        }
    },

    // Cards
    getCards() { return JSON.parse(localStorage.getItem(this.KEYS.CARDS) || '[]'); },
    saveCards(cards) { localStorage.setItem(this.KEYS.CARDS, JSON.stringify(cards)); },

    addCard(card) {
        const all = this.getCards();
        card.id = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        card.limit = card.limit || 0;
        card.color = card.color || '#6366f1';
        all.push(card);
        this.saveCards(all);
        return card;
    },

    updateCard(id, data) {
        const all = this.getCards();
        const i = all.findIndex(c => c.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; this.saveCards(all); return all[i]; }
        return null;
    },

    removeCard(id) {
        this.saveCards(this.getCards().filter(c => c.id !== id));
        const all = this.getTransactions();
        all.forEach(t => { if (t.cardId === id) t.cardId = null; });
        this.saveTransactions(all);
    },

    getCardById(id) { return this.getCards().find(c => c.id === id); },

    calculateUsedCreditByCard(cardId) {
        return this.getPendingExpenses()
            .filter(t => t.cardId === cardId)
            .reduce((s, t) => s + t.amount, 0);
    },

    calculateAvailableCreditByCard(cardId) {
        const card = this.getCardById(cardId);
        if (!card) return 0;
        return Math.max(card.limit - this.calculateUsedCreditByCard(cardId), 0);
    },

    getTotalCreditLimit() {
        return this.getCards().reduce((s, c) => s + c.limit, 0);
    },

    getTotalUsedCredit() {
        return this.getPendingExpenses().reduce((s, t) => s + t.amount, 0);
    },

    getTotalAvailableCredit() {
        return Math.max(this.getTotalCreditLimit() - this.getTotalUsedCredit(), 0);
    },

    // Transactions
    getTransactions() { return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]'); },
    saveTransactions(tx) { localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(tx)); },

    addTransaction(transaction) {
        const all = this.getTransactions();
        transaction.id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        all.push(transaction);
        this.saveTransactions(all);
        return transaction;
    },

    updateTransaction(id, data) {
        const all = this.getTransactions();
        const i = all.findIndex(t => t.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; this.saveTransactions(all); return all[i]; }
        return null;
    },

    deleteTransaction(id) {
        this.saveTransactions(this.getTransactions().filter(t => t.id !== id));
    },

    getTransactionsByMonth(year, month) {
        return this.getTransactions().filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    },

    getPendingExpenses() {
        return this.getTransactions().filter(t => t.type === 'expense' && !t.paid);
    },

    togglePaid(id) {
        const all = this.getTransactions();
        const tx = all.find(t => t.id === id);
        if (tx) { tx.paid = !tx.paid; this.saveTransactions(all); return tx.paid; }
        return null;
    },

    markGroupAsPaid(groupId, paid) {
        const all = this.getTransactions();
        all.forEach(t => { if (t.groupId === groupId) t.paid = paid; });
        this.saveTransactions(all);
    },

    updateGroup(groupId, updates) {
        const all = this.getTransactions();
        all.forEach(t => { if (t.groupId === groupId) Object.assign(t, updates); });
        this.saveTransactions(all);
    },

    // Categories
    getCategories() { return JSON.parse(localStorage.getItem(this.KEYS.CATEGORIES) || '[]'); },
    saveCategories(c) { localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(c)); },

    addCategory(cat) {
        const all = this.getCategories();
        cat.id = 'cat_' + Date.now();
        all.push(cat);
        this.saveCategories(all);
        return cat;
    },

    updateCategory(id, data) {
        const all = this.getCategories();
        const i = all.findIndex(c => c.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; this.saveCategories(all); return all[i]; }
        return null;
    },

    removeCategory(id) {
        this.saveCategories(this.getCategories().filter(c => c.id !== id));
    },

    getCategoryById(id) { return this.getCategories().find(c => c.id === id); },

    // Budgets
    getBudgets() { return JSON.parse(localStorage.getItem(this.KEYS.BUDGETS) || '{}'); },
    saveBudgets(b) { localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(b)); },

    setBudget(categoryId, amount) {
        const b = this.getBudgets(); b[categoryId] = amount; this.saveBudgets(b);
    },

    // Legacy compat
    getCreditLimit() { return this.getTotalCreditLimit(); },
    setCreditLimit(limit) {
        const cards = this.getCards();
        if (cards.length > 0) { cards[0].limit = limit; this.saveCards(cards); }
    },

    clearAll() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
        this.init();
    },

    exportData() {
        return {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            budgets: this.getBudgets(),
            cards: this.getCards(),
            recurring: this.getRecurring(),
            recurringGenerated: JSON.parse(localStorage.getItem(this.KEYS.RECURRING_GENERATED) || '[]'),
            exportDate: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.transactions) localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
        if (data.categories) localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(data.categories));
        if (data.budgets) localStorage.setItem(this.KEYS.BUDGETS, JSON.stringify(data.budgets));
        if (data.cards) localStorage.setItem(this.KEYS.CARDS, JSON.stringify(data.cards));
        if (data.recurring) localStorage.setItem(this.KEYS.RECURRING, JSON.stringify(data.recurring));
        if (data.recurringGenerated) localStorage.setItem(this.KEYS.RECURRING_GENERATED, JSON.stringify(data.recurringGenerated));
    },

    // Recurring
    getRecurring() { return JSON.parse(localStorage.getItem(this.KEYS.RECURRING) || '[]'); },
    saveRecurring(r) { localStorage.setItem(this.KEYS.RECURRING, JSON.stringify(r)); },

    addRecurring(item) {
        const all = this.getRecurring();
        item.id = 'rcr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        item.active = true;
        item.createdAt = new Date().toISOString();
        all.push(item);
        this.saveRecurring(all);
        return item;
    },

    updateRecurring(id, data) {
        const all = this.getRecurring();
        const i = all.findIndex(r => r.id === id);
        if (i !== -1) { all[i] = { ...all[i], ...data }; this.saveRecurring(all); return all[i]; }
        return null;
    },

    removeRecurring(id) {
        this.saveRecurring(this.getRecurring().filter(r => r.id !== id));
    },

    cleanDuplicateRecurring() {
        const all = this.getTransactions();
        const recurring = this.getRecurring();
        const toRemove = [];

        recurring.forEach(r => {
            const txForRecurring = all.filter(t => t.recurringId === r.id);
            if (txForRecurring.length > 1) {
                const byMonth = {};
                txForRecurring.forEach(t => {
                    const d = new Date(t.date);
                    const key = `${d.getFullYear()}-${d.getMonth()}`;
                    if (!byMonth[key]) byMonth[key] = [];
                    byMonth[key].push(t);
                });
                Object.values(byMonth).forEach(monthTx => {
                    if (monthTx.length > 1) {
                        monthTx.slice(1).forEach(t => toRemove.push(t.id));
                    }
                });
            }
        });

        if (toRemove.length > 0) {
            const cleaned = all.filter(t => !toRemove.includes(t.id));
            this.saveTransactions(cleaned);
        }
        return toRemove.length;
    },

    generateRecurringTransactions() {
        const recurring = this.getRecurring().filter(r => r.active);
        if (!recurring.length) return 0;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const monthKey = `${currentYear}-${currentMonth}`;

        const generated = JSON.parse(localStorage.getItem(this.KEYS.RECURRING_GENERATED) || '[]');
        if (generated.includes(monthKey)) return 0;

        let created = 0;
        recurring.forEach(r => {
            const day = Math.min(r.day || 1, 28);
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            this.addTransaction({
                type: r.type,
                description: r.description,
                amount: r.amount,
                categoryId: r.categoryId,
                date: dateStr,
                note: 'Recorrente',
                installments: 1,
                installmentCurrent: 1,
                groupId: null,
                paid: new Date(dateStr + 'T00:00:00') <= today,
                cardId: null,
                recurringId: r.id
            });
            created++;
        });

        if (created > 0) {
            generated.push(monthKey);
            localStorage.setItem(this.KEYS.RECURRING_GENERATED, JSON.stringify(generated));
        }

        return created;
    }
};
