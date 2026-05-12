let produtosGlobais = [];
let carrinho = [];
let dadosPedidoFinal = null;
let pedidoEnviando = false;

const API_URL = "https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec";

const NUMERO_WHATSAPP = "558598439003";

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

            produtosHtml += `

                <div class="produto-card">

                    <img src="${produto.imagem}" alt="${produto.nome}">

                    <h2>${produto.nome}</h2>

                    <p class="preco">
                        R$ ${Number(produto.preco).toFixed(2)}
                    </p>

                    <p class="estoque">
                        Estoque: ${produto.estoque}
                    </p>

                    ${
                        Number(produto.estoque) > 0
                        ? `
                            <button onclick="adicionarCarrinho('${produto.nome}', ${Number(produto.preco)}, '${produto.categoria}', ${Number(produto.estoque)})">
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

carregarProdutos();

function adicionarCarrinho(nome, preco, categoria, estoque) {

    const produtoExistente = carrinho.find(produto => {
        return produto.nome === nome;
    });

    if (produtoExistente) {

        if (produtoExistente.quantidade >= produtoExistente.estoque) {
            alert("Estoque insuficiente para este produto!");
            return;
        }

        produtoExistente.quantidade++;

    } else {

        if (estoque <= 0) {
            alert("Produto sem estoque!");
            return;
        }

        carrinho.push({
            nome,
            preco,
            categoria,
            estoque,
            quantidade: 1
        });
    }

    atualizarCarrinho();

    mostrarToast();
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
                    R$ ${produto.preco.toFixed(2)} cada
                </div>

                <div class="controle-quantidade">

                    <button onclick="diminuirQuantidade(${index})">
                        -
                    </button>

                    <span>
                        ${produto.quantidade}
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

    document.getElementById("contadorCarrinho").innerText = totalItens;

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

    atualizarResumoFixo(totalItens, valoresEntrega.totalFinal);

}

function calcularValoresEntrega(subtotal) {

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

    if (carrinho[index].quantidade >= carrinho[index].estoque) {
        alert("Estoque insuficiente para este produto!");
        return;
    }

    carrinho[index].quantidade++;

    atualizarCarrinho();
}

function diminuirQuantidade(index) {

    if (carrinho[index].quantidade > 1) {

        carrinho[index].quantidade--;

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

        return `${produto.nome} x${produto.quantidade} - R$ ${subtotalProduto.toFixed(2)}`;
        
    }).join(", ");

    let mensagem = `NOVO PEDIDO%0A%0A`;

    mensagem += `Nome: ${nome}%0A`;
    mensagem += `Telefone: ${telefone}%0A`;
    mensagem += `Endereço: ${endereco}%0A`;
    mensagem += `Pagamento: ${pagamento}%0A`;
    mensagem += `Tipo: ${entrega}%0A%0A`;
    if (observacao) {
        mensagem += `Observação: ${observacao}%0A`;
    }

    mensagem += `%0A`;

    mensagem += `ITENS DO PEDIDO:%0A`;

    carrinho.forEach(produto => {
        const subtotalProduto = produto.preco * produto.quantidade;

        mensagem += `- ${produto.nome} x${produto.quantidade} - R$ ${subtotalProduto.toFixed(2)}%0A`;
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

    console.log("Modal de confirmação chamado");

    criarModalConfirmacaoSeNaoExistir();

    const resumo = document.getElementById("resumoPedido");

    let itensHtml = "";

    carrinho.forEach(produto => {

        const subtotalProduto = produto.preco * produto.quantidade;

        itensHtml += `
            <p>
                ${produto.nome} x${produto.quantidade} - R$ ${subtotalProduto.toFixed(2)}
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

function criarModalConfirmacaoSeNaoExistir() {

    const modalExiste = document.getElementById("modalConfirmacao");

    if (modalExiste) {
        return;
    }

    const modal = document.createElement("div");

    modal.id = "modalConfirmacao";

    modal.className = "modal-confirmacao";

    modal.innerHTML = `
        <div class="confirmacao-box">

            <h2>Confirmar Pedido</h2>

            <div id="resumoPedido"></div>

            <div class="botoes-confirmacao">

                <button onclick="confirmarEnvioPedido()">
                    Confirmar
                </button>

                <button onclick="fecharConfirmacao()" class="btn-cancelar">
                    Cancelar
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);
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

        total += produto.preco;

        lista.innerHTML += `

            <li>
                ${produto.nome} x${produto.quantidade} - R$ ${subtotalProduto.toFixed(2)}
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

window.addEventListener("load", () => {

    const loading = document.getElementById("loading");

    if (loading) {

        setTimeout(() => {

            loading.style.display = "none";

        }, 1200);
    }
});

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

    return categoria;
}

function atualizarResumoFixo(totalItens, totalFinal) {

    const resumoFixo = document.getElementById("resumoFixoCarrinho");

    const resumoItens = document.getElementById("resumoItens");

    const resumoTotal = document.getElementById("resumoTotal");

    if (!resumoFixo || !resumoItens || !resumoTotal) {
        return;
    }

    if (totalItens === 0) {

        resumoFixo.style.display = "none";

        return;
    }

    resumoFixo.style.display = "flex";

    resumoItens.innerText = `${totalItens} item${totalItens > 1 ? "s" : ""}`;

    resumoTotal.innerText = `Total: R$ ${totalFinal.toFixed(2)}`;
}