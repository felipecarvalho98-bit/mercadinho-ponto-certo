function fazerLogin() {

    const usuario = document
        .getElementById("usuarioAdmin")
        .value;

    const senha = document
        .getElementById("senhaAdmin")
        .value;

    if (
        usuario === "admin"
        &&
        senha === "1234"
    ) {

        document.getElementById("loginAdmin")
            .style.display = "none";

        document.getElementById("painelAdmin")
            .style.display = "block";

        carregarPedidos();

    } else {

        alert("Usuário ou senha inválidos");
    }
}

let produtos = [];

let pedidosGlobais = [];

function cadastrarProduto() {

    const nome = document.getElementById("produtoNome").value;

    const preco = document.getElementById("produtoPreco").value;

    const estoque = document.getElementById("produtoEstoque").value;

    const imagem = document.getElementById("produtoImagem").value;

    const categoria = document.getElementById("produtoCategoria").value;

    produtos.push({

    nome,
    preco,
    estoque,
    imagem,
    categoria

    });
    atualizarTabela();
    atualizarDashboard();

    fetch("https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec", {

    method: "POST",

    body: JSON.stringify({

        tipo: "produto",

        nome: nome,

        preco: preco,

        estoque: estoque,

        imagem: imagem,

        categoria: categoria

    })

});

    limparCampos();
}

function atualizarTabela() {

    const tbody = document.querySelector("#tabelaProdutos tbody");

    tbody.innerHTML = "";

    produtos.forEach(produto => {

            tbody.innerHTML += `

            <tr>

                <td>${produto.nome}</td>

                <td>R$ ${produto.preco}</td>

                <td>${produto.estoque}</td>

            <td>

                <button onclick="editarProduto('${produto.nome}')">

                    Editar

                </button>

                <button onclick="excluirProduto('${produto.nome}')">

                    Excluir

                </button>

            </td>

            </tr>

        `;
    });
}

function limparCampos() {

    document.getElementById("produtoNome").value = "";

    document.getElementById("produtoPreco").value = "";

    document.getElementById("produtoEstoque").value = "";

    document.getElementById("produtoImagem").value = "";

    document.getElementById("produtoCategoria").value = "";
}

function excluirProduto(nome) {

    produtos = produtos.filter(produto => produto.nome !== nome);

    atualizarTabela();

    fetch("https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec", {

        method: "POST",

        body: JSON.stringify({

            tipo: "excluir",

            nome: nome

        })

    });
}

function editarProduto(nome) {

    const produto = produtos.find(p => p.nome === nome);

    document.getElementById("produtoNome").value = produto.nome;

    document.getElementById("produtoPreco").value = produto.preco;

    document.getElementById("produtoEstoque").value = produto.estoque;

    document.getElementById("produtoImagem").value = produto.imagem;

    excluirProduto(nome);
}

function carregarPedidos() {

    fetch("https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec?tipo=pedidos")

        .then(resposta => resposta.json())

        .then(pedidos => {

            pedidosGlobais = pedidos;

            atualizarDashboard(pedidos);

            renderizarPedidos([...pedidos]);

            const tbody = document.querySelector("#tabelaPedidos tbody");

            tbody.innerHTML = "";

            pedidos.reverse().forEach(pedido => {

                tbody.innerHTML += `

                    <tr>
                        <td>${pedido.nome}</td>
                        <td>${pedido.telefone}</td>
                        <td>${pedido.endereco}</td>
                        <td>${pedido.pagamento}</td>
                        <td>${pedido.entrega}</td>
                        <td>${pedido.pedido}</td>
                        <td>R$ ${Number(pedido.total).toFixed(2)}</td>
                        <td>
                            <select 
                                class="status-select ${classeStatus(pedido.status)}"
                                onchange="alterarStatusPedido(${pedido.linha}, this.value)"
                                >
                                <option value="Pendente" ${pedido.status === "Pendente" ? "selected" : ""}>
                                    Pendente
                                </option>

                                <option value="Em separação" ${pedido.status === "Em separação" ? "selected" : ""}>
                                    Em separação
                                </option>

                                <option value="Saiu para entrega" ${pedido.status === "Saiu para entrega" ? "selected" : ""}>
                                    Saiu para entrega
                                </option>

                                <option value="Concluído" ${pedido.status === "Concluído" ? "selected" : ""}>
                                    Concluído
                                </option>

                                <option value="Cancelado" ${pedido.status === "Cancelado" ? "selected" : ""}>
                                    Cancelado
                                </option>
                            </select>
                        </td>
                    </tr>

                `;
            });
        });
}

