const API_URL = "https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec";
const NUMERO_WHATSAPP = "558598439003";
const CHAVE_PIX_MERCADINHO = "64382648000152";
const CHAVE_PIX_GAS = "85996726861";
const MODO_TESTE = false;
let funcionamentoLoja = { modo: "automatico", mensagem: "" };

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c");
}

function salvarFuncionamentoLocal(modo, mensagem) {
    localStorage.setItem("funcionamentoLojaMercadinho", JSON.stringify({
        modo: modo || "automatico",
        mensagem: mensagem || ""
    }));
}

function carregarFuncionamentoLocal() {
    try {
        return JSON.parse(localStorage.getItem("funcionamentoLojaMercadinho")) || null;
    } catch (erro) {
        return null;
    }
}

function produtoEhGas(produto) {
    const nome = normalizarTexto(produto.nome);
    return nome.includes("gas") || nome.includes("botijao") || nome.includes("botijão");
}

function obterPrecoProduto(produto) {
    if (produtoEhGas(produto)) {
        const pagamento = document.getElementById("pagamento")?.value;
        return pagamento === "Cartão" ? 123 : 120;
    }
    return Number(produto.preco || 0);
}

function nomeCategoria(categoria) {
    const nomes = { Bebidas: "Bebidas", Massas: "Massas", Graos: "Grãos", Laticinios: "Laticínios", AguaGas: "Água/Gás", Hortifruti: "Hortifruti", Frios: "Frios" };
    return nomes[categoria] || categoria || "Outros";
}

function formatarEstoque(estoque, tipoVenda) {
    const valor = Number(estoque || 0);
    return tipoVenda === "Peso" ? `${valor.toFixed(3).replace(".", ",")} kg` : `${Math.floor(valor)} un`;
}

function formatarQuantidade(produto) {
    const qtd = Number(produto.quantidade || 0);
    return produto.tipoVenda === "Peso" ? `${qtd.toFixed(3).replace(".", ",")} kg` : `${Math.floor(qtd)} un`;
}

function mostrarCarregamento(texto = "Carregando...") {
    const aviso = document.getElementById("avisoCarregamento");
    const textoEl = document.getElementById("textoCarregamento");
    if (textoEl) textoEl.innerText = texto;
    if (aviso) aviso.style.display = "flex";
}

function esconderCarregamento() {
    const aviso = document.getElementById("avisoCarregamento");
    if (aviso) aviso.style.display = "none";
}

async function carregarFuncionamentoLoja() {
    const salvoLocal = carregarFuncionamentoLocal();

    if (salvoLocal && salvoLocal.modo) {
        funcionamentoLoja = salvoLocal;
    }

    try {
        const resposta = await fetch(`${API_URL}?tipo=funcionamento&t=${Date.now()}`);
        const dados = await resposta.json();

        if (dados && dados.modo) {
            funcionamentoLoja = dados;
            salvarFuncionamentoLocal(dados.modo, dados.mensagem || "");
        }
    } catch (erro) {
        console.warn("Funcionamento manual não encontrado no backend. Usando configuração local ou horário automático.", erro);
    }
}

function verificarHorarioAutomaticoLoja() {
    if (MODO_TESTE) return true;
    const agora = new Date();
    const diaSemana = agora.getDay();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    if (diaSemana === 0) return false;
    const abertoManha = minutosAgora >= 7 * 60 && minutosAgora <= 12 * 60;
    const abertoTarde = minutosAgora >= 14 * 60 && minutosAgora <= 19 * 60 + 30;
    return abertoManha || abertoTarde;
}

function verificarLojaAberta() {
    if (funcionamentoLoja.modo === "aberto") return true;
    if (funcionamentoLoja.modo === "fechado") return false;
    return verificarHorarioAutomaticoLoja();
}

function atualizarStatusLoja() {
    const statusLoja = document.getElementById("statusLoja");
    if (!statusLoja) return;
    const msgExtra = funcionamentoLoja.mensagem ? `<br><strong>${funcionamentoLoja.mensagem}</strong>` : "";
    if (verificarLojaAberta()) {
        statusLoja.innerHTML = `🟢 Loja aberta agora — você já pode fazer seu pedido.<br>Entregas até 17h30. Retirada disponível até o fechamento.${msgExtra}`;
        statusLoja.className = "status-loja loja-aberta";
    } else {
        statusLoja.innerHTML = `🔴 Loja fechada no momento — pedidos podem ser preparados no próximo horário de funcionamento.${msgExtra}`;
        statusLoja.className = "status-loja loja-fechada";
    }
}

function verificarHorarioEntrega() {
    if (MODO_TESTE) return true;
    const agora = new Date();
    if (agora.getDay() === 0) return false;
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    return minutosAgora <= 17 * 60 + 30;
}

let produtosGlobais = [];
let carrinho = [];
let pesosSelecionados = {};

function salvarCarrinho() {
    localStorage.setItem("carrinhoMercadinho", JSON.stringify(carrinho));
}

function carregarCarrinhoSalvo() {
    try { carrinho = JSON.parse(localStorage.getItem("carrinhoMercadinho")) || []; }
    catch { carrinho = []; }
}

async function carregarProdutos() {
    const loadingInicial = document.getElementById("loading");
    if (loadingInicial) loadingInicial.style.display = "flex";
    await carregarFuncionamentoLoja();
    atualizarStatusLoja();
    carregarCarrinhoSalvo();
    try {
        const resposta = await fetch(`${API_URL}?t=${Date.now()}`);
        const produtos = await resposta.json();
        produtosGlobais = produtos || [];
        renderizarProdutos(produtosGlobais);
        atualizarCarrinho();
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        alert("Erro ao carregar produtos. Tente atualizar a página.");
    } finally {
        if (loadingInicial) loadingInicial.style.display = "none";
        esconderCarregamento();
    }
}

function renderizarProdutos(produtos) {
    const areaProdutos = document.getElementById("produtos");
    if (!areaProdutos) return;
    areaProdutos.innerHTML = "";
    const categorias = {};
    produtos.forEach(produto => {
        const categoria = produto.categoria || "Outros";
        if (!categorias[categoria]) categorias[categoria] = [];
        categorias[categoria].push(produto);
    });
    Object.keys(categorias).forEach(categoria => {
        let produtosHtml = "";
        categorias[categoria].forEach(produto => {
            const preco = Number(produto.preco || 0);
            const estoque = Number(produto.estoque || 0);
            const tipoVenda = produto.tipoVenda || "Unidade";
            const codigo = produto.codigo || produto.nome;
            produtosHtml += `
                <div class="produto-card">
                    <img src="${produto.imagem}" alt="${produto.nome}" onerror="this.style.display='none'">
                    <h2>${produto.nome}</h2>
                    <p class="preco">R$ ${preco.toFixed(2)} ${tipoVenda === "Peso" ? "/kg" : ""}</p>
                    ${produtoEhGas(produto) ? `<p class="aviso-gas">Pix/Dinheiro: R$ 120,00<br>Cartão: R$ 123,00</p>` : ""}
                    <p class="estoque">estoque: ${formatarEstoque(estoque, tipoVenda)}</p>
                    ${estoque > 0 ? tipoVenda === "Peso" ? `
                        <div class="controle-peso-card">
                            <p>Peso: <span id="peso-${codigo}">0,000 kg</span></p>
                            <div class="botoes-peso"><button onclick="alterarPesoProduto('${codigo}', -0.1)">-100g</button><button onclick="alterarPesoProduto('${codigo}', 0.1)">+100g</button></div>
                            <div class="botoes-peso"><button onclick="alterarPesoProduto('${codigo}', -0.5)">-500g</button><button onclick="alterarPesoProduto('${codigo}', 0.5)">+500g</button></div>
                            <input type="number" step="0.001" min="0" placeholder="Ou digite o peso em kg" class="input-peso-manual" onchange="definirPesoManual('${codigo}', this.value)">
                            <button onclick="adicionarCarrinhoPorCodigo('${codigo}')">Adicionar</button>
                        </div>` : `<button onclick="adicionarCarrinhoPorCodigo('${codigo}')">Adicionar</button>` : `<button disabled>Sem estoque</button>`}
                </div>`;
        });
        areaProdutos.innerHTML += `<section class="linha-categoria"><h2 class="titulo-categoria">${nomeCategoria(categoria)}</h2><div class="produtos-scroll">${produtosHtml}</div></section>`;
    });
}

function adicionarCarrinhoPorCodigo(codigo) {
    const produto = produtosGlobais.find(item => String(item.codigo || item.nome) === String(codigo));
    if (!produto) return alert("Produto não encontrado.");
    adicionarCarrinho(produto.nome, Number(produto.preco), produto.categoria, Number(produto.estoque), produto.tipoVenda || "Unidade", produto.codigo || produto.nome, produto.imagem || "");
}

function adicionarCarrinho(nome, preco, categoria, estoque, tipoVenda = "Unidade", codigo = "", imagem = "") {
    let quantidade = 1;
    if (tipoVenda === "Peso") {
        quantidade = pesosSelecionados[codigo] || 0;
        if (quantidade <= 0) return alert("Escolha a quantidade em kg antes de adicionar.");
    }
    const produtoExistente = carrinho.find(produto => produto.codigo === codigo);
    if (produtoExistente) {
        const novaQuantidade = Number((Number(produtoExistente.quantidade) + quantidade).toFixed(3));
        if (novaQuantidade > produtoExistente.estoque) return alert("Estoque insuficiente para este produto!");
        produtoExistente.quantidade = novaQuantidade;
    } else {
        if (estoque <= 0 || quantidade > estoque) return alert("Estoque insuficiente para este produto!");
        carrinho.push({ nome, preco, categoria, estoque, tipoVenda, codigo, imagem, quantidade });
    }
    if (tipoVenda === "Peso") {
        pesosSelecionados[codigo] = 0;
        const elementoPeso = document.getElementById(`peso-${codigo}`);
        if (elementoPeso) elementoPeso.innerText = "0,000 kg";
    }
    salvarCarrinho();
    atualizarCarrinho();
    mostrarToast();
}

function atualizarCarrinho() {
    const lista = document.getElementById("lista-carrinho");
    if (!lista) return;
    lista.innerHTML = "";
    let total = 0, totalItens = 0;
    carrinho.forEach((produto, index) => {
        const precoAtual = obterPrecoProduto(produto);
        const subtotalProduto = precoAtual * Number(produto.quantidade || 0);
        total += subtotalProduto;
        totalItens += Number(produto.quantidade || 0);
        lista.innerHTML += `<li><div><strong>${produto.nome}</strong><br>R$ ${precoAtual.toFixed(2)} ${produto.tipoVenda === "Peso" ? "por kg" : "cada"}</div><div class="controle-quantidade"><button onclick="diminuirQuantidade(${index})">-</button><span>${formatarQuantidade(produto)}</span><button onclick="aumentarQuantidade(${index})">+</button></div><div>R$ ${subtotalProduto.toFixed(2)}</div><button onclick="removerItem(${index})">X</button></li>`;
    });
    const valoresEntrega = { taxaEntrega: 0, totalFinal: total };
    document.getElementById("contadorCarrinho").innerText = Math.ceil(totalItens);
    document.getElementById("total").innerHTML = `Subtotal: R$ ${total.toFixed(2)}`;
    document.getElementById("taxa-entrega").innerHTML = `Taxa de entrega: R$ ${valoresEntrega.taxaEntrega.toFixed(2)}`;
    document.getElementById("total-final").innerHTML = `Total final: R$ ${valoresEntrega.totalFinal.toFixed(2)}`;
    atualizarResumoFixo(Math.ceil(totalItens), valoresEntrega.totalFinal);
    atualizarModalCarrinho(total);
}

function alterarPesoProduto(codigo, valor) { pesosSelecionados[codigo] = Math.max(0, Number(((pesosSelecionados[codigo] || 0) + valor).toFixed(3))); const el = document.getElementById(`peso-${codigo}`); if (el) el.innerText = `${pesosSelecionados[codigo].toFixed(3).replace(".", ",")} kg`; }
function definirPesoManual(codigo, valor) { let peso = Number(String(valor).replace(",", ".")); if (isNaN(peso) || peso < 0) return alert("Peso inválido."); pesosSelecionados[codigo] = Number(peso.toFixed(3)); const el = document.getElementById(`peso-${codigo}`); if (el) el.innerText = `${pesosSelecionados[codigo].toFixed(3).replace(".", ",")} kg`; }
function removerItem(index) { carrinho.splice(index, 1); salvarCarrinho(); atualizarCarrinho(); }
function aumentarQuantidade(index) { const p=carrinho[index]; const inc=p.tipoVenda === "Peso" ? 0.1 : 1; if (Number(p.quantidade)+inc > Number(p.estoque)) return alert("Estoque insuficiente para este produto!"); p.quantidade=Number((Number(p.quantidade)+inc).toFixed(3)); salvarCarrinho(); atualizarCarrinho(); }
function diminuirQuantidade(index) { const p=carrinho[index]; const dec=p.tipoVenda === "Peso" ? 0.1 : 1; if (Number(p.quantidade)>dec) p.quantidade=Number((Number(p.quantidade)-dec).toFixed(3)); else carrinho.splice(index,1); salvarCarrinho(); atualizarCarrinho(); }
function limparCarrinho(){ if(confirm("Deseja limpar o carrinho?")){ carrinho=[]; salvarCarrinho(); atualizarCarrinho(); }}
function mostrarToast(){ const toast=document.getElementById("toast"); if(!toast) return; toast.classList.add("mostrar"); setTimeout(()=>toast.classList.remove("mostrar"),1800); }
function filtrarProdutos(){ const busca=normalizarTexto(document.getElementById("campoBusca").value); renderizarProdutos(produtosGlobais.filter(p=>normalizarTexto(p.nome).includes(busca))); }
function filtrarCategoria(categoria){ renderizarProdutos(categoria === "Todos" ? produtosGlobais : produtosGlobais.filter(p=>p.categoria === categoria)); }
function abrirCarrinho(){ const modal=document.getElementById("modalCarrinho"); if(modal){ atualizarCarrinho(); modal.style.display="flex"; }}
function fecharCarrinho(){ const modal=document.getElementById("modalCarrinho"); if(modal) modal.style.display="none"; }
function atualizarModalCarrinho(total){ const ul=document.getElementById("lista-carrinho-modal"); const tm=document.getElementById("total-modal"); if(!ul || !tm) return; ul.innerHTML=carrinho.map(p=>`<li><strong>${p.nome}</strong> - ${formatarQuantidade(p)} - R$ ${(obterPrecoProduto(p)*p.quantidade).toFixed(2)}</li>`).join(""); tm.innerText=`Total: R$ ${total.toFixed(2)}`; }

function atualizarResumoFixo(totalItens, totalFinal) {

    let resumoFixo = document.getElementById("resumoFixoCarrinho");

    if (!resumoFixo) {

        resumoFixo = document.createElement("div");
        resumoFixo.id = "resumoFixoCarrinho";
        resumoFixo.className = "resumo-fixo-carrinho";

        document.body.appendChild(resumoFixo);
    }

    if (totalItens <= 0) {

        resumoFixo.style.display = "none";
        resumoFixo.innerHTML = "";
        return;
    }

    resumoFixo.style.display = "flex";

    resumoFixo.innerHTML = `
        <div class="resumo-fixo-info">
            <strong>${totalItens} ${totalItens === 1 ? "item" : "itens"}</strong>
            <span>Total: R$ ${Number(totalFinal).toFixed(2).replace(".", ",")}</span>
        </div>

        <button
            type="button"
            class="btn-resumo-finalizar"
            onclick="irParaFinalizacao()"
        >
            Finalizar
        </button>
    `;
}

function irParaFinalizacao(){ if(carrinho.length===0) return alert("Adicione pelo menos um produto ao carrinho."); salvarCarrinho(); window.location.href="finalizar.html"; }

document.addEventListener("DOMContentLoaded", carregarProdutos);

window.addEventListener("storage", event => {
    if (event.key === "funcionamentoLojaMercadinho") {
        carregarFuncionamentoLoja().then(atualizarStatusLoja);
    }
});

setInterval(() => {
    carregarFuncionamentoLoja().then(atualizarStatusLoja);
}, 15000);
