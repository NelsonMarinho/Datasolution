document.addEventListener('DOMContentLoaded', () => {
    fetch('/carregamentos')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da rede.');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const carregamentos = data.carregamentos;

                // Popula o seletor de anos
                const yearSelect = document.getElementById('yearSelect');
                const years = Array.from(new Set(carregamentos.map(c => c.data.substring(0, 4)))).sort();
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                });

                // Adicionar evento de mudança aos seletores de material e ano
                document.getElementById('materialSelect').addEventListener('change', function() {
                    updateCharts(carregamentos);
                    updateTotalExpedido(carregamentos);
                });
                document.getElementById('yearSelect').addEventListener('change', function() {
                    updateCharts(carregamentos);
                    updateTotalExpedido(carregamentos);
                });

                // Inicializa a visualização com todos os dados
                updateCharts(carregamentos);
                updateTotalExpedido(carregamentos);
            } else {
                alert('Erro ao carregar os carregamentos.');
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados:', error);
        });
});

function updateCharts(carregamentos) {
    const material = document.getElementById('materialSelect').value;
    const year = document.getElementById('yearSelect').value;

    updateTotalCarregadoPlotly(carregamentos, material, year);
    updateTotalPorFilialPlotly(carregamentos, material, year);
    updateQuantidadeCarregamentosPlotly(carregamentos, material, year);
    updateTotalVagoesPlotly(carregamentos, material, year);
    updateTotalPorDestinoPlotly(carregamentos, material, year);
}

function updateTotalExpedido(carregamentos) {
    const material = document.getElementById('materialSelect').value;
    const year = document.getElementById('yearSelect').value;

    let totalExpedido = 0;

    carregamentos.forEach(c => {
        if ((material !== 'todos' && c.material !== material) || (year !== 'todos' && c.data.substring(0, 4) !== year)) {
            return;
        }
        totalExpedido += parseFloat(c.volume);
    });

    document.getElementById('totalExpedido').textContent = totalExpedido.toLocaleString('pt-BR') + ' kg';
}

function updateTotalCarregadoPlotly(carregamentos, material, year) {
    const totalPorMes = {};

    carregamentos.forEach(c => {
        if ((material !== 'todos' && c.material !== material) || (year !== 'todos' && c.data.substring(0, 4) !== year)) {
            return;
        }

        const mes = c.data.substring(0, 7);
        const mesFormatado = formatarMesAno(mes);

        if (!totalPorMes[mesFormatado]) totalPorMes[mesFormatado] = 0;

        totalPorMes[mesFormatado] += parseFloat(c.volume);
    });

    const labels = Object.keys(totalPorMes);
    const values = Object.values(totalPorMes);

    const data = [{
        x: labels,
        y: values,
        type: 'bar',
        text: values.map(value => value.toLocaleString('pt-BR') + ' kg'),
        texttemplate: '<b>%{text}</b>',
        textposition: 'auto',
        hoverinfo: 'text',
        textfont: {
            size: 14
        },
        marker: {
            color: labels.map((_, index) => getBootstrapColor(index))
        }
    }];

    const layout = {
        title: 'Total Expedido Mensal',
        xaxis: {
            title: 'Mês'
        },
        yaxis: {
            title: 'Volume (kg)',
            showticklabels: true
        },
        showlegend: false
    };

    Plotly.newPlot('totalCarregadoChart', data, layout, {displayModeBar: false, staticPlot: true});
}

function updateTotalPorFilialPlotly(carregamentos, material, year) {
    const totalPorFilial = {};

    carregamentos.forEach(c => {
        if ((material !== 'todos' && c.material !== material) || (year !== 'todos' && c.data.substring(0, 4) !== year)) {
            return;
        }

        if (!totalPorFilial[c.filial]) totalPorFilial[c.filial] = 0;

        totalPorFilial[c.filial] += parseFloat(c.volume);
    });

    const labels = Object.keys(totalPorFilial);
    const values = Object.values(totalPorFilial);

    const data = [{
        x: labels,
        y: values,
        type: 'bar',
        text: values.map(value => value.toLocaleString('pt-BR') + ' kg'),
        texttemplate: '<b>%{text}</b>',
        textposition: 'auto',
        hoverinfo: 'text',
        textfont: {
            size: 14
        },
        marker: {
            color: labels.map((_, index) => getBootstrapColor(index))
        }
    }];

    const layout = {
        title: 'Total Expedido por Filial',
        xaxis: {
            title: 'Filial'
        },
        yaxis: {
            title: 'Volume (kg)',
            showticklabels: true
        },
        showlegend: false
    };

    Plotly.newPlot('totalPorFilialChart', data, layout, {displayModeBar: false, staticPlot: true});
}

