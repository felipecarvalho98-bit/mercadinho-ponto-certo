const API_URL = "https://script.google.com/macros/s/AKfycbx3pylS99g9z3hbY3RYna92EvgyFx4ko3aWC7nxaoWnI-Vh0zxvM5xujbGrIkqYn04Y/exec";
const NUMERO_WHATSAPP = "558598439003";
let produtos = [];
let pedidosGlobais = [];
let produtoEditando = null;
let funcionamentoAtual = { modo: "automatico", mensagem: "" };

function entrarAdmin() {
    const senha = document.getElementById("senha").value;
    const lembrarSenha = document.getElementById("lembrarSenha")?.checked;
    const senhaCorreta = "1234";
    if (senha === senhaCorreta) {
        if (lembrarSenha) localStorage.setItem("adminLogado", "sim");
        document.getElementById("telaLogin").style.display = "none";
        document.getElementById("painelAdmin").style.display = "block";
        inicializarAdmin();
    } else alert("Senha incorreta.");
}
function sairAdmin() { localStorage.removeItem("adminLogado"); location.reload(); }
function inicializarAdmin() { carregarProdutos(); carregarPedidos(); carregarFuncionamentoLojaAdmin(); }

document.addEventListener("DOMContentLoaded", () => {
    const telaLogin = document.getElementById("telaLogin");
    const painelAdmin = document.getElementById("painelAdmin");
    if (localStorage.getItem("adminLogado") === "sim") {
        if (telaLogin) telaLogin.style.display = "none";
        if (painelAdmin) painelAdmin.style.display = "block";
        inicializarAdmin();
    } else {
        if (telaLogin) telaLogin.style.display = "flex";
        if (painelAdmin) painelAdmin.style.display = "none";
    }
});

function mostrarAbaAdmin(aba) {
    ["Dashboard","Pedidos","Produtos","Funcionamento"].forEach(nome => {
        const el = document.getElementById(`aba${nome}`);
        if (el) el.style.display = "none";
    });
    const mapa = { dashboard:"abaDashboard", pedidos:"abaPedidos", produtos:"abaProdutos", funcionamento:"abaFuncionamento" };
    const alvo = document.getElementById(mapa[aba]);
    if (alvo) alvo.style.display = "block";
    document.querySelectorAll(".abas-admin button").forEach(b => b.classList.remove("aba-ativa"));
    const btn = document.querySelector(`.abas-admin button[data-aba="${aba}"]`);
    if (btn) btn.classList.add("aba-ativa");
}

function mostrarCarregamentoAdmin(texto="Atualizando...") {
    const box=document.getElementById("carregamentoAdmin"); const p=document.getElementById("textoCarregamentoAdmin");
    if(p) p.innerText=texto; if(box) box.style.display="flex";
}
function esconderCarregamentoAdmin() { const box=document.getElementById("carregamentoAdmin"); if(box) box.style.display="none"; }

