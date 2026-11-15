const Utils = {
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    },

    formatDate(dateStr) {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    },

    getMonthName(month) {
        return ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][month];
    },

    getMonthNameShort(month) {
        return ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][month];
    },

    getTodayString() {
        return new Date().toISOString().split('T')[0];
    },

    calculateSummary(transactions) {
        let income = 0, expense = 0;
        transactions.forEach(t => { if (t.type === 'income') income += t.amount; else expense += t.amount; });
        return { income, expense, balance: income - expense };
    },

    getExpensesByCategory(transactions) {
        const r = {};
        transactions.filter(t => t.type === 'expense').forEach(t => { r[t.categoryId] = (r[t.categoryId] || 0) + t.amount; });
        return r;
    },

    getMonthlyTotals(year) {
        const tx = Storage.getTransactions();
        return Array.from({ length: 12 }, (_, m) => {
            const monthTx = tx.filter(t => { const d = new Date(t.date + 'T00:00:00'); return d.getFullYear() === year && d.getMonth() === m; });
            let income = 0, expense = 0;
            monthTx.forEach(t => { if (t.type === 'income') income += t.amount; else expense += t.amount; });
            return { month: m, income, expense, balance: income - expense };
        });
    },

    generateCSV(transactions) {
        const cats = Storage.getCategories();
        let csv = 'Data,Descrição,Tipo,Categoria,Valor,Observação\n';
        transactions.forEach(t => {
            const cat = cats.find(c => c.id === t.categoryId);
            csv += `${t.date},"${t.description}","${t.type === 'income' ? 'Receita' : 'Despesa'}","${cat ? cat.name : 'Sem categoria'}",${t.amount},"${t.note || ''}"\n`;
        });
        return csv;
    },

    downloadFile(content, filename, type) {
        // No Android (WebView) o clique em <a download> nao faz nada.
        // Envia direto para a Activity, que grava o arquivo em Download/.
        if (window.AndroidBridge && typeof window.AndroidBridge.saveFile === 'function') {
            window.AndroidBridge.saveFile(filename, content, type || 'application/json');
            return;
        }
        const blob = new Blob([content], { type });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    },

    escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    },

    // Janela do marcador "novo" nos lancamentos recem-criados (48h).
    NEW_TX_WINDOW_MS: 48 * 60 * 60 * 1000,

    // "💳Itaú" -> "💳 Itaú": garante espaco entre um emoji/simbolo inicial
    // e o resto do nome do cartao (nomes salvos sem o espaco continuam iguais
    // nos demais pontos, apenas ganham o espaco na exibicao).
    formatCardName(name) {
        const s = String(name || '').trim();
        if (!s) return s;
        const m = s.match(/^([^\p{L}\p{N}\s]+)\s*(.*)$/u);
        if (!m) return s;
        return m[2] ? `${m[1]} ${m[2].trim()}` : m[1];
    },

    // Ordena pela ordem em que os lancamentos foram inseridos
    // (o mais recente fica no topo das listas).
    sortByInsertion(list) {
        return [...list].sort((a, b) =>
            (b.seq || 0) - (a.seq || 0) || (b.createdAt || 0) - (a.createdAt || 0)
        );
    },

    // true se o lancamento foi criado dentro da janela do selo "NOVO".
    isNewTransaction(tx) {
        if (!tx || !tx.createdAt) return false;
        return (Date.now() - tx.createdAt) < Utils.NEW_TX_WINDOW_MS;
    },

    // "Cartão de Passagem (3/6)" -> "cartao de passagem"
    // Acentos sao ignorados para o nome casar mesmo sem digitado.
    normalizeDescription(desc) {
        return String(desc || '')
            .replace(/\s*\(\d+\/\d+\)\s*$/, '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = { success: 'fa-check', error: 'fa-xmark', info: 'fa-info' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);
        setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 3000);
    }
};
