document.addEventListener('DOMContentLoaded', function() {
    loadCarregamentos();
});

document.getElementById('carregamentoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = document.getElementById('carregamentoId').value;
    const data = document.getElementById('data').value;
    const composicao = document.getElementById('composicao').value.toUpperCase();
    const vagoes = document.getElementById('vagoes').value;
    const destino = document.getElementById('destino').value;
    const filial = document.getElementById('filial').value;
    const material = document.getElementById('material').value;
    const volume = document.getElementById('volume').value.replace(/\D/g, '');

    if (!data || !composicao || !vagoes || !destino || !filial || !material || !volume) {
        alert('Todos os campos são obrigatórios!');
        return;
    }

    const carregamento = {
        data: data,
        composicao: composicao,
        vagoes: parseInt(vagoes),
        destino: destino,
        filial: filial,
        material: material,
        volume: parseFloat(volume)
    };

    const url = id ? `/carregamentos/${id}` : '/carregamentos';
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(carregamento)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('carregamentoForm').reset();
            document.getElementById('submitButton').textContent = 'Registrar Expedição';
            document.getElementById('carregamentoId').value = '';
            const message = document.getElementById('message');
            message.textContent = 'Expedição registrada com sucesso!';
            message.style.display = 'block';
            setTimeout(() => {
                message.style.display = 'none';
            }, 3000);
            loadCarregamentos();
        } else {
            alert('Erro ao registrar a expedição.');
        }
    })
    .catch(error => {
        console.error('Erro ao registrar a expedição:', error);
        alert('Erro ao registrar a expedição.');
    });
});

function loadCarregamentos() {
    fetch('/carregamentos')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const tableBody = document.getElementById('carregamentoTableBody');
            if (tableBody) {
                tableBody.innerHTML = '';
                data.carregamentos.forEach(carregamento => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDate(carregamento.data)}</td>
                        <td>${carregamento.composicao}</td>
                        <td>${carregamento.vagoes}</td>
                        <td>${carregamento.destino}</td>
                        <td>${carregamento.filial}</td>
                        <td>${carregamento.material}</td>
                        <td>${formatVolume(carregamento.volume)}</td>
                        <td>
                            <button class="btn btn-warning btn-sm edit-button" onclick="confirmEditCarregamento(${carregamento.id}, '${carregamento.composicao}')">Editar</button>
                            <button class="btn btn-danger btn-sm delete-button" onclick="deleteCarregamento(${carregamento.id})">Excluir</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                console.error('Elemento "carregamentoTableBody" não encontrado no DOM.');
            }
        } else {
            alert('Erro ao carregar os carregamentos: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao carregar os carregamentos:', error);
        alert('Erro ao carregar os carregamentos.');
    });

    // Ajustar visibilidade dos botões conforme o papel do usuário
    const userRole = '<%= role %>';
    if (userRole === 'user') {
        document.querySelectorAll('.edit-button').forEach(button => button.style.display = 'none');
        document.querySelectorAll('.delete-button').forEach(button => button.style.display = 'none');
    }
}

function formatDate(dateString) {
    const dateParts = dateString.split("-");
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
}

function formatVolume(volume) {
    return volume.toLocaleString('pt-BR') + ' kg';
}

function confirmEditCarregamento(id, composicao) {
    const confirmMessage = document.getElementById('confirmMessage');
    confirmMessage.textContent = `Você deseja mesmo editar a composição "${composicao}"?`;
    const confirmButton = document.getElementById('confirmButton');
    confirmButton.onclick = function() {
        editCarregamento(id);
        $('#confirmModal').modal('hide');
    };
    $('#confirmModal').modal('show');
}

function editCarregamento(id) {
    fetch(`/carregamentos/${id}`)
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const carregamento = data.carregamento;
            document.getElementById('carregamentoId').value = carregamento.id;
            document.getElementById('data').value = carregamento.data;
            document.getElementById('composicao').value = carregamento.composicao;
            document.getElementById('vagoes').value = carregamento.vagoes;
            document.getElementById('destino').value = carregamento.destino;
            document.getElementById('filial').value = carregamento.filial;
            document.getElementById('material').value = carregamento.material;
            document.getElementById('volume').value = carregamento.volume;
            document.getElementById('submitButton').textContent = 'Atualizar Expedição';
        } else {
            alert('Erro ao carregar os detalhes da expedição.');
        }
    })
    .catch(error => {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar os detalhes da expedição.');
    });
}

function deleteCarregamento(id) {
    if (confirm('Tem certeza que deseja excluir esta expedição?')) {
        fetch(`/carregamentos/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadCarregamentos();
            } else {
                alert('Erro ao excluir a expedição.');
            }
        })
        .catch(error => {
            console.error('Erro ao excluir a expedição:', error);
            alert('Erro ao excluir a expedição.');
        });
    }
}

function openPage(pageName, elmnt) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("nav-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.className += " active";
}

function searchByDate() {
    const searchDate = document.getElementById('searchDate').value;
    if (!searchDate) {
        alert('Por favor, selecione uma data.');
        return;
    }

    fetch('/carregamentos')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const searchResults = document.getElementById('searchResults');
            const searchResultsBody = document.getElementById('searchResultsBody');
            searchResultsBody.innerHTML = '';
            data.carregamentos.forEach(carregamento => {
                if (carregamento.data === searchDate) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDate(carregamento.data)}</td>
                        <td>${carregamento.composicao}</td>
                        <td>${carregamento.vagoes}</td>
                        <td>${carregamento.destino}</td>
                        <td>${carregamento.filial}</td>
                        <td>${carregamento.material}</td>
                        <td>${formatVolume(carregamento.volume)}</td>
                        <td>
                            <button class="btn btn-warning btn-sm edit-button" onclick="confirmEditCarregamento(${carregamento.id}, '${carregamento.composicao}')">Editar</button>
                            <button class="btn btn-danger btn-sm delete-button" onclick="deleteCarregamento(${carregamento.id})">Excluir</button>
                        </td>
                    `;
                    searchResultsBody.appendChild(row);
                }
            });
            searchResults.style.display = 'block';
        } else {
            alert('Nenhum carregamento encontrado para a data selecionada.');
        }
    })
    .catch(error => {
        console.error('Erro ao buscar carregamentos:', error);
        alert('Erro ao buscar carregamentos.');
    });
}

// Defina a aba padrão aberta
document.getElementById("defaultOpen").click();

// Função para formatar o campo de volume com pontos e adicionar 'kg'
document.getElementById('volume').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove qualquer caractere não numérico
    value = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Adiciona pontos
    e.target.value = value + ' kg';
});

// Função para forçar o campo composição a ficar em caixa alta
document.getElementById('composicao').addEventListener('input', function (e) {
    e.target.value = e.target.value.toUpperCase();
});