function carregarProdutos() {
    fetch(`${API_URL}?t=${Date.now()}`).then(r=>r.json()).then(dados=>{
        produtos = Array.isArray(dados) ? dados : [];
        renderizarTabelaProdutos(produtos);
        atualizarDashboard(pedidosGlobais);
        atualizarEstoqueBaixo();
    }).catch(erro=>{ console.error("Erro ao carregar produtos:", erro); alert("Erro ao carregar produtos."); });
}
function cadastrarProduto() {
    const nome=document.getElementById("produtoNome").value.trim();
    const preco=document.getElementById("produtoPreco").value.trim();
    const estoque=document.getElementById("produtoEstoque").value.trim();
    const imagem=document.getElementById("produtoImagem").value.trim();
    const codigo=document.getElementById("produtoCodigo").value.trim();
    const categoria=document.getElementById("produtoCategoria").value;
    const tipoVenda=document.getElementById("produtoTipoVenda").value;
    if(!nome || !preco || !estoque || !imagem || !categoria || !codigo || !tipoVenda) return alert("Preencha todos os campos do produto!");
    const salvar = () => fetch(API_URL, { method:"POST", body:JSON.stringify({ tipo:"produto", nome, preco, estoque, imagem, categoria, codigo, tipoVenda }) });
    mostrarCarregamentoAdmin("Salvando produto...");
    const operacao = produtoEditando ? fetch(API_URL, { method:"POST", body:JSON.stringify({ tipo:"excluir", nome:produtoEditando }) }).then(salvar) : salvar();
    operacao.then(()=>{ alert(produtoEditando ? "Produto editado com sucesso!" : "Produto cadastrado com sucesso!"); produtoEditando=null; limparCampos(); carregarProdutos(); })
        .catch(err=>{ console.error(err); alert("Erro ao salvar produto."); })
        .finally(esconderCarregamentoAdmin);
}
function limparCampos() { ["produtoNome","produtoPreco","produtoEstoque","produtoImagem","produtoCodigo","produtoCategoria","produtoTipoVenda"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; }); produtoEditando=null; }
function excluirProduto(nome) {
    if(!confirm(`Tem certeza que deseja excluir o produto "${nome}"?`)) return;
    mostrarCarregamentoAdmin("Excluindo produto...");
    fetch(API_URL, { method:"POST", body:JSON.stringify({ tipo:"excluir", nome }) })
        .then(()=>{ alert("Produto excluído com sucesso."); carregarProdutos(); })
        .catch(err=>{ console.error(err); alert("Erro ao excluir produto."); })
        .finally(esconderCarregamentoAdmin);
}
function editarProduto(nome) {
    const produto=produtos.find(p=>p.nome===nome);
    if(!produto) return alert("Produto não encontrado.");
    produtoEditando=nome;
    document.getElementById("produtoNome").value=produto.nome || "";
    document.getElementById("produtoPreco").value=produto.preco || "";
    document.getElementById("produtoEstoque").value=produto.estoque || "";
    document.getElementById("produtoImagem").value=produto.imagem || "";
    document.getElementById("produtoCodigo").value=produto.codigo || "";
    document.getElementById("produtoCategoria").value=produto.categoria || "";
    document.getElementById("produtoTipoVenda").value=produto.tipoVenda || "Unidade";
    mostrarAbaAdmin("produtos"); window.scrollTo({top:0,behavior:"smooth"});
}
function renderizarTabelaProdutos(listaProdutos=produtos) {
    const tbody=document.querySelector("#tabelaProdutosCadastrados tbody"); if(!tbody) return;
    tbody.innerHTML="";
    if(!listaProdutos || listaProdutos.length===0) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;font-weight:bold;">Nenhum produto encontrado.</td></tr>`; return; }
    listaProdutos.forEach(produto=>{
        const preco=Number(produto.preco || 0); const estoque=Number(produto.estoque || 0); const tipoTexto=produto.tipoVenda==="Peso" ? "Peso" : "Quantidade";
        tbody.innerHTML += `<tr><td>${produto.nome || "-"}</td><td>R$ ${preco.toFixed(2)}</td><td>${formatarEstoqueAdmin(estoque, produto.tipoVenda)}</td><td>${nomeCategoria(produto.categoria)}</td><td>${tipoTexto}</td><td><button onclick="editarProduto('${String(produto.nome).replace(/'/g,"\'")}')">Editar</button><button onclick="excluirProduto('${String(produto.nome).replace(/'/g,"\'")}')" class="btn-excluir-produto">Excluir</button></td></tr>`;
    });
}
function filtrarProdutosCadastrados() {
    const campoBusca = document.getElementById("campoBuscaProdutoAdmin");
    const busca = normalizarTextoAdmin(campoBusca?.value || "");

    if (!busca) {
        renderizarTabelaProdutos(produtos);
        return;
    }

    const filtrados = produtos.filter(produto => {
        const textoCompleto = normalizarTextoAdmin([
            produto.nome,
            produto.codigo,
            produto.codigoBarras,
            produto.categoria,
            nomeCategoria(produto.categoria),
            produto.tipoVenda
        ].join(" "));

        const ehGas = produtoEhGasAdmin(produto);

        return (
            textoCompleto.includes(busca) ||
            (busca.includes("gas") && ehGas) ||
            (busca === "ga" && (textoCompleto.includes("agua") || ehGas))
        );
    });

    renderizarTabelaProdutos(filtrados);
}
function limparBuscaProdutoAdmin() { document.getElementById("campoBuscaProdutoAdmin").value=""; renderizarTabelaProdutos(produtos); }