function updateQuantidadeCarregamentosPlotly(carregamentos, material, year) {
    const quantidadePorMes = {};
    const diasCarregados = new Set();

    carregamentos.forEach(c => {
        if ((material !== 'todos' && c.material !== material) || (year !== 'todos' && c.data.substring(0, 4) !== year)) {
            return;
        }

        const dia = c.data.substring(0, 10);
        if (diasCarregados.has(dia)) {
            return;
        }
        diasCarregados.add(dia);

        const mes = c.data.substring(0, 7);
        const mesFormatado = formatarMesAno(mes);

        if (!quantidadePorMes[mesFormatado]) quantidadePorMes[mesFormatado] = 0;

        quantidadePorMes[mesFormatado] += 1; // Incrementa a quantidade de carregamentos no mês
    });

    const labels = Object.keys(quantidadePorMes);
    const values = Object.values(quantidadePorMes);

    const data = [{
        x: labels,
        y: values,
        type: 'bar',
        text: values.map(value => value.toLocaleString('pt-BR')),
        texttemplate: '<b>%{text}</b>',
        textposition: 'auto',
        hoverinfo: 'text',
        textfont: {
            size: 14
        },
        marker: {
            color: labels.map((_, index) => getBootstrapColor(index))
        }
    }];

    const layout = {
        title: 'Quantidade de Carregamentos por Mês',
        xaxis: {
            title: 'Mês'
        },
        yaxis: {
            title: 'Quantidade',
            showticklabels: true
        },
        showlegend: false
    };

    Plotly.newPlot('quantidadeCarregamentosChart', data, layout, {displayModeBar: false, staticPlot: true});
}

function updateTotalVagoesPlotly(carregamentos, material, year) {
    const totalVagoesPorMes = {};

    carregamentos.forEach(c => {
        if ((material !== 'todos' && c.material !== material) || (year !== 'todos' && c.data.substring(0, 4) !== year)) {
            return;
        }

        const mes = c.data.substring(0, 7);
        const mesFormatado = formatarMesAno(mes);

        if (!totalVagoesPorMes[mesFormatado]) totalVagoesPorMes[mesFormatado] = 0;

        totalVagoesPorMes[mesFormatado] += parseInt(c.vagoes);
    });

    const labels = Object.keys(totalVagoesPorMes);
    const values = Object.values(totalVagoesPorMes);

    const data = [{
        x: labels,
        y: values,
        type: 'bar',
        text: values.map(value => value.toLocaleString('pt-BR')),
        texttemplate: '<b>%{text}</b>',
        textposition: 'auto',
        hoverinfo: 'text',
        textfont: {
            size: 14
        },
        marker: {
            color: labels.map((_, index) => getBootstrapColor(index))
        }
    }];

    const layout = {
        title: 'Total de Vagões Mensal',
        xaxis: {
            title: 'Mês'
        },
        yaxis: {
            title: 'Número de Vagões',
            showticklabels: true
        },
        showlegend: false
    };

    Plotly.newPlot('totalVagoesChart', data, layout, {displayModeBar: false, staticPlot: true});
}

function updateTotalPorDestinoPlotly(carregamentos, material, year) {
    const totalPorDestino = {};

    carregamentos.forEach(c => {
        if ((material !== 'todos' && c.material !== material) || (year !== 'todos' && c.data.substring(0, 4) !== year)) {
            return;
        }

        if (!totalPorDestino[c.destino]) totalPorDestino[c.destino] = 0;

        totalPorDestino[c.destino] += parseFloat(c.volume);
    });

    const labels = Object.keys(totalPorDestino);
    const values = Object.values(totalPorDestino);

    const data = [{
        x: labels,
        y: values,
        type: 'bar',
        text: values.map(value => value.toLocaleString('pt-BR') + ' kg'),
        texttemplate: '<b>%{text}</b>',
        textposition: 'auto',
        hoverinfo: 'text',
        textfont: {
            size: 14
        },
        marker: {
            color: labels.map((_, index) => getBootstrapColor(index))
        }
    }];

    const layout = {
        title: 'Volume Expedido por Destino',
        xaxis: {
            title: 'Destino'
        },
        yaxis: {
            title: 'Volume (kg)',
            showticklabels: true
        },
        showlegend: false
    };

    Plotly.newPlot('totalPorDestinoChart', data, layout, {displayModeBar: false, staticPlot: true});
}

const bootstrapColors = [
    'rgba(0, 123, 255, 0.7)',  // Primary
    'rgba(40, 167, 69, 0.7)',  // Success
    'rgba(255, 193, 7, 0.7)',  // Warning
    'rgba(220, 53, 69, 0.7)',  // Danger
    'rgba(23, 162, 184, 0.7)', // Info
    'rgba(108, 117, 125, 0.7)',// Secondary
    'rgba(52, 58, 64, 0.7)',   // Dark
    'rgba(255, 255, 255, 0.7)' // Light
];

function getBootstrapColor(index) {
    return bootstrapColors[index % bootstrapColors.length];
}

function formatarMesAno(mesAno) {
    const [ano, mes] = mesAno.split('-');
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${meses[parseInt(mes) - 1]}-${ano}`;
}
