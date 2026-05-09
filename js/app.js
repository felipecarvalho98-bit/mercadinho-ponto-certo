let produtosGlobais = [];

async function carregarProdutos() {

    const resposta = await fetch(
        "https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec"
    );

    const produtos = await resposta.json();

    produtosGlobais = produtos;

    const areaProdutos = document.getElementById("produtos");

    areaProdutos.innerHTML = "";

    produtos.forEach(produto => {

        areaProdutos.innerHTML += `

            <div class="produto-card">

                <img src="${produto.imagem}" alt="${produto.nome}">

                <h2>${produto.nome}</h2>

                <p class="preco">
                    R$ ${produto.preco}
                </p>

                <button onclick="adicionarCarrinho('${produto.nome}', ${produto.preco})">

                    Adicionar

                </button>

            </div>

        `;
    });
}

carregarProdutos();

let carrinho = [];

function adicionarCarrinho(nome, preco) {

    carrinho.push({
        nome,
        preco
    });

    atualizarCarrinho();

    mostrarToast();
}

function atualizarCarrinho() {

    const lista = document.getElementById("lista-carrinho");

    const totalElemento = document.getElementById("total");

    lista.innerHTML = "";

    let total = 0;

    document.getElementById("contadorCarrinho").innerText = carrinho.length;

    carrinho.forEach((produto, index) => {

        total += produto.preco;

        lista.innerHTML += `
        
            <li>
                ${produto.nome} - R$ ${produto.preco.toFixed(2)}

                <button onclick="removerItem(${index})">
                    X
                </button>
            </li>

        `;
    });

    totalElemento.innerHTML = `
        Total: R$ ${total.toFixed(2)}
    `;
}

function removerItem(index) {

    carrinho.splice(index, 1);

    atualizarCarrinho();
}
function finalizarPedido() {

    const nome = document.getElementById("nome").value;

    const telefone = document.getElementById("telefone").value;

    const endereco = document.getElementById("endereco").value;

    const pagamento = document.getElementById("pagamento").value;

    const entrega = document.getElementById("entrega").value;

    if(carrinho.length === 0) {

        alert("Carrinho vazio!");

        return;
    }

    let mensagem = `NOVO PEDIDO%0A%0A`;

    mensagem += `Nome: ${nome}%0A`;

    mensagem += `Telefone: ${telefone}%0A`;

    mensagem += `Endereço: ${endereco}%0A`;

    mensagem += `Pagamento: ${pagamento}%0A`;

    mensagem += `Tipo: ${entrega}%0A%0A`;

    mensagem += `ITENS DO PEDIDO:%0A`;

    let total = 0;

    carrinho.forEach(produto => {

        mensagem += `- ${produto.nome} - R$ ${produto.preco.toFixed(2)}%0A`;

        total += produto.preco;
    });

    mensagem += `%0ATotal: R$ ${total.toFixed(2)}`;

    const numero = "5585986625097";

    const pedidoTexto = carrinho.map(produto => {
    return `${produto.nome} - R$ ${produto.preco.toFixed(2)}`;
}).join(", ");

fetch("https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec", {

    method: "POST",

    body: JSON.stringify({

        nome: nome,

        telefone: telefone,

        endereco: endereco,

        pagamento: pagamento,

        entrega: entrega,

        pedido: pedidoTexto,

        total: total.toFixed(2)

    })

})
.then(res => res.text())
.then(resposta => {

    console.log(resposta);

    window.open(`https://wa.me/${numero}?text=${mensagem}`);
});
}

function filtrarProdutos() {

    const busca = document
        .getElementById("campoBusca")
        .value
        .toLowerCase();

    const areaProdutos = document.getElementById("produtos");

    areaProdutos.innerHTML = "";

    const produtosFiltrados = produtosGlobais.filter(produto => {

        return produto.nome.toLowerCase().includes(busca);
    });

    produtosFiltrados.forEach(produto => {

        areaProdutos.innerHTML += `

            <div class="produto-card">

                <img src="${produto.imagem}" alt="${produto.nome}">

                <h2>${produto.nome}</h2>

                <p class="preco">
                    R$ ${produto.preco}
                </p>

                <button onclick="adicionarCarrinho('${produto.nome}', ${produto.preco})">

                    Adicionar

                </button>

            </div>

        `;
    });
}

function filtrarCategoria(categoria) {

    const areaProdutos = document.getElementById("produtos");

    areaProdutos.innerHTML = "";

    let produtosFiltrados = produtosGlobais;

    if (categoria !== "Todos") {

        produtosFiltrados = produtosGlobais.filter(produto => {

            return produto.categoria === categoria;
        });
    }

    produtosFiltrados.forEach(produto => {

        areaProdutos.innerHTML += `

            <div class="produto-card">

                <img src="${produto.imagem}" alt="${produto.nome}">

                <h2>${produto.nome}</h2>

                <p class="preco">
                    R$ ${produto.preco}
                </p>

                <button onclick="adicionarCarrinho('${produto.nome}', ${produto.preco})">

                    Adicionar

                </button>

            </div>

        `;
    });
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

    const lista = document.getElementById(
        "lista-carrinho-modal"
    );

    const totalModal = document.getElementById(
        "total-modal"
    );

    lista.innerHTML = "";

    let total = 0;

    carrinho.forEach(produto => {

        total += produto.preco;

        lista.innerHTML += `

            <li>

                ${produto.nome} - R$ ${produto.preco.toFixed(2)}

            </li>

        `;
    });

    totalModal.innerHTML = `
        Total: R$ ${total.toFixed(2)}
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
    setTimeout(() => {
        document.getElementById("loading").style.display = "none";
    }, 1200);
});