function carregarPedidos() {
    mostrarCarregamentoAdmin("Carregando pedidos...");
    fetch(`${API_URL}?tipo=pedidos&t=${Date.now()}`).then(r=>r.json()).then(pedidos=>{
        pedidosGlobais = Array.isArray(pedidos) ? pedidos : [];
        renderizarPedidos([...pedidosGlobais]);
        atualizarDashboard(pedidosGlobais); atualizarProdutosMaisVendidos(pedidosGlobais);
    }).catch(err=>{ console.error(err); alert("Erro ao carregar pedidos."); }).finally(esconderCarregamentoAdmin);
}

function renderizarPedidos(listaPedidos = pedidos) {

    const tbody = document.querySelector("#tabelaPedidos tbody");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = "";

    const pedidosOrdenados = [...listaPedidos].sort((a, b) => {
        const dataA = converterDataPedido(a.data);
        const dataB = converterDataPedido(b.data);

        return dataA - dataB;
    });

    if (pedidosOrdenados.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; font-weight: bold;">
                    Nenhum pedido encontrado.
                </td>
            </tr>
        `;

        renderizarPedidosMobile([]);
        return;
    }

    pedidosOrdenados.forEach(pedido => {

        const totalFormatado = formatarValorPedido(pedido.total);
        const statusAtual = pedido.status || "Pendente";

        tbody.innerHTML += `
            <tr>
                <td>${pedido.data || "-"}</td>
                <td>${pedido.nome || "-"}</td>
                <td>${pedido.telefone || "-"}</td>
                <td>${pedido.endereco || "-"}</td>
                <td>${pedido.pagamento || "-"}</td>
                <td>${pedido.entrega || "-"}</td>
                <td>${pedido.pedido || "-"}</td>
                <td>${pedido.observacao || "-"}</td>
                <td>${totalFormatado}</td>
                <td>
                    <select 
                        class="status-select ${classeStatus(statusAtual)}"
                        onchange="alterarStatusPedido('${pedido.linha}', this.value)"
                    >
                        <option value="Pendente" ${statusAtual === "Pendente" ? "selected" : ""}>Pendente</option>
                        <option value="Em separação" ${statusAtual === "Em separação" ? "selected" : ""}>Em separação</option>
                        <option value="Saiu para entrega" ${statusAtual === "Saiu para entrega" ? "selected" : ""}>Saiu para entrega</option>
                        <option value="Concluído" ${statusAtual === "Concluído" ? "selected" : ""}>Concluído</option>
                        <option value="Cancelado" ${statusAtual === "Cancelado" ? "selected" : ""}>Cancelado</option>
                    </select>
                </td>
                <td>
                    ${
                        statusAtual === "Saiu para entrega"
                        ? `
                            <button 
                                class="btn-avisar-cliente"
                                onclick="avisarClienteWhatsApp('${pedido.nome || ""}', '${pedido.telefone || ""}')"
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

    renderizarPedidosMobile(pedidosOrdenados);
}

function alterarStatusPedido(linha,status,select) {
    const valorAnterior=select.getAttribute("data-status-anterior") || select.value;
    select.disabled=true; select.className=`status-select ${classeStatus(status)}`; mostrarCarregamentoAdmin("Atualizando status...");
    fetch(API_URL, { method:"POST", body:JSON.stringify({ tipo:"status", linha, status }) })
        .then(r=>r.text()).then(()=>{ select.setAttribute("data-status-anterior",status); alert("Status atualizado com sucesso!"); carregarPedidos(); })
        .catch(err=>{ console.error(err); alert("Erro ao atualizar status."); select.value=valorAnterior; select.className=`status-select ${classeStatus(valorAnterior)}`; })
        .finally(()=>{ select.disabled=false; esconderCarregamentoAdmin(); });
}
function aplicarFiltrosPedidos() {
    const mes=document.getElementById("filtroMes")?.value;
    const dia=document.getElementById("filtroDia")?.value;
    const status=document.getElementById("filtroStatus")?.value || "Todos";
    let lista=[...pedidosGlobais];
    if(mes) lista=lista.filter(p=>formatarDataInput(p.data).startsWith(mes));
    if(dia) lista=lista.filter(p=>formatarDataInput(p.data)===dia);
    if(status!=="Todos") lista=lista.filter(p=>p.status===status);
    renderizarPedidos(lista); atualizarDashboard(lista); atualizarProdutosMaisVendidos(lista);
}
function limparFiltrosPedidos() { document.getElementById("filtroMes").value=""; document.getElementById("filtroDia").value=""; document.getElementById("filtroStatus").value="Todos"; renderizarPedidos(pedidosGlobais); atualizarDashboard(pedidosGlobais); atualizarProdutosMaisVendidos(pedidosGlobais); }
function filtrarPedidosHoje() { const hoje=new Date().toISOString().slice(0,10); document.getElementById("filtroDia").value=hoje; document.getElementById("filtroMes").value=""; aplicarFiltrosPedidos(); }

function atualizarDashboard(pedidos=[]) {
    const totalProdutos=produtos.length, totalPedidos=pedidos.length;
    const pendentes=pedidos.filter(p=>p.status==="Pendente").length;
    const concluidos=pedidos.filter(p=>p.status==="Concluído").length;
    let vendas=0;
    pedidos.forEach(p=>{ if(p.status==="Concluído") { const v=Number(String(p.total||"0").replace("R$","").replace(",",".").trim()); if(!isNaN(v)) vendas+=v; } });
    setText("totalProdutos", totalProdutos); setText("totalPedidos", totalPedidos); setText("pedidosPendentes", pendentes); setText("pedidosConcluidos", concluidos); setText("vendasMes", `R$ ${vendas.toFixed(2)}`);
}
function setText(id,valor){ const el=document.getElementById(id); if(el) el.innerText=valor; }
function atualizarProdutosMaisVendidos(pedidos=[]) {
    const ul=document.getElementById("listaMaisVendidos"); if(!ul) return; const ranking={};
    pedidos.forEach(p=>{ if(p.status!=="Concluído" || !p.pedido) return; p.pedido.split(",").forEach(item=>{ const nome=item.split(" x")[0].trim(); const qtdTexto=(item.match(/x([0-9.,]+)/)||[])[1] || "1"; const qtd=Number(qtdTexto.replace(",",".")) || 1; ranking[nome]=(ranking[nome]||0)+qtd; }); });
    const ordenado=Object.entries(ranking).sort((a,b)=>b[1]-a[1]).slice(0,10); ul.innerHTML=ordenado.length ? ordenado.map(([n,q],i)=>`<li><span>${i+1}. ${n}</span><strong>${q} unidade(s)</strong></li>`).join("") : `<li>Nenhuma venda concluída no filtro atual.</li>`;
}
function atualizarEstoqueBaixo() {
    const tbody=document.querySelector("#tabelaEstoqueBaixo tbody"); if(!tbody) return; tbody.innerHTML="";
    const baixos=produtos.filter(p=>{ const e=Number(p.estoque||0); return p.tipoVenda==="Peso" ? e <= 2 : e <= 5; });
    if(!baixos.length) { tbody.innerHTML=`<tr><td colspan="4" style="text-align:center;font-weight:bold;">Nenhum produto com estoque baixo.</td></tr>`; return; }
    baixos.forEach(p=> tbody.innerHTML += `<tr><td>${p.nome}</td><td>${formatarEstoqueAdmin(p.estoque,p.tipoVenda)}</td><td>${p.tipoVenda==="Peso"?"Peso":"Quantidade"}</td><td>Estoque acabando</td></tr>`);
}

function carregarFuncionamentoLojaAdmin() {
    const salvoLocal = carregarFuncionamentoLocalAdmin();

    fetch(`${API_URL}?tipo=funcionamento&t=${Date.now()}`)
        .then(r => r.json())
        .then(dados => {
            if (dados && dados.modo) {
                funcionamentoAtual = dados;
                salvarFuncionamentoLocalAdmin(dados.modo, dados.mensagem || "");
            } else if (salvoLocal) {
                funcionamentoAtual = salvoLocal;
            }
            atualizarTelaFuncionamento();
        })
        .catch(() => {
            funcionamentoAtual = salvoLocal || { modo: "automatico", mensagem: "" };
            atualizarTelaFuncionamento("Usando configuração salva neste computador. Para funcionar para todos os clientes, atualize o Apps Script.");
        });
}
function atualizarTelaFuncionamento(aviso="") {
    const radio=document.querySelector(`input[name="modoFuncionamento"][value="${funcionamentoAtual.modo || "automatico"}"]`); if(radio) radio.checked=true;
    const msg=document.getElementById("mensagemFuncionamento"); if(msg) msg.value=funcionamentoAtual.mensagem || "";
    const st=document.getElementById("statusFuncionamentoAdmin"); if(st) st.innerHTML=`Modo atual: <strong>${funcionamentoAtual.modo || "automatico"}</strong>${funcionamentoAtual.mensagem ? `<br>Mensagem: ${funcionamentoAtual.mensagem}` : ""}${aviso ? `<br>${aviso}` : ""}`;
}
function salvarFuncionamentoLoja() {
    const modo = document.querySelector('input[name="modoFuncionamento"]:checked')?.value || "automatico";
    const mensagem = document.getElementById("mensagemFuncionamento")?.value.trim() || "";

    funcionamentoAtual = { modo, mensagem };
    salvarFuncionamentoLocalAdmin(modo, mensagem);
    atualizarTelaFuncionamento("Configuração salva localmente neste computador.");

    mostrarCarregamentoAdmin("Salvando funcionamento...");

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ tipo: "funcionamento", modo, mensagem })
    })
    .then(r => r.text())
    .then(txt => {
        console.log("Funcionamento salvo no Apps Script:", txt);
        alert("Funcionamento salvo. Abra ou atualize o site do cliente para conferir.");
        atualizarTelaFuncionamento();
    })
    .catch(err => {
        console.error(err);
        alert("Funcionamento salvo neste computador, mas não foi salvo no Apps Script. Para valer para todos os clientes, atualize o Apps Script.");
    })
    .finally(esconderCarregamentoAdmin);
}

function salvarFuncionamentoLocalAdmin(modo, mensagem) {
    localStorage.setItem("funcionamentoLojaMercadinho", JSON.stringify({
        modo: modo || "automatico",
        mensagem: mensagem || ""
    }));
}

function carregarFuncionamentoLocalAdmin() {
    try {
        return JSON.parse(localStorage.getItem("funcionamentoLojaMercadinho")) || null;
    } catch (erro) {
        return null;
    }
}

function normalizarTexto(texto) { return normalizarTextoAdmin(texto); }

function normalizarTextoAdmin(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]/g, "");
}

function produtoEhGasAdmin(produto) {
    const texto = normalizarTextoAdmin([
        produto?.nome,
        produto?.categoria,
        nomeCategoria(produto?.categoria)
    ].join(" "));

    return texto.includes("gas") || texto.includes("botijao");
}
function nomeCategoria(categoria) { const nomes={Bebidas:"Bebidas",Massas:"Massas",Graos:"Grãos",Laticinios:"Laticínios",AguaGas:"Água/Gás",Hortifruti:"Hortifruti",Frios:"Frios"}; return nomes[categoria] || categoria || "-"; }
function formatarEstoqueAdmin(estoque,tipoVenda) { const v=Number(estoque||0); return tipoVenda==="Peso" ? `${v.toFixed(3).replace(".", ",")} kg` : `${Math.floor(v)} un`; }
function formatarDataHora(data) { if(!data) return "-"; const d=new Date(data); if(isNaN(d)) return data; return d.toLocaleDateString("pt-BR") + ", " + d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
function formatarDataInput(data) { const d=new Date(data); if(isNaN(d)) return ""; return d.toISOString().slice(0,10); }
function formatarPedido(texto) { return String(texto || "-").replace(/,/g,"<br>"); }
function classeStatus(status) { return {"Pendente":"status-pendente","Em separação":"status-separacao","Saiu para entrega":"status-entrega","Concluído":"status-concluido","Cancelado":"status-cancelado"}[status] || "status-pendente"; }
function avisarClienteWhatsApp(nome, telefone) { const tel=String(telefone||"").replace(/\D/g,""); if(!tel) return alert("Telefone inválido."); const msg=encodeURIComponent(`Olá, ${nome}! Seu pedido do Mercadinho Ponto Certo saiu para entrega.`); window.open(`https://wa.me/55${tel}?text=${msg}`,"_blank"); }

function renderizarPedidosMobile(pedidos = []) {

    const listaMobile = document.getElementById("listaPedidosMobile");

    if (!listaMobile) {
        return;
    }

    listaMobile.innerHTML = "";

    if (!pedidos || pedidos.length === 0) {

        listaMobile.innerHTML = `
            <div class="pedido-card-mobile">
                <p>Nenhum pedido encontrado.</p>
            </div>
        `;

        return;
    }

    pedidos.forEach(pedido => {

        const telefoneLimpo = String(pedido.telefone || "").replace(/\D/g, "");

        listaMobile.innerHTML += `
            <div class="pedido-card-mobile">

                <div class="pedido-card-topo">
                    <div>
                        <strong>${pedido.nome || "-"}</strong>
                        <span>${formatarDataHora(pedido.data)}</span>
                    </div>

                    <div class="pedido-card-total">
                        R$ ${Number(pedido.total || 0).toFixed(2)}
                    </div>
                </div>

                <div class="pedido-card-info">
                    <p><strong>Telefone:</strong> ${pedido.telefone || "-"}</p>
                    <p><strong>Endereço:</strong> ${pedido.endereco || "-"}</p>
                    <p><strong>Pagamento:</strong> ${pedido.pagamento || "-"}</p>
                    <p><strong>Tipo:</strong> ${pedido.entrega || "-"}</p>
                    <p><strong>Pedido:</strong> ${formatarPedido(pedido.pedido || "-")}</p>
                    <p><strong>Observação:</strong> ${pedido.observacao || "-"}</p>
                </div>

                <div class="pedido-card-acoes">

                    <select 
                        class="status-select ${classeStatus(pedido.status)}"
                        data-status-anterior="${pedido.status}"
                        onchange="alterarStatusPedido(${pedido.linha}, this.value)"
                    >
                        <option value="Pendente" ${pedido.status === "Pendente" ? "selected" : ""}>Pendente</option>
                        <option value="Em separação" ${pedido.status === "Em separação" ? "selected" : ""}>Em separação</option>
                        <option value="Saiu para entrega" ${pedido.status === "Saiu para entrega" ? "selected" : ""}>Saiu para entrega</option>
                        <option value="Concluído" ${pedido.status === "Concluído" ? "selected" : ""}>Concluído</option>
                        <option value="Cancelado" ${pedido.status === "Cancelado" ? "selected" : ""}>Cancelado</option>
                    </select>

                    <button 
                        class="btn-whatsapp-card"
                        onclick="avisarClienteWhatsApp('${pedido.nome}', '${telefoneLimpo}')"
                    >
                        WhatsApp
                    </button>

                </div>

            </div>
        `;
    });
}

function converterDataPedido(dataTexto) {

    if (!dataTexto) {
        return new Date(0);
    }

    const texto = String(dataTexto).trim();

    const partes = texto.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2})?:?(\d{2})?/);

    if (partes) {

        const dia = partes[1];
        const mes = partes[2];
        const ano = partes[3];
        const hora = partes[4] || "00";
        const minuto = partes[5] || "00";

        return new Date(`${ano}-${mes}-${dia}T${hora}:${minuto}:00`);
    }

    const dataConvertida = new Date(texto);

    if (isNaN(dataConvertida.getTime())) {
        return new Date(0);
    }

    return dataConvertida;
}

function formatarValorPedido(valor) {

    if (typeof valor === "number") {
        return `R$ ${valor.toFixed(2)}`;
    }

    const texto = String(valor || "0").trim();

    if (texto.includes("R$")) {
        return texto;
    }

    const numero = Number(texto.replace(",", "."));

    if (isNaN(numero)) {
        return "R$ 0.00";
    }

    return `R$ ${numero.toFixed(2)}`;
}