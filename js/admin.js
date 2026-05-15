const API_URL = "https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec";

let produtos = [];
let pedidosGlobais = [];
let produtoEditando = null;

function fazerLogin() {

    const usuario = document.getElementById("usuarioAdmin").value;
    const senha = document.getElementById("senhaAdmin").value;

    if (usuario === "admin" && senha === "1234") {

        document.getElementById("loginAdmin").style.display = "none";
        document.getElementById("painelAdmin").style.display = "block";

        mostrarAbaAdmin("dashboard");

        carregarProdutos();
        carregarPedidos();

    } else {

        alert("Usuário ou senha inválidos");
    }
}

function mostrarAbaAdmin(aba) {

    const abaDashboard = document.getElementById("abaDashboard");
    const abaPedidos = document.getElementById("abaPedidos");
    const abaProdutos = document.getElementById("abaProdutos");

    if (abaDashboard) {
        abaDashboard.style.display = "none";
    }

    if (abaPedidos) {
        abaPedidos.style.display = "none";
    }

    if (abaProdutos) {
        abaProdutos.style.display = "none";
    }

    if (aba === "dashboard" && abaDashboard) {
        abaDashboard.style.display = "block";
    }

    if (aba === "pedidos" && abaPedidos) {
        abaPedidos.style.display = "block";
    }

    if (aba === "produtos" && abaProdutos) {
        abaProdutos.style.display = "block";
    }

    const botoes = document.querySelectorAll(".abas-admin button");

    botoes.forEach(botao => {
        botao.classList.remove("aba-ativa");
    });

    const botaoSelecionado = document.querySelector(
        `.abas-admin button[data-aba="${aba}"]`
    );

    if (botaoSelecionado) {
        botaoSelecionado.classList.add("aba-ativa");
    }
}

function carregarProdutos() {

    fetch(API_URL)

        .then(resposta => resposta.json())

        .then(produtosRecebidos => {

            produtos = produtosRecebidos;

            atualizarTabela([]);

            atualizarDashboard(pedidosGlobais);
        })

        .catch(erro => {

            console.error("Erro ao carregar produtos:", erro);

            alert("Erro ao carregar produtos.");
        });
}

function cadastrarProduto() {

    const nome = document.getElementById("produtoNome").value.trim();
    const preco = document.getElementById("produtoPreco").value.trim();
    const estoque = document.getElementById("produtoEstoque").value.trim();
    const imagem = document.getElementById("produtoImagem").value.trim();
    const codigo = document.getElementById("produtoCodigo").value.trim();
    const categoria = document.getElementById("produtoCategoria").value;
    const tipoVenda = document.getElementById("produtoTipoVenda").value;

    if (!nome || !preco || !estoque || !imagem || !categoria || !codigo || !tipoVenda) {
        alert("Preencha todos os campos do produto!");
        return;
    }

    const produtoNovo = {
        nome,
        preco,
        estoque,
        imagem,
        categoria,
        codigo,
        tipoVenda
    };

    if (produtoEditando) {

        const confirmarEdicao = confirm(
            `Deseja salvar as alterações do produto "${produtoEditando}"?`
        );

        if (!confirmarEdicao) {
            return;
        }

        produtos = produtos.filter(produto => {
            return produto.nome !== produtoEditando;
        });

        produtos.push(produtoNovo);

        fetch(API_URL, {

            method: "POST",

            body: JSON.stringify({
                tipo: "excluir",
                nome: produtoEditando
            })

        })
        .then(() => {

            return fetch(API_URL, {

                method: "POST",

                body: JSON.stringify({
                    tipo: "produto",
                    nome,
                    preco,
                    estoque,
                    imagem,
                    categoria,
                    codigo,
                    tipoVenda
                })
            });
        })
        .then(() => {

            alert("Produto editado com sucesso!");

            produtoEditando = null;

            limparCampos();

            atualizarTabela([]);

            atualizarDashboard(pedidosGlobais);
        })
        .catch(erro => {

            console.error("Erro ao editar produto:", erro);

            alert("Erro ao editar produto.");
        });

        return;
    }

    produtos.push(produtoNovo);

    atualizarTabela([]);

    atualizarDashboard(pedidosGlobais);

    fetch(API_URL, {

        method: "POST",

        body: JSON.stringify({
            tipo: "produto",
            nome,
            preco,
            estoque,
            imagem,
            categoria,
            codigo,
            tipoVenda
        })

    })
    .then(() => {

        alert("Produto cadastrado com sucesso!");

        limparCampos();
    })
    .catch(erro => {

        console.error("Erro ao cadastrar produto:", erro);

        alert("Erro ao cadastrar produto.");
    });
}