function alterarStatusPedido(linha, status) {

    const select = event.target;

    select.className = `status-select ${classeStatus(status)}`;

    fetch("https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec", {

        method: "POST",

        body: JSON.stringify({

            tipo: "status",

            linha: linha,

            status: status

        })

    })
    .then(resposta => resposta.text())
    .then(resposta => {

        console.log("Status atualizado:", resposta);

        alert("Status atualizado com sucesso!");

        carregarPedidos();
    })
    .catch(erro => {

        console.error("Erro ao atualizar status:", erro);

        alert("Erro ao atualizar status.");
    });
}

function atualizarDashboard(pedidos = []) {

    const totalProdutos = produtos.length;

    const totalPedidos = pedidos.length;

    const pedidosPendentes = pedidos.filter(pedido => {
        return pedido.status === "Pendente";
    }).length;

    const pedidosConcluidos = pedidos.filter(pedido => {
        return pedido.status === "Concluído";
    }).length;

    const hoje = new Date();

    const mesAtual = hoje.getMonth();

    const anoAtual = hoje.getFullYear();

    let vendasMes = 0;

    pedidos.forEach(pedido => {

        const dataPedido = new Date(pedido.data);

        const mesmoMes = dataPedido.getMonth() === mesAtual;

        const mesmoAno = dataPedido.getFullYear() === anoAtual;

        if (
            pedido.status === "Concluído"
            &&
            mesmoMes
            &&
            mesmoAno
        ) {

            vendasMes += Number(pedido.total);
        }
    });

    document.getElementById("totalProdutos").innerText = totalProdutos;

    document.getElementById("totalPedidos").innerText = totalPedidos;

    document.getElementById("pedidosPendentes").innerText = pedidosPendentes;

    document.getElementById("pedidosConcluidos").innerText = pedidosConcluidos;

    document.getElementById("vendasMes").innerText = `R$ ${vendasMes.toFixed(2)}`;
}

function classeStatus(status) {

    if (status === "Pendente") {
        return "status-pendente";
    }

    if (status === "Em separação") {
        return "status-separacao";
    }

    if (status === "Saiu para entrega") {
        return "status-entrega";
    }

    if (status === "Concluído") {
        return "status-concluido";
    }

    if (status === "Cancelado") {
        return "status-cancelado";
    }

    return "";
}

function renderizarPedidos(pedidos) {

    const tbody = document.querySelector("#tabelaPedidos tbody");

    tbody.innerHTML = "";

    pedidos
        .slice()
        .reverse()
        .forEach(pedido => {

        tbody.innerHTML += `

            <tr>
                <td>${pedido.nome}</td>
                <td>${pedido.telefone}</td>
                <td>${pedido.endereco}</td>
                <td>${pedido.pagamento}</td>
                <td>${pedido.entrega}</td>
                <td>${formatarPedido(pedido.pedido)}</td>
                <td>R$ ${Number(pedido.total).toFixed(2)}</td>

                <td>
                    <select 
                        class="status-select ${classeStatus(pedido.status)}"
                        onchange="alterarStatusPedido(${pedido.linha}, this.value)"
                    >
                        <option value="Pendente" ${pedido.status === "Pendente" ? "selected" : ""}>
                            Pendente
                        </option>

                        <option value="Em separação" ${pedido.status === "Em separação" ? "selected" : ""}>
                            Em separação
                        </option>

                        <option value="Saiu para entrega" ${pedido.status === "Saiu para entrega" ? "selected" : ""}>
                            Saiu para entrega
                        </option>

                        <option value="Concluído" ${pedido.status === "Concluído" ? "selected" : ""}>
                            Concluído
                        </option>

                        <option value="Cancelado" ${pedido.status === "Cancelado" ? "selected" : ""}>
                            Cancelado
                        </option>
                    </select>
                </td>
            </tr>

        `;
    });
}

function filtrarPedidosPorMes() {

    const valorFiltro = document.getElementById("filtroMes").value;

    if (!valorFiltro) {
        renderizarPedidos([...pedidosGlobais]);
        atualizarDashboard(pedidosGlobais);
        return;
    }

    const pedidosFiltrados = pedidosGlobais.filter(pedido => {

        const dataPedido = new Date(pedido.data);

        const ano = dataPedido.getFullYear();

        const mes = String(dataPedido.getMonth() + 1).padStart(2, "0");

        const anoMesPedido = `${ano}-${mes}`;

        return anoMesPedido === valorFiltro;
    });

    renderizarPedidos([...pedidosFiltrados]);

    atualizarDashboard(pedidosFiltrados);
}

function limparFiltroMes() {

    document.getElementById("filtroMes").value = "";

    renderizarPedidos([...pedidosGlobais]);

    atualizarDashboard(pedidosGlobais);
}

function formatarPedido(textoPedido) {

    if (!textoPedido) {
        return "";
    }

    return textoPedido
        .split(",")
        .map(item => item.trim())
        .join("<br>");
}