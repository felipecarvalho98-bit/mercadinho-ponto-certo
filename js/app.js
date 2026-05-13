const API_URL = "https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec";

const NUMERO_WHATSAPP = "55859843003";

let produtosGlobais = [];
let carrinho = [];
let dadosPedidoFinal = null;
let pedidoEnviando = false;
let pesosSelecionados = {};

async function carregarProdutos() {

    const resposta = await fetch(API_URL);

    const produtos = await resposta.json();

    produtosGlobais = produtos;

    renderizarProdutos(produtos);
}

function renderizarProdutos(produtos) {

    const areaProdutos = document.getElementById("produtos");

    areaProdutos.innerHTML = "";

    const categorias = {};

    produtos.forEach(produto => {

        const categoria = produto.categoria || "Outros";

        if (!categorias[categoria]) {
            categorias[categoria] = [];
        }

        categorias[categoria].push(produto);
    });

    Object.keys(categorias).forEach(categoria => {

        let produtosHtml = "";

        categorias[categoria].forEach(produto => {

            const preco = Number(produto.preco);
            const estoque = Number(produto.estoque);
            const tipoVenda = produto.tipoVenda || "Unidade";
            const codigo = produto.codigo || produto.nome;

            produtosHtml += `

                <div class="produto-card">

                    <img src="${produto.imagem}" alt="${produto.nome}">

                    <h2>${produto.nome}</h2>

                    <p class="preco">
                        R$ ${preco.toFixed(2)} ${tipoVenda === "Peso" ? "/kg" : ""}
                    </p>

                    <p class="estoque">
                        Estoque: ${estoque} ${tipoVenda === "Peso" ? "kg" : "un"}
                    </p>

                    ${
                        estoque > 0
                        ? tipoVenda === "Peso"
                            ? `
                                <div class="controle-peso-card">

                                    <p>
                                        Peso: <span id="peso-${codigo}">0,000 kg</span>
                                    </p>

                                    <div class="botoes-peso">

                                        <button onclick="alterarPesoProduto('${codigo}', -0.1)">
                                            -100g
                                        </button>

                                        <button onclick="alterarPesoProduto('${codigo}', 0.1)">
                                            +100g
                                        </button>

                                    </div>

                                    <div class="botoes-peso">

                                        <button onclick="alterarPesoProduto('${codigo}', -0.5)">
                                            -500g
                                        </button>

                                        <button onclick="alterarPesoProduto('${codigo}', 0.5)">
                                            +500g
                                        </button>

                                    </div>

                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0"
                                        placeholder="Ou digite o peso em kg"
                                        class="input-peso-manual"
                                        onchange="definirPesoManual('${codigo}', this.value)"
                                    >

                                    <button onclick="adicionarCarrinhoPorCodigo('${codigo}')">
                                        Adicionar
                                    </button>

                                </div>
                            `
                            : `
                                <button onclick="adicionarCarrinhoPorCodigo('${codigo}')">
                                    Adicionar
                                </button>
                            `
                        : `
                            <button disabled>
                                Sem estoque
                            </button>
                        `
                    }

                </div>

            `;
        });

        areaProdutos.innerHTML += `

            <section class="linha-categoria">

                <h2 class="titulo-categoria">
                    ${nomeCategoria(categoria)}
                </h2>

                <div class="produtos-scroll">
                    ${produtosHtml}
                </div>

            </section>

        `;
    });
}

function adicionarCarrinhoPorCodigo(codigo) {

    const produto = produtosGlobais.find(item => {
        return String(item.codigo || item.nome) === String(codigo);
    });

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    adicionarCarrinho(
        produto.nome,
        Number(produto.preco),
        produto.categoria,
        Number(produto.estoque),
        produto.tipoVenda || "Unidade",
        produto.codigo || produto.nome
    );
}