function atualizarTabela(listaProdutos = produtos) {

    const tbody = document.querySelector("#tabelaProdutos tbody");
    const areaTabela = document.getElementById("areaTabelaProdutos");

    if (!tbody || !areaTabela) {
        return;
    }

    tbody.innerHTML = "";

    if (listaProdutos.length === 0) {
        areaTabela.style.display = "none";
        return;
    }

    areaTabela.style.display = "block";

    listaProdutos.forEach(produto => {

        tbody.innerHTML += `

            <tr>

                <td>${produto.nome}</td>

                <td>R$ ${Number(produto.preco).toFixed(2)}</td>

                <td>${formatarEstoqueAdmin(produto.estoque, produto.tipoVenda)}</td>

                <td>${produto.codigo || "-"}</td>

                <td>${produto.tipoVenda || "-"}</td>

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

function buscarProdutoAdmin() {

    const termo = document
        .getElementById("campoBuscaProdutoAdmin")
        .value
        .trim()
        .toLowerCase();

    if (!termo) {
        alert("Digite o nome ou código do produto.");
        return;
    }

    const produtosFiltrados = produtos.filter(produto => {

        const nome = String(produto.nome || "").toLowerCase();
        const codigo = String(produto.codigo || "").toLowerCase();

        return nome.includes(termo) || codigo.includes(termo);
    });

    if (produtosFiltrados.length === 0) {

        alert("Produto não encontrado.");

        atualizarTabela([]);

        return;
    }

    atualizarTabela(produtosFiltrados);
}

function limparBuscaProdutoAdmin() {

    document.getElementById("campoBuscaProdutoAdmin").value = "";

    atualizarTabela([]);
}

function limparCampos() {

    document.getElementById("produtoNome").value = "";
    document.getElementById("produtoPreco").value = "";
    document.getElementById("produtoEstoque").value = "";
    document.getElementById("produtoImagem").value = "";
    document.getElementById("produtoCodigo").value = "";
    document.getElementById("produtoCategoria").value = "";
    document.getElementById("produtoTipoVenda").value = "";

    produtoEditando = null;
}

function excluirProduto(nome) {

    const confirmar = confirm(
        `Tem certeza que deseja excluir o produto "${nome}"? Essa ação não poderá ser desfeita.`
    );

    if (!confirmar) {
        return;
    }

    produtos = produtos.filter(produto => produto.nome !== nome);

    atualizarTabela([]);

    atualizarDashboard(pedidosGlobais);

    fetch(API_URL, {

        method: "POST",

        body: JSON.stringify({
            tipo: "excluir",
            nome: nome
        })

    })
    .then(() => {

        alert("Produto excluído com sucesso.");
    })
    .catch(erro => {

        console.error("Erro ao excluir produto:", erro);

        alert("Erro ao excluir produto.");
    });
}

function editarProduto(nome) {

    const produto = produtos.find(p => p.nome === nome);

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    produtoEditando = nome;

    document.getElementById("produtoNome").value = produto.nome;
    document.getElementById("produtoPreco").value = produto.preco;
    document.getElementById("produtoEstoque").value = produto.estoque;
    document.getElementById("produtoImagem").value = produto.imagem;
    document.getElementById("produtoCodigo").value = produto.codigo || "";
    document.getElementById("produtoCategoria").value = produto.categoria || "";
    document.getElementById("produtoTipoVenda").value = produto.tipoVenda || "";

    mostrarAbaAdmin("produtos");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    alert("Edite os dados e clique em Salvar Produto.");
}

function carregarPedidos() {

    fetch(`${API_URL}?tipo=pedidos`)

        .then(resposta => resposta.json())

        .then(pedidos => {

            pedidosGlobais = pedidos;

            atualizarDashboard(pedidos);

            atualizarProdutosMaisVendidos(pedidos);

            renderizarPedidos([...pedidos]);
        })

        .catch(erro => {

            console.error("Erro ao carregar pedidos:", erro);

            alert("Erro ao carregar pedidos.");
        });
}

function renderizarPedidos(pedidos) {

    const tbody = document.querySelector("#tabelaPedidos tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const pedidosOrdenados = [...pedidos].sort((a, b) => {
        return new Date(b.data) - new Date(a.data);
    });

    pedidosOrdenados.forEach(pedido => {

        tbody.innerHTML += `

            <tr>

                <td>${formatarDataHora(pedido.data)}</td>

                <td>${pedido.nome}</td>

                <td>${pedido.telefone}</td>

                <td>${pedido.endereco}</td>

                <td>${pedido.pagamento}</td>

                <td>${pedido.entrega}</td>

                <td>${formatarPedido(pedido.pedido)}</td>

                <td>${pedido.observacao || "-"}</td>

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

                <td>
                    ${
                        pedido.status === "Saiu para entrega"
                        ? `
                            <button 
                                class="btn-avisar-cliente"
                                onclick="avisarClienteWhatsApp('${pedido.nome}', '${pedido.telefone}')"
                            >
                                Avisar cliente
                            </button>
                        `
                        : "-"
                    }
                </td>

            </tr>

        `;
    });
}

function alterarStatusPedido(linha, status) {

    const select = event.target;

    select.className = `status-select ${classeStatus(status)}`;

    fetch(API_URL, {

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

    const totalProdutosElemento = document.getElementById("totalProdutos");
    const totalPedidosElemento = document.getElementById("totalPedidos");
    const pedidosPendentesElemento = document.getElementById("pedidosPendentes");
    const pedidosConcluidosElemento = document.getElementById("pedidosConcluidos");
    const vendasMesElemento = document.getElementById("vendasMes");

    if (totalProdutosElemento) {
        totalProdutosElemento.innerText = totalProdutos;
    }

    if (totalPedidosElemento) {
        totalPedidosElemento.innerText = totalPedidos;
    }

    if (pedidosPendentesElemento) {
        pedidosPendentesElemento.innerText = pedidosPendentes;
    }

    if (pedidosConcluidosElemento) {
        pedidosConcluidosElemento.innerText = pedidosConcluidos;
    }

    if (vendasMesElemento) {
        vendasMesElemento.innerText = `R$ ${vendasMes.toFixed(2)}`;
    }
}

function atualizarProdutosMaisVendidos(pedidos = []) {

    const ranking = {};

    pedidos.forEach(pedido => {

        if (pedido.status !== "Concluído") {
            return;
        }

        if (!pedido.pedido) {
            return;
        }

        const itens = pedido.pedido.split(",");

        itens.forEach(item => {

            const texto = item.trim();

            const partes = texto.match(/(.+)\sx([\d.,]+)/);

            if (partes) {

                const nomeProduto = partes[1].trim();

                const quantidade = Number(partes[2].replace(",", "."));

                if (!ranking[nomeProduto]) {
                    ranking[nomeProduto] = 0;
                }

                ranking[nomeProduto] += quantidade;
            }
        });
    });

    const lista = document.getElementById("listaMaisVendidos");

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    const produtosOrdenados = Object.entries(ranking)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (produtosOrdenados.length === 0) {

        lista.innerHTML = `
            <li>
                Nenhum produto vendido ainda
            </li>
        `;

        return;
    }

    produtosOrdenados.forEach(([nome, quantidade], index) => {

        lista.innerHTML += `
            <li>
                <span>${index + 1}. ${nome}</span>
                <strong>${formatarQuantidadeRanking(nome, quantidade)}</strong>
            </li>
        `;
    });
}

function aplicarFiltrosPedidos() {

    const valorMes = document.getElementById("filtroMes")?.value;
    const valorStatus = document.getElementById("filtroStatus")?.value || "Todos";

    let pedidosFiltrados = [...pedidosGlobais];

    if (valorMes) {

        pedidosFiltrados = pedidosFiltrados.filter(pedido => {

            const dataPedido = new Date(pedido.data);
            const ano = dataPedido.getFullYear();
            const mes = String(dataPedido.getMonth() + 1).padStart(2, "0");
            const anoMesPedido = `${ano}-${mes}`;

            return anoMesPedido === valorMes;
        });
    }

    if (valorStatus !== "Todos") {

        pedidosFiltrados = pedidosFiltrados.filter(pedido => {
            return pedido.status === valorStatus;
        });
    }

    renderizarPedidos([...pedidosFiltrados]);

    atualizarDashboard(pedidosFiltrados);

    atualizarProdutosMaisVendidos(pedidosFiltrados);
}

function limparFiltroMes() {

    document.getElementById("filtroMes").value = "";
    document.getElementById("filtroStatus").value = "Todos";

    renderizarPedidos([...pedidosGlobais]);

    atualizarDashboard(pedidosGlobais);

    atualizarProdutosMaisVendidos(pedidosGlobais);
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

function formatarDataHora(data) {

    const dataPedido = new Date(data);

    if (isNaN(dataPedido.getTime())) {
        return data;
    }

    return dataPedido.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
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

function avisarClienteWhatsApp(nome, telefone) {

    const telefoneLimpo = String(telefone).replace(/\D/g, "");
    const numeroCliente = `55${telefoneLimpo}`;

    const mensagem = `Olá, ${nome}! Seu pedido do Mercadinho Ponto Certo saiu para entrega. Em breve chegará no endereço informado.`;

    const mensagemFormatada = encodeURIComponent(mensagem);

    window.open(`https://wa.me/${numeroCliente}?text=${mensagemFormatada}`, "_blank");
}

function formatarEstoqueAdmin(estoque, tipoVenda) {

    if (tipoVenda === "Peso") {
        return `${Number(estoque).toFixed(3).replace(".", ",")} kg`;
    }

    return `${Number(estoque)} un`;
}

function formatarQuantidadeRanking(nomeProduto, quantidade) {

    const produto = produtos.find(item => {
        return item.nome === nomeProduto;
    });

    if (produto && produto.tipoVenda === "Peso") {
        return `${quantidade.toFixed(3).replace(".", ",")} kg`;
    }

    return `${quantidade} unidade(s)`;
}