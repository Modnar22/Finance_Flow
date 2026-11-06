const Charts = {
    categoryChart: null,
    monthlyChart: null,

    init() {
        Chart.defaults.color = '#52525b';
        Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
        Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
        this.createCategoryChart();
        this.createMonthlyChart();
    },

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        this.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 8 }] },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: "'Inter'" } }
                    },
                    tooltip: {
                        backgroundColor: '#1f1f23',
                        titleColor: '#fafafa',
                        bodyColor: '#a1a1aa',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: ctx => ` ${ctx.label}: ${Utils.formatCurrency(ctx.raw)}`
                        }
                    }
                }
            }
        });
    },

    createMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    { label: 'Receitas', data: [], backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.6 },
                    { label: 'Despesas', data: [], backgroundColor: '#ef4444', borderRadius: 6, barPercentage: 0.6 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: { font: { size: 11 }, callback: v => 'R$ ' + v.toLocaleString('pt-BR') }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
                    },
                    tooltip: {
                        backgroundColor: '#1f1f23',
                        titleColor: '#fafafa',
                        bodyColor: '#a1a1aa',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            label: ctx => ` ${ctx.dataset.label}: ${Utils.formatCurrency(ctx.raw)}`
                        }
                    }
                }
            }
        });
    },

    update(year, month) {
        const tx = Storage.getTransactionsByMonth(year, month);
        const cats = Storage.getCategories();
        const expByCat = Utils.getExpensesByCategory(tx);

        const labels = [], data = [], colors = [];
        Object.entries(expByCat).sort((a, b) => b[1] - a[1]).forEach(([catId, amount]) => {
            const cat = cats.find(c => c.id === catId);
            if (cat) { labels.push(cat.name); data.push(amount); colors.push(cat.color); }
        });

        if (data.length === 0) { labels.push('Sem dados'); data.push(1); colors.push('#27272a'); }

        this.categoryChart.data.labels = labels;
        this.categoryChart.data.datasets[0].data = data;
        this.categoryChart.data.datasets[0].backgroundColor = colors;
        this.categoryChart.update();

        const totals = Utils.getMonthlyTotals(year);
        this.monthlyChart.data.labels = totals.map(t => Utils.getMonthNameShort(t.month));
        this.monthlyChart.data.datasets[0].data = totals.map(t => t.income);
        this.monthlyChart.data.datasets[1].data = totals.map(t => t.expense);
        this.monthlyChart.update();
    }
};