function adicionarCarrinho(nome, preco, categoria, estoque, tipoVenda = "Unidade", codigo = "") {

    let quantidade = 1;

    if (tipoVenda === "Peso") {

        quantidade = pesosSelecionados[codigo] || 0;

        if (quantidade <= 0) {
            alert("Escolha a quantidade em kg antes de adicionar.");
            return;
        }
    }

    const produtoExistente = carrinho.find(produto => {
        return produto.codigo === codigo;
    });

    if (produtoExistente) {

        const novaQuantidade = Number((produtoExistente.quantidade + quantidade).toFixed(3));

        if (novaQuantidade > produtoExistente.estoque) {
            alert("Estoque insuficiente para este produto!");
            return;
        }

        produtoExistente.quantidade = novaQuantidade;

    } else {

        if (estoque <= 0) {
            alert("Produto sem estoque!");
            return;
        }

        if (quantidade > estoque) {
            alert("Estoque insuficiente para este produto!");
            return;
        }

        carrinho.push({
            nome,
            preco,
            categoria,
            estoque,
            tipoVenda,
            codigo,
            quantidade
        });
    }

    if (tipoVenda === "Peso") {

        pesosSelecionados[codigo] = 0;

        const elementoPeso = document.getElementById(`peso-${codigo}`);

        if (elementoPeso) {
            elementoPeso.innerText = "0,000 kg";
        }

        const inputManual = document.querySelector(`#peso-${codigo}`)
            ?.closest(".controle-peso-card")
            ?.querySelector(".input-peso-manual");

        if (inputManual) {
            inputManual.value = "";
        }
    }

    atualizarCarrinho();

    mostrarToast();
}

function alterarPesoProduto(codigo, valor) {

    if (!pesosSelecionados[codigo]) {
        pesosSelecionados[codigo] = 0;
    }

    pesosSelecionados[codigo] += valor;

    if (pesosSelecionados[codigo] < 0) {
        pesosSelecionados[codigo] = 0;
    }

    pesosSelecionados[codigo] = Number(pesosSelecionados[codigo].toFixed(3));

    const elementoPeso = document.getElementById(`peso-${codigo}`);

    if (elementoPeso) {
        elementoPeso.innerText = `${pesosSelecionados[codigo].toFixed(3).replace(".", ",")} kg`;
    }
}

function definirPesoManual(codigo, valor) {

    let peso = Number(String(valor).replace(",", "."));

    if (isNaN(peso) || peso < 0) {
        alert("Peso inválido.");
        return;
    }

    peso = Number(peso.toFixed(3));

    pesosSelecionados[codigo] = peso;

    const elementoPeso = document.getElementById(`peso-${codigo}`);

    if (elementoPeso) {
        elementoPeso.innerText = `${peso.toFixed(3).replace(".", ",")} kg`;
    }
}

function atualizarCarrinho() {

    const lista = document.getElementById("lista-carrinho");

    const totalElemento = document.getElementById("total");

    lista.innerHTML = "";

    let total = 0;
    let totalItens = 0;

    carrinho.forEach((produto, index) => {

        const subtotalProduto = produto.preco * produto.quantidade;

        total += subtotalProduto;

        totalItens += produto.quantidade;

        lista.innerHTML += `
        
            <li>
                <div>
                    <strong>${produto.nome}</strong><br>
                    R$ ${produto.preco.toFixed(2)} ${produto.tipoVenda === "Peso" ? "por kg" : "cada"}
                </div>

                <div class="controle-quantidade">

                    <button onclick="diminuirQuantidade(${index})">
                        -
                    </button>

                    <span>
                        ${formatarQuantidade(produto)}
                    </span>

                    <button onclick="aumentarQuantidade(${index})">
                        +
                    </button>

                </div>

                <div>
                    R$ ${subtotalProduto.toFixed(2)}
                </div>

                <button onclick="removerItem(${index})">
                    X
                </button>
            </li>

        `;
    });

    document.getElementById("contadorCarrinho").innerText = Math.ceil(totalItens);

    const valoresEntrega = calcularValoresEntrega(total);

    totalElemento.innerHTML = `
        Subtotal: R$ ${total.toFixed(2)}
    `;

    document.getElementById("taxa-entrega").innerHTML = `
        Taxa de entrega: R$ ${valoresEntrega.taxaEntrega.toFixed(2)}
    `;

    document.getElementById("total-final").innerHTML = `
        Total final: R$ ${valoresEntrega.totalFinal.toFixed(2)}
    `;

    atualizarResumoFixo(Math.ceil(totalItens), valoresEntrega.totalFinal);
}

function calcularValoresEntrega(subtotal) {

    if (subtotal === 0) {
        return {
            taxaEntrega: 0,
            totalFinal: 0
        };
    }

    const entrega = document.getElementById("entrega")?.value;

    const temAguaOuGas = carrinho.some(produto => {
        return produto.categoria && produto.categoria.trim() === "AguaGas";
    });

    let taxaEntrega = 0;

    if (entrega === "Entrega") {

        if (temAguaOuGas) {
            taxaEntrega = 0;
        } else if (subtotal < 50) {
            taxaEntrega = 3;
        }
    }

    const totalFinal = subtotal + taxaEntrega;

    return {
        taxaEntrega,
        totalFinal
    };
}

