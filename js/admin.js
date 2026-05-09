let produtos = [];

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