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

let carrinho = [];
let dadosPedidoFinal = null;
let pedidoEnviando = false;

function salvarCarrinho(){ localStorage.setItem("carrinhoMercadinho", JSON.stringify(carrinho)); }
function carregarCarrinhoSalvo(){ try { carrinho = JSON.parse(localStorage.getItem("carrinhoMercadinho")) || []; } catch { carrinho=[]; } }
function voltarParaProdutos(){ salvarCarrinho(); window.location.href="index.html#areaCarrinho"; }

function calcularValoresEntrega(subtotal){
    if(subtotal===0) return { taxaEntrega:0, totalFinal:0 };
    const entrega=document.getElementById("entrega")?.value || "Entrega";
    const temAguaOuGas = carrinho.some(p => p.categoria === "AguaGas");
    let taxaEntrega=0;
    if(entrega==="Entrega"){
        if(temAguaOuGas) taxaEntrega=0;
        else if(subtotal<50) taxaEntrega=3;
    }
    return { taxaEntrega, totalFinal: subtotal + taxaEntrega };
}

function atualizarCarrinho(){
    const lista=document.getElementById("lista-carrinho"); if(!lista) return;
    lista.innerHTML="";
    let subtotal=0;
    carrinho.forEach((produto,index)=>{
        const precoAtual=obterPrecoProduto(produto);
        const subtotalProduto=precoAtual*Number(produto.quantidade||0);
        subtotal+=subtotalProduto;
        lista.innerHTML += `<li><div><strong>${produto.nome}</strong><br>R$ ${precoAtual.toFixed(2)} ${produto.tipoVenda === "Peso" ? "por kg" : "cada"}</div><div class="controle-quantidade"><button onclick="diminuirQuantidade(${index})">-</button><span>${formatarQuantidade(produto)}</span><button onclick="aumentarQuantidade(${index})">+</button></div><div>R$ ${subtotalProduto.toFixed(2)}</div><button onclick="removerItem(${index})">X</button></li>`;
    });
    const valores=calcularValoresEntrega(subtotal);
    document.getElementById("total").innerHTML=`Subtotal: R$ ${subtotal.toFixed(2)}`;
    document.getElementById("taxa-entrega").innerHTML=`Taxa de entrega: R$ ${valores.taxaEntrega.toFixed(2)}`;
    document.getElementById("total-final").innerHTML=`Total final: R$ ${valores.totalFinal.toFixed(2)}`;
    verificarPagamentoPix();
}

function removerItem(index){ carrinho.splice(index,1); salvarCarrinho(); atualizarCarrinho(); if(carrinho.length===0) alert("Carrinho vazio. Volte para adicionar produtos."); }
function aumentarQuantidade(index){ const p=carrinho[index]; const inc=p.tipoVenda === "Peso" ? 0.1 : 1; if(Number(p.quantidade)+inc>Number(p.estoque)) return alert("Estoque insuficiente para este produto!"); p.quantidade=Number((Number(p.quantidade)+inc).toFixed(3)); salvarCarrinho(); atualizarCarrinho(); }
function diminuirQuantidade(index){ const p=carrinho[index]; const dec=p.tipoVenda === "Peso" ? 0.1 : 1; if(Number(p.quantidade)>dec) p.quantidade=Number((Number(p.quantidade)-dec).toFixed(3)); else carrinho.splice(index,1); salvarCarrinho(); atualizarCarrinho(); }

function mostrarBuscaCliente(){ document.getElementById("areaBuscaCliente").classList.add("mostrar"); document.getElementById("areaCadastroCliente").classList.remove("mostrar"); }
function mostrarCadastroCliente(){ document.getElementById("areaCadastroCliente").classList.add("mostrar"); document.getElementById("areaBuscaCliente").classList.remove("mostrar"); }

function buscarCliente(){
    const telefoneBusca=document.getElementById("telefoneBusca").value.trim();
    const botao=document.getElementById("btnBuscarCliente");
    if(!telefoneBusca) return alert("Digite o telefone para buscar o cadastro.");
    if(botao){ botao.disabled=true; botao.innerText="Buscando..."; }
    mostrarCarregamento("Buscando cadastro...");
    fetch(`${API_URL}?tipo=cliente&telefone=${encodeURIComponent(telefoneBusca)}`)
        .then(r=>r.json())
        .then(cliente=>{
            mostrarCadastroCliente();
            if(!cliente || !cliente.telefone){
                alert("Cliente não encontrado. Preencha os dados para cadastrar.");
                document.getElementById("telefone").value=telefoneBusca;
                return;
            }
            document.getElementById("nome").value=cliente.nome || "";
            document.getElementById("telefone").value=cliente.telefone || telefoneBusca;
            document.getElementById("endereco").value=cliente.endereco || "";
            alert("Cadastro encontrado!");
        })
        .catch(err=>{ console.error(err); alert("Erro ao buscar cliente."); })
        .finally(()=>{ esconderCarregamento(); if(botao){ botao.disabled=false; botao.innerText="Buscar cadastro"; }});
}

function verificarPagamentoDinheiro(){
    const pagamento=document.getElementById("pagamento")?.value;
    const campo=document.getElementById("campoTroco");
    const troco=document.getElementById("troco");
    if(!campo) return;
    if(pagamento==="Dinheiro") campo.style.display="block";
    else { campo.style.display="none"; if(troco) troco.value=""; }
}

function carrinhoTemGas(){ return carrinho.some(produtoEhGas); }
function carrinhoTemProdutoSemGas(){ return carrinho.some(p=>!produtoEhGas(p)); }
function verificarPagamentoPix(){
    const pagamento=document.getElementById("pagamento")?.value;
    const area=document.getElementById("areaPix"), merc=document.getElementById("pixMercadinho"), gas=document.getElementById("pixGas"), aviso=document.getElementById("avisoPixGas");
    if(!area || !merc || !gas || !aviso) return;
    if(pagamento!=="Pix"){ area.style.display="none"; merc.style.display="none"; gas.style.display="none"; aviso.style.display="none"; return; }
    const temGas=carrinhoTemGas(), temOutro=carrinhoTemProdutoSemGas();
    area.style.display="block"; merc.style.display="none"; gas.style.display="none"; aviso.style.display="none";
    if(temGas && temOutro){ merc.style.display="block"; gas.style.display="block"; aviso.style.display="block"; return; }
    if(temGas){ gas.style.display="block"; return; }
    merc.style.display="block";
}
function copiarPix(chavePix){
    if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(chavePix).then(()=>alert("Chave Pix copiada: "+chavePix)).catch(()=>copiarPixModoAlternativo(chavePix)); }
    else copiarPixModoAlternativo(chavePix);
}
function copiarPixModoAlternativo(chavePix){ const t=document.createElement("textarea"); t.value=chavePix; t.style.position="fixed"; t.style.left="-9999px"; document.body.appendChild(t); t.focus(); t.select(); try{ document.execCommand("copy"); alert("Chave Pix copiada: "+chavePix); }catch{ alert("Copie manualmente: "+chavePix); } document.body.removeChild(t); }

function finalizarPedido(){
    if(!verificarLojaAberta()) return alert("A loja está fechada no momento. Faça o pedido dentro do horário de funcionamento.");
    const nome=document.getElementById("nome").value.trim();
    const telefone=document.getElementById("telefone").value.trim();
    const endereco=document.getElementById("endereco").value.trim();
    const pagamento=document.getElementById("pagamento").value;
    const entrega=document.getElementById("entrega").value;
    if(carrinho.length===0) return alert("Carrinho vazio!");
    if(!nome || !telefone || !endereco || !pagamento || !entrega) return alert("Preencha todos os dados do cliente!");
    if(entrega==="Entrega" && !verificarHorarioEntrega()) return alert("As entregas são realizadas somente até 17h30. Você ainda pode escolher Retirada.");
    let observacao=document.getElementById("observacao").value.trim();
    const troco=document.getElementById("troco")?.value.trim();
    if(pagamento==="Dinheiro" && troco){ observacao = observacao ? `Troco para R$ ${troco} - ${observacao}` : `Troco para R$ ${troco}`; }
    let subtotal=0;
    carrinho.forEach(p=>subtotal += obterPrecoProduto(p) * Number(p.quantidade||0));
    const valores=calcularValoresEntrega(subtotal);
    const pedidoTexto=carrinho.map(p=>`${p.nome} x${formatarQuantidade(p)} - R$ ${(obterPrecoProduto(p)*p.quantidade).toFixed(2)}`).join(", ");
    let mensagem=`NOVO PEDIDO%0A%0A`;
    mensagem+=`Nome: ${encodeURIComponent(nome)}%0A`;
    mensagem+=`Telefone: ${encodeURIComponent(telefone)}%0A`;
    mensagem+=`Endereço: ${encodeURIComponent(endereco)}%0A`;
    mensagem+=`Pagamento: ${encodeURIComponent(pagamento)}%0A`;
    mensagem+=`Tipo: ${encodeURIComponent(entrega)}%0A`;
    if(observacao) mensagem+=`Observação: ${encodeURIComponent(observacao)}%0A`;
    mensagem+=`%0AITENS DO PEDIDO:%0A`;
    carrinho.forEach(p=> mensagem+=`- ${encodeURIComponent(p.nome)} x${encodeURIComponent(formatarQuantidade(p))} - R$ ${(obterPrecoProduto(p)*p.quantidade).toFixed(2)}%0A`);
    mensagem+=`%0ASubtotal: R$ ${subtotal.toFixed(2)}%0ATaxa de entrega: R$ ${valores.taxaEntrega.toFixed(2)}%0ATotal: R$ ${valores.totalFinal.toFixed(2)}`;
    dadosPedidoFinal={nome,telefone,endereco,pagamento,entrega,observacao,pedidoTexto,subtotal,taxaEntrega:valores.taxaEntrega,totalFinal:valores.totalFinal,mensagem};
    mostrarConfirmacaoPedido();
}
function mostrarConfirmacaoPedido(){
    const resumo=document.getElementById("resumoPedido");
    let itensHtml=carrinho.map(p=>`<p>${p.nome} x${formatarQuantidade(p)} - R$ ${(obterPrecoProduto(p)*p.quantidade).toFixed(2)}</p>`).join("");
    resumo.innerHTML=`<p><strong>Cliente:</strong> ${dadosPedidoFinal.nome}</p><p><strong>Telefone:</strong> ${dadosPedidoFinal.telefone}</p><p><strong>Endereço:</strong> ${dadosPedidoFinal.endereco}</p><p><strong>Pagamento:</strong> ${dadosPedidoFinal.pagamento}</p><p><strong>Tipo:</strong> ${dadosPedidoFinal.entrega}</p><p><strong>Observação:</strong> ${dadosPedidoFinal.observacao || "Nenhuma"}</p><hr><strong>Itens:</strong>${itensHtml}<hr><p><strong>Subtotal:</strong> R$ ${dadosPedidoFinal.subtotal.toFixed(2)}</p><p><strong>Taxa de entrega:</strong> R$ ${dadosPedidoFinal.taxaEntrega.toFixed(2)}</p><p><strong>Total:</strong> R$ ${dadosPedidoFinal.totalFinal.toFixed(2)}</p>`;
    document.getElementById("modalConfirmacao").style.display="flex";
}
function fecharConfirmacao(){ document.getElementById("modalConfirmacao").style.display="none"; }
function confirmarEnvioPedido(){
    if(pedidoEnviando) return;
    pedidoEnviando=true;
    const botao=document.querySelector(".botoes-confirmacao button");
    if(botao){ botao.disabled=true; botao.innerText="Enviando..."; }
    mostrarCarregamento("Processando pedido...");
    const linkWhatsApp=`https://api.whatsapp.com/send?phone=${NUMERO_WHATSAPP}&text=${dadosPedidoFinal.mensagem}`;
    const dadosParaEnviar={ tipo:"pedido", nome:dadosPedidoFinal.nome, telefone:dadosPedidoFinal.telefone, endereco:dadosPedidoFinal.endereco, pagamento:dadosPedidoFinal.pagamento, entrega:dadosPedidoFinal.entrega, observacao:dadosPedidoFinal.observacao, pedido:dadosPedidoFinal.pedidoTexto, total:dadosPedidoFinal.totalFinal.toFixed(2), itens:carrinho.map(p=>({nome:p.nome, quantidade:p.quantidade})) };
    fetch(API_URL,{ method:"POST", body:JSON.stringify(dadosParaEnviar) })
        .then(r=>r.text())
        .then(txt=>{
            console.log("Resposta Apps Script:", txt);
            if(txt.toLowerCase().includes("sucesso")){
                localStorage.removeItem("carrinhoMercadinho");
                carrinho=[];
                fecharConfirmacao();
                window.open(linkWhatsApp,"_blank");
                alert("Pedido registrado com sucesso! O WhatsApp foi aberto para enviar a mensagem.");
                window.location.href="index.html";
            } else throw new Error(txt);
        })
        .catch(err=>{ console.error("Erro ao enviar pedido:",err); alert("Erro ao enviar pedido. Verifique o console para detalhes."); })
        .finally(()=>{ pedidoEnviando=false; esconderCarregamento(); if(botao){ botao.disabled=false; botao.innerText="Confirmar"; }});
}

async function iniciarFinalizacao(){
    await carregarFuncionamentoLoja();
    atualizarStatusLoja();
    carregarCarrinhoSalvo();
    if(carrinho.length===0) alert("Carrinho vazio. Volte para escolher os produtos.");
    atualizarCarrinho();
}
document.addEventListener("DOMContentLoaded", iniciarFinalizacao);

window.addEventListener("storage", event => {
    if (event.key === "funcionamentoLojaMercadinho") {
        carregarFuncionamentoLoja().then(atualizarStatusLoja);
    }
});

setInterval(() => {
    carregarFuncionamentoLoja().then(atualizarStatusLoja);
}, 15000);