function removerItem(index) {

    carrinho.splice(index, 1);

    atualizarCarrinho();
}

function aumentarQuantidade(index) {

    const produto = carrinho[index];

    const incremento = produto.tipoVenda === "Peso" ? 0.1 : 1;

    if (produto.quantidade + incremento > produto.estoque) {
        alert("Estoque insuficiente para este produto!");
        return;
    }

    produto.quantidade = Number((produto.quantidade + incremento).toFixed(3));

    atualizarCarrinho();
}

function diminuirQuantidade(index) {

    const produto = carrinho[index];

    const decremento = produto.tipoVenda === "Peso" ? 0.1 : 1;

    if (produto.quantidade > decremento) {

        produto.quantidade = Number((produto.quantidade - decremento).toFixed(3));

    } else {

        carrinho.splice(index, 1);
    }

    atualizarCarrinho();
}

function finalizarPedido() {

    const nome = document.getElementById("nome").value;
    const telefone = document.getElementById("telefone").value;
    const endereco = document.getElementById("endereco").value;
    const pagamento = document.getElementById("pagamento").value;
    const entrega = document.getElementById("entrega").value;
    const observacao = document.getElementById("observacao").value;

    if (carrinho.length === 0) {
        alert("Carrinho vazio!");
        return;
    }

    if (!nome || !telefone || !endereco || !pagamento || !entrega) {
        alert("Preencha todos os dados do cliente!");
        return;
    }

    let subtotal = 0;

    carrinho.forEach(produto => {
        subtotal += produto.preco * produto.quantidade;
    });

    const valoresEntrega = calcularValoresEntrega(subtotal);

    const taxaEntrega = valoresEntrega.taxaEntrega;

    const totalFinal = valoresEntrega.totalFinal;

    const pedidoTexto = carrinho.map(produto => {

        const subtotalProduto = produto.preco * produto.quantidade;

        return `${produto.nome} x${formatarQuantidade(produto)} - R$ ${subtotalProduto.toFixed(2)}`;

    }).join(", ");

    let mensagem = `NOVO PEDIDO%0A%0A`;

    mensagem += `Nome: ${nome}%0A`;
    mensagem += `Telefone: ${telefone}%0A`;
    mensagem += `Endereço: ${endereco}%0A`;
    mensagem += `Pagamento: ${pagamento}%0A`;
    mensagem += `Tipo: ${entrega}%0A`;

    if (observacao) {
        mensagem += `Observação: ${observacao}%0A`;
    }

    mensagem += `%0AITENS DO PEDIDO:%0A`;

    carrinho.forEach(produto => {

        const subtotalProduto = produto.preco * produto.quantidade;

        mensagem += `- ${produto.nome} x${formatarQuantidade(produto)} - R$ ${subtotalProduto.toFixed(2)}%0A`;
    });

    mensagem += `%0ASubtotal: R$ ${subtotal.toFixed(2)}`;
    mensagem += `%0ATaxa de entrega: R$ ${taxaEntrega.toFixed(2)}`;
    mensagem += `%0ATotal: R$ ${totalFinal.toFixed(2)}`;

    dadosPedidoFinal = {
        nome,
        telefone,
        endereco,
        pagamento,
        entrega,
        observacao,
        pedidoTexto,
        subtotal,
        taxaEntrega,
        totalFinal,
        mensagem
    };

    mostrarConfirmacaoPedido();
}

function mostrarConfirmacaoPedido() {

    const resumo = document.getElementById("resumoPedido");

    let itensHtml = "";

    carrinho.forEach(produto => {

        const subtotalProduto = produto.preco * produto.quantidade;

        itensHtml += `
            <p>
                ${produto.nome} x${formatarQuantidade(produto)} - R$ ${subtotalProduto.toFixed(2)}
            </p>
        `;
    });

    resumo.innerHTML = `
        <p><strong>Cliente:</strong> ${dadosPedidoFinal.nome}</p>
        <p><strong>Telefone:</strong> ${dadosPedidoFinal.telefone}</p>
        <p><strong>Endereço:</strong> ${dadosPedidoFinal.endereco}</p>
        <p><strong>Pagamento:</strong> ${dadosPedidoFinal.pagamento}</p>
        <p><strong>Tipo:</strong> ${dadosPedidoFinal.entrega}</p>
        <p><strong>Observação:</strong> ${dadosPedidoFinal.observacao || "Nenhuma"}</p>

        <hr>

        <strong>Itens:</strong>
        ${itensHtml}

        <hr>

        <p><strong>Subtotal:</strong> R$ ${dadosPedidoFinal.subtotal.toFixed(2)}</p>
        <p><strong>Taxa de entrega:</strong> R$ ${dadosPedidoFinal.taxaEntrega.toFixed(2)}</p>
        <p><strong>Total:</strong> R$ ${dadosPedidoFinal.totalFinal.toFixed(2)}</p>
    `;

    document.getElementById("modalConfirmacao").style.display = "flex";
}

function fecharConfirmacao() {

    document.getElementById("modalConfirmacao").style.display = "none";
}

function confirmarEnvioPedido() {

    if (pedidoEnviando) {
        return;
    }

    pedidoEnviando = true;

    const botaoConfirmar = document.querySelector(
        ".botoes-confirmacao button"
    );

    if (botaoConfirmar) {
        botaoConfirmar.disabled = true;
        botaoConfirmar.innerText = "Enviando...";
    }

    fetch(API_URL, {

        method: "POST",

        body: JSON.stringify({

            tipo: "pedido",

            nome: dadosPedidoFinal.nome,

            telefone: dadosPedidoFinal.telefone,

            endereco: dadosPedidoFinal.endereco,

            pagamento: dadosPedidoFinal.pagamento,

            entrega: dadosPedidoFinal.entrega,

            observacao: dadosPedidoFinal.observacao,

            pedido: dadosPedidoFinal.pedidoTexto,

            total: dadosPedidoFinal.totalFinal.toFixed(2),

            itens: carrinho.map(produto => {
                return {
                    nome: produto.nome,
                    quantidade: produto.quantidade
                };
            })

        })

    })
    .then(res => res.text())
    .then(resposta => {

        console.log(resposta);

        window.open(`https://wa.me/${NUMERO_WHATSAPP}?text=${dadosPedidoFinal.mensagem}`);

        fecharConfirmacao();

        limparPedidoAposEnvio();

        pedidoEnviando = false;

        if (botaoConfirmar) {
            botaoConfirmar.disabled = false;
            botaoConfirmar.innerText = "Confirmar";
        }
    })
    .catch(erro => {

        console.error("Erro ao enviar pedido:", erro);

        alert("Erro ao enviar pedido. Tente novamente.");

        pedidoEnviando = false;

        if (botaoConfirmar) {
            botaoConfirmar.disabled = false;
            botaoConfirmar.innerText = "Confirmar";
        }
    });
}

function limparPedidoAposEnvio() {

    carrinho = [];

    atualizarCarrinho();

    document.getElementById("nome").value = "";
    document.getElementById("telefone").value = "";
    document.getElementById("endereco").value = "";
    document.getElementById("pagamento").value = "";
    document.getElementById("entrega").value = "";
    document.getElementById("observacao").value = "";

    dadosPedidoFinal = null;
}

function filtrarProdutos() {

    const busca = document
        .getElementById("campoBusca")
        .value
        .toLowerCase();

    const produtosFiltrados = produtosGlobais.filter(produto => {

        return produto.nome.toLowerCase().includes(busca);
    });

    renderizarProdutos(produtosFiltrados);
}

function filtrarCategoria(categoria) {

    let produtosFiltrados = produtosGlobais;

    if (categoria !== "Todos") {

        produtosFiltrados = produtosGlobais.filter(produto => {

            return produto.categoria === categoria;
        });
    }

    renderizarProdutos(produtosFiltrados);
}

function abrirCarrinho() {

    document.getElementById("modalCarrinho")
        .style.display = "flex";

    atualizarModalCarrinho();
}

function fecharCarrinho() {

    document.getElementById("modalCarrinho")
        .style.display = "none";
}

function atualizarModalCarrinho() {

    const lista = document.getElementById("lista-carrinho-modal");

    const totalModal = document.getElementById("total-modal");

    lista.innerHTML = "";

    let total = 0;

    carrinho.forEach(produto => {

        const subtotalProduto = produto.preco * produto.quantidade;

        total += subtotalProduto;

        lista.innerHTML += `

            <li>
                ${produto.nome} x${formatarQuantidade(produto)} - R$ ${subtotalProduto.toFixed(2)}
            </li>

        `;
    });

    const valoresEntrega = calcularValoresEntrega(total);

    totalModal.innerHTML = `
        Subtotal: R$ ${total.toFixed(2)}<br>
        Taxa de entrega: R$ ${valoresEntrega.taxaEntrega.toFixed(2)}<br>
        Total: R$ ${valoresEntrega.totalFinal.toFixed(2)}
    `;
}

function mostrarToast() {

    const toast = document.getElementById("toast");

    toast.classList.add("mostrar");

    setTimeout(() => {

        toast.classList.remove("mostrar");

    }, 2000);
}

function atualizarResumoFixo(totalItens, totalFinal) {

    const resumoFixo = document.getElementById("resumoFixoCarrinho");
    const resumoItens = document.getElementById("resumoItens");
    const resumoTotal = document.getElementById("resumoTotal");
    const areaCliente = document.querySelector(".cliente");

    if (!resumoFixo || !resumoItens || !resumoTotal) {
        return;
    }

    const telaMobile = window.innerWidth <= 768;

    if (totalItens === 0 || !telaMobile) {
        resumoFixo.style.display = "none";
        return;
    }

    if (areaCliente) {
        const posicaoCliente = areaCliente.getBoundingClientRect();

        if (posicaoCliente.top < window.innerHeight - 120) {
            resumoFixo.style.display = "none";
            return;
        }
    }

    resumoFixo.style.display = "flex";

    resumoItens.innerText = `${totalItens} item${totalItens > 1 ? "s" : ""}`;

    resumoTotal.innerText = `Total: R$ ${totalFinal.toFixed(2)}`;
}

function mostrarBuscaCliente() {

    const areaBusca = document.getElementById("areaBuscaCliente");
    const areaCadastro = document.getElementById("areaCadastroCliente");

    areaBusca.classList.add("mostrar");
    areaCadastro.classList.remove("mostrar");
}

function mostrarCadastroCliente() {

    const areaBusca = document.getElementById("areaBuscaCliente");
    const areaCadastro = document.getElementById("areaCadastroCliente");

    areaCadastro.classList.add("mostrar");
    areaBusca.classList.remove("mostrar");
}

function buscarCliente() {

    const telefoneBusca = document.getElementById("telefoneBusca").value.trim();

    if (!telefoneBusca) {
        alert("Digite o telefone para buscar o cadastro.");
        return;
    }

    fetch(`${API_URL}?tipo=cliente&telefone=${telefoneBusca}`)

        .then(resposta => resposta.json())

        .then(cliente => {

            if (!cliente) {

                alert("Cliente não encontrado. Preencha os dados para cadastrar.");

                mostrarCadastroCliente();

                document.getElementById("telefone").value = telefoneBusca;

                return;
            }

            mostrarCadastroCliente();

            document.getElementById("nome").value = cliente.nome;
            document.getElementById("telefone").value = cliente.telefone;
            document.getElementById("endereco").value = cliente.endereco;

            alert("Cadastro encontrado!");
        })

        .catch(erro => {

            console.error("Erro ao buscar cliente:", erro);

            alert("Erro ao buscar cliente.");
        });
}

function formatarQuantidade(produto) {

    if (produto.tipoVenda === "Peso") {
        return `${produto.quantidade.toFixed(3).replace(".", ",")} kg`;
    }

    return `${produto.quantidade} un`;
}

function nomeCategoria(categoria) {

    if (categoria === "Bebidas") {
        return "Bebidas";
    }

    if (categoria === "Massas") {
        return "Massas";
    }

    if (categoria === "Graos") {
        return "Grãos";
    }

    if (categoria === "Laticinios") {
        return "Laticínios";
    }

    if (categoria === "AguaGas") {
        return "Água/Gás";
    }

    if (categoria === "Hortifruti") {
        return "Hortifruti";
    }

    if (categoria === "Frios") {
        return "Frios";
    }

    return categoria;
}

window.addEventListener("scroll", () => {

    let total = 0;
    let totalItens = 0;

    carrinho.forEach(produto => {
        total += produto.preco * produto.quantidade;
        totalItens += produto.quantidade;
    });

    const valoresEntrega = calcularValoresEntrega(total);

    atualizarResumoFixo(Math.ceil(totalItens), valoresEntrega.totalFinal);
});

window.addEventListener("load", () => {

    const loading = document.getElementById("loading");

    if (loading) {

        setTimeout(() => {

            loading.style.display = "none";

        }, 1200);
    }
});

carregarProdutos();