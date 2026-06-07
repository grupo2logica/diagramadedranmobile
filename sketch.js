let fatias = 4;
let camadas = 8;

let raioMax;

let operacao = "AND";
let conectivoSelecionado = false; // Rastreia se o conectivo foi ativado pelo usuário

let entradaAtiva = "P";

let pontos = {};

let ordemCliques = [];

let historicoResultados = [];

let camadaObrigatoria = -1;

let negarGeral = false;

let modoNegacaoManual = false;

let previewMouseX = 0;
let previewMouseY = 0;

let cliqueParaAprenderAtivo = false;

const CAMADA_CENTRAL = 1;

// Elemento do balão flutuante (Tooltip)
let tooltipExpressao;

function setup(){
    let canvasSize = min(windowWidth - 30, 700);
    let canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent("canvas-container");

    textAlign(CENTER, CENTER);
    raioMax = (width / 2) * 0.85;

    canvas.elt.style.touchAction = "none";

    // Criação dinâmica do balãozinho no DOM
    tooltipExpressao = document.createElement("div");
    tooltipExpressao.style.position = "absolute";
    tooltipExpressao.style.pointerEvents = "none";
    tooltipExpressao.style.backgroundColor = "rgba(15, 15, 15, 0.95)";
    tooltipExpressao.style.border = "2px solid #555";
    tooltipExpressao.style.padding = "8px 12px";
    tooltipExpressao.style.borderRadius = "6px";
    tooltipExpressao.style.color = "#fff";
    tooltipExpressao.style.fontFamily = "monospace";
    tooltipExpressao.style.fontSize = "14px";
    tooltipExpressao.style.fontWeight = "bold";
    tooltipExpressao.style.boxShadow = "0px 4px 10px rgba(0,0,0,0.5)";
    tooltipExpressao.style.display = "none";
    tooltipExpressao.style.zIndex = "9999";
    document.body.appendChild(tooltipExpressao);

    atualizarUI();
    configurarEventosHistorico();
}

function draw(){
    background(8);
    translate(width / 2, height / 2);

    desenharResultado();
    desenharPreview();
    desenharPontos();
    desenharGrade();

    // Atualiza a posição e exibição do balãozinho conforme o movimento do mouse
    gerenciarBalaoFlutuante();
}

function atualizarUI(){
    // 1. Remove o estado ativo de absolutamente todos os botões do painel
    document.querySelectorAll("button").forEach(btn => {
        btn.classList.remove("active");
    });

    // 2. Se o modo de negação manual estiver ligado, destaca APENAS o botão ¬
    if(modoNegacaoManual){
        let btnNeg = document.getElementById("btn¬");
        if(btnNeg) btnNeg.classList.add("active");
    } else {
        // 3. Caso contrário, destaca a letra que está pronta para ser inserida (Apenas P ou Q)
        let btnLetra = document.getElementById("btn" + entradaAtiva);
        if(btnLetra) btnLetra.classList.add("active");
    }

    // 4. Mantém o destaque do conectivo lógico selecionado (∧, ∨, →, etc), se houver um ativo
    if(conectivoSelecionado && operacao) {
        let op = document.getElementById(operacao);
        if(op) op.classList.add("active");
    }

    // 5. Mantém o destaque do botão de negação da expressão completa
    let btnNegTudo = document.getElementById("btnNegTudo");
    if(btnNegTudo){
        btnNegTudo.classList.toggle("active", negarGeral);
    }

    // 6. Atualiza os textos dinâmicos
    if(typeof atualizarTexto === "function") {
        atualizarTexto();
    } else if(typeof atualizarUIDinamica === "function") {
        atualizarUIDinamica();
    }
}

function atualizarTexto(){
    let box = document.getElementById("expressao-dinamica");
    if(!box) return;

    if(ordemCliques.length === 0){
        box.innerHTML = "Nenhuma expressão ativa";
        return;
    }

    let id1 = ordemCliques[0];
    let fatiaBase = pontos[id1].f;
    let camadaBase = pontos[id1].c;

    if(ordemCliques.length >= 2) {
        let id2 = ordemCliques[1];
        fatiaBase = pontos[id2].f; 
    }

    box.innerHTML = obterExpressaoHTMLColorida(fatiaBase, camadaBase, false);
}

function setEntrada(letra) {
    // Proteção: ignora botões residuais de r ou s que possam vir da interface antiga
    if (letra === "r" || letra === "s" || letra === "R" || letra === "S") return;
    modoNegacaoManual = false; 
    entradaAtiva = letra;
    atualizarUI();
}

function setOp(op){
    if(ordemCliques.length === 1 && operacao === op) {
        conectivoSelecionado = !conectivoSelecionado;
    } else {
        operacao = op;
        conectivoSelecionado = true;
    }
    atualizarUI();
}

function ativarModoNegacao(){
    modoNegacaoManual = !modoNegacaoManual;
   
    if(modoNegacaoManual) {
        entradaAtiva = "";
    } else {
        entradaAtiva = ordemCliques.length === 1 ? ordemCliques[0] : "P";
    }
   
    atualizarUI();
}

function limparDiagrama(){
    pontos = {};
    ordemCliques = [];
    camadaObrigatoria = -1;
    negarGeral = false;
    modoNegacaoManual = false;
    entradaAtiva = "P";
    operacao = "AND";
    conectivoSelecionado = false;
    tooltipExpressao.style.display = "none";
    atualizarUI();
}

function limparLogs(){
    historicoResultados = [];
    let logArea = document.getElementById("log-area");
    if(logArea){
        logArea.innerHTML = "<b>Histórico de Expressões:</b><br>";
    }
}

function getValorLogicoFatia(f){
    let ang = (TWO_PI / fatias) * (f + 0.5);
    let x = cos(ang);
    let y = sin(ang);

    if(x >= 0 && y <= 0) return true;
    if(x < 0 && y <= 0) return false;
    if(x < 0 && y > 0) return true;
    return false;
}

function getValorLogicoQuadrante(f){
    let ang = (TWO_PI / fatias) * (f + 0.5);
    let x = cos(ang);
    let y = sin(ang);

    if(x >= 0 && y <= 0) return "Q1";
    if(x < 0 && y <= 0) return "Q2";
    if(x < 0 && y > 0) return "Q3";
    return "Q4";
}

function existeProposicaoNoQuadrante(fatia){
    let quadrante = getValorLogicoQuadrante(fatia);
    for(let id in pontos){
        let q = getValorLogicoQuadrante(pontos[id].f);
        if(q === quadrante) return true;
    }
    return false;
}

function calcularOperacao(a, b, op){
    switch(op){
        case "AND": return a && b;
        case "OR":  return a || b;
        case "IF":  return (!a || b);
        case "IFF": return a === b;
        case "XOR": return a !== b;
    }
    return false;
}

function obterValoresUnarios(id1, fatiaBase){
    let pontoNegado = id1.startsWith("¬");
    let valorBase = getValorLogicoFatia(fatiaBase);

    let valorA;
    let valorB;

    if(!modoNegacaoManual && !pontoNegado){
        valorA = valorBase; valorB = valorBase;
    }
    else if(!modoNegacaoManual && pontoNegado){
        valorA = valorBase; valorB = valorBase;
    }
    else if(modoNegacaoManual && !pontoNegado){
        valorA = valorBase; valorB = !valorBase;
    }
    else {
        valorA = valorBase; valorB = !valorBase;
    }

    return { valorA, valorB };
}

function calcularValorSemanticoExpressao(){
    if(ordemCliques.length === 0) return false;

    let id1 = ordemCliques[0];
    let ponto1 = pontos[id1];

    if(ordemCliques.length === 1){
        if(!conectivoSelecionado) {
            let valorPuro = getValorLogicoFatia(ponto1.f);
            if(negarGeral) valorPuro = !valorPuro;
            return valorPuro;
        }
         
        let valores = obterValoresUnarios(id1, ponto1.f);
        let r = calcularOperacao(valores.valorA, valores.valorB, operacao);
        if(negarGeral) r = !r;
        return r;
    }

    let id2 = ordemCliques[1];
    let v1 = getValorLogicoFatia(ponto1.f);
    let v2 = getValorLogicoFatia(pontos[id2].f);

    let r = calcularOperacao(v1, v2, operacao);
    if(negarGeral) r = !r;
    return r;
}

function desenharResultado(){
    if(ordemCliques.length < 1) return;

    let id1 = ordemCliques[0];
    let ponto1 = pontos[id1];

    let camadaBase = ponto1.c;

    desenharCamada(camadaBase, false);

    if(camadaBase > CAMADA_CENTRAL && ordemCliques.length >= 2){
        desenharCamada(camadaBase - 1, true);
    }
}

function desenharCamada(camada, inverterPrimeira){
    if(camada <= 0) return;

    for(let f = 0; f < fatias; f++){
        let r = calcularResultadoEstrutural(f, inverterPrimeira);
        fill(r ? color(46, 204, 113, 220) : color(231, 76, 60, 220));
        noStroke();
        drawCasa(f, camada);
    }
}

function calcularResultadoEstrutural(fatiaAtual, inverterPrimeira){
    let id1 = ordemCliques[0];

    if(ordemCliques.length === 1){
        if(!conectivoSelecionado) {
            let rPuro = getValorLogicoFatia(fatiaAtual);
            if(negarGeral) rPuro = !rPuro;
            return rPuro;
        }
        let valores = obterValoresUnarios(id1, fatiaAtual);
        let r = calcularOperacao(valores.valorA, valores.valorB, operacao);
        if(negarGeral) r = !r;
        return r;
    }

    let valorA = getValorLogicoFatia(pontos[id1].f);
    if(inverterPrimeira) valorA = !valorA;

    let valorB = getValorLogicoFatia(fatiaAtual);
    let r = calcularOperacao(valorA, valorB, operacao);
    if(negarGeral) r = !r;
    return r;
}

function obterExpressaoHTMLColorida(fatiaAtual, camadaAtual, isSegundaCamadaInterna) {
    if(ordemCliques.length === 0) return "";

    let id1 = ordemCliques[0];
    let corVerde = "#2ecc71";
    let corVermelha = "#e74c3c";
    let mapaComposta = { AND: "∧", OR: "∨", IF: "→", IFF: "↔", XOR: "⊻" };

    let isInterna = (camadaAtual === 2 || isSegundaCamadaInterna);
    let p1 = pontos[id1];
   
    let p1EstaNegado = id1.startsWith("¬") || (p1 && p1.fFalsaOrigem !== undefined && p1.negarGeralOrigem);
    let letraBaseP = id1.replace("¬", "").toLowerCase();
    let rotuloP = p1EstaNegado ? `¬${letraBaseP}` : letraBaseP;

    let opAtual = operacao;
    let negGeralAtual = negarGeral;
    let temConectivo = conectivoSelecionado;

    if(ordemCliques.length === 1){
        if(!temConectivo) {
            let pVal = getValorLogicoFatia(fatiaAtual);
            let valorFinal = pVal;
            if(negGeralAtual) valorFinal = !valorFinal;
           
            let corP = pVal ? corVerde : corVermelha;
            let corEstrutura = valorFinal ? corVerde : corVermelha;
           
            return `<span style="color:${corEstrutura}">${negGeralAtual ? '¬' : ''}</span><span style="color:${corP}">${rotuloP}</span><span style="color:${corEstrutura}"> = ${valorFinal ? 'V' : 'F'}</span>`;
        }

        let valores = obterValoresUnarios(id1, fatiaAtual);
        let r = calcularOperacao(valores.valorA, valores.valorB, opAtual);
        if(negGeralAtual) r = !r;

        let corA = valores.valorA ? corVerde : corVermelha;
        let corB = valores.valorB ? corVerde : corVermelha;
        let corOp = r ? corVerde : corVermelha;
        let opSimbolo = mapaComposta[opAtual] || " ";

        let termoA = rotuloP;
        let termoB = rotuloP;

        if (modoNegacaoManual) {
            termoB = id1.startsWith("¬") ? letraBaseP : "¬" + rotuloP;
        }

        let str = `<span style="color:${corOp}">[</span><span style="color:${corA}">${termoA}</span><span style="color:${corOp}"> ${opSimbolo} </span><span style="color:${corB}">${termoB}</span><span style="color:${corOp}">] = ${r ? 'V' : 'F'}</span>`;
        if(negGeralAtual) str = `<span style="color:${corOp}">¬</span>` + str;
        return str;
    }

    let id2 = ordemCliques[1];
    let p2 = pontos[id2];
    if (!p2) return "";

    let p2EstaNegado = id2.startsWith("¬");
    let letraBaseQ = id2.replace("¬", "").toLowerCase();
    let rotuloQ = p2EstaNegado ? `¬${letraBaseQ}` : letraBaseQ;
   
    let opSimbolo = mapaComposta[opAtual] || " ";

    let pVal, qVal;
    if (!isInterna) {
        pVal = getValorLogicoFatia(p1.f);
        qVal = getValorLogicoFatia(fatiaAtual);
    } else {
        pVal = !getValorLogicoFatia(p1.f);
        qVal = getValorLogicoFatia(fatiaAtual);
    }

    let r = calcularOperacao(pVal, qVal, opAtual);
    if(negGeralAtual) r = !r;

    let corA = pVal ? corVerde : corVermelha;
    let corB = qVal ? corVerde : corVermelha;
    let corOp = r ? corVerde : corVermelha;

    let str = `<span style="color:${corOp}">(</span><span style="color:${corA}">${rotuloP}</span><span style="color:${corOp}"> ${opSimbolo} </span><span style="color:${corB}">${rotuloQ}</span><span style="color:${corOp}">) = ${r ? 'V' : 'F'}</span>`;
    if(negGeralAtual) str = `<span style="color:${corOp}">¬</span>` + str;
   
    return str;
}

function gerenciarBalaoFlutuante() {
    if (ordemCliques.length === 0) {
        tooltipExpressao.style.display = "none";
        return;
    }

    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    let d = dist(mx, my, 0, 0);

    if (d > raioMax || d < 10) {
        tooltipExpressao.style.display = "none";
        return;
    }

    let c = ceil(d / (raioMax / camadas));
    let f = floor(((atan2(my, mx) + TWO_PI) % TWO_PI) / (TWO_PI / fatias));

    let id1 = ordemCliques[0];
    let camadaBase = pontos[id1].c;
   
    let isSegundaCamadaAtiva = (camadaBase > CAMADA_CENTRAL && c === (camadaBase - 1) && ordemCliques.length >= 2);

    if (c === camadaBase || isSegundaCamadaAtiva || (ordemCliques.length === 1 && !conectivoSelecionado)) {
        tooltipExpressao.innerHTML = obterExpressaoHTMLColorida(f, isSegundaCamadaAtiva ? 2 : 1, isSegundaCamadaAtiva);
        tooltipExpressao.style.display = "block";
       
        let canvasBounding = document.querySelector("canvas").getBoundingClientRect();
        tooltipExpressao.style.left = `${window.scrollX + canvasBounding.left + mouseX + 15}px`;
        tooltipExpressao.style.top = `${window.scrollY + canvasBounding.top + mouseY + 15}px`;
    } else {
        tooltipExpressao.style.display = "none";
    }
}

function desenharPreview(){
    if(ordemCliques.length >= 2) return;

    if(typeof entradaAtiva === "string" && entradaAtiva.length === 1 && entradaAtiva === entradaAtiva.toLowerCase()){
        for(let id in pontos){
            let nomeBase = id.replace("¬", "");
            if(nomeBase === entradaAtiva) return;
        }
    }

    let mx = mouseX - width / 2;
    let my = mouseY - height / 2;
    let d = dist(mx, my, 0, 0);

    if(d > raioMax) return;

    let camada = (camadaObrigatoria === -1) ? ceil(d / (raioMax / camadas)) : camadaObrigatoria;

    if(camada !== 8) return;

    let alpha = map(sin(frameCount * 0.12), -1, 1, 20, 120);
    noStroke();
    fill(125, 60, 255, alpha);

    for(let f = 0; f < fatias; f++){
        if(existeProposicaoNoQuadrante(f)) continue;
        drawCasa(f, camada);
    }
}

function drawCasa(f, c){
    let ang = TWO_PI / fatias;
    let a1 = ang * f;
    let a2 = a1 + ang;

    let r1 = (raioMax / camadas) * (c - 1);
    let r2 = (raioMax / camadas) * c;

    beginShape();
    for(let a = a1; a <= a2; a += 0.01) vertex(cos(a) * r2, sin(a) * r2);
    for(let a = a2; a >= a1; a -= 0.01) vertex(cos(a) * r1, sin(a) * r1);
    endShape(CLOSE);
}

function desenharGrade(){
    stroke(50);
    strokeWeight(1);
    noFill();

    for(let i = 1; i <= camadas; i++){
        ellipse(0, 0, (raioMax / camadas) * i * 2);
    }

    for(let i = 0; i < fatias; i++){
        let a = (TWO_PI / fatias) * i;
        line(0, 0, cos(a) * raioMax, sin(a) * raioMax);
    }

    stroke(120);
    strokeWeight(2);
    line(-raioMax, 0, raioMax, 0);
    line(0, -raioMax, 0, raioMax);

    fill(255);
    noStroke();
    textStyle(BOLD);
    textSize(width * 0.07);

    let off = raioMax * 0.8;
    text("V", off, -off);
    text("F", -off, -off);
    text("V", -off, off);
    text("F", off, off);
}

function desenharPontos(){
    for(let id in pontos){
        let p = pontos[id];
        let ang = (TWO_PI / fatias) * (p.f + 0.5);
        let r = (raioMax / camadas) * (p.c - 0.5);

        fill(255);
        noStroke();
        textStyle(BOLD);
        textSize(width * 0.04);
        text(id, cos(ang) * r, sin(ang) * r);
    }
}

function mouseMoved(){
    previewMouseX = mouseX;
    previewMouseY = mouseY;
} 

function touchMoved(){
    if(touches.length > 0){
        previewMouseX = touches[0].x;
        previewMouseY = touches[0].y;
    }
    return false;
}

function mousePressed(){
    handleInteracao(mouseX, mouseY);
    return false;
}

function touchStarted(){
    if(touches.length > 0){
        handleInteracao(touches[0].x, touches[0].y);
    }
    return false;
}

function handleInteracao(xIn, yIn){
    let mx = xIn - width / 2;
    let my = yIn - height / 2;
    let d = dist(mx, my, 0, 0);

    if(d > raioMax || d < 10) return;

    let c = ceil(d / (raioMax / camadas));
    if(c !== 8) return;

    let f = floor(((atan2(my, mx) + TWO_PI) % TWO_PI) / (TWO_PI / fatias));

    if(modoNegacaoManual){
        for(let id in pontos){
            let p = pontos[id];
            if(p.f === f && p.c === c){
                inverterPonto(id);
                atualizarCamadasPorProposicoesSimples(); 
                atualizarUI();
                return;
            }
        }
        return;
    }

    for(let id in pontos){
        let p = pontos[id];
        if(p.f === f && p.c === c){
            delete pontos[id];
            ordemCliques = ordemCliques.filter(x => x !== id);
            if(ordemCliques.length === 0){
                camadaObrigatoria = -1;
                conectivoSelecionado = false;
                entradaAtiva = "P"; 
            }
            atualizarCamadasPorProposicoesSimples(); 
            atualizarUI();
            return;
        }
    }

    for(let id in pontos){
        let nomeBase = id.replace("¬", "");
        if(nomeBase === entradaAtiva) return;
    }

    if(ordemCliques.length === 0) {
        camadaObrigatoria = 8; 
    }
    if(ordemCliques.length === 1 && c !== camadaObrigatoria) return;
    if(ordemCliques.length >= 2) return;
    if(existeProposicaoNoQuadrante(f)) return;

    let label = entradaAtiva;
    pontos[label] = { f, c: camadaObrigatoria };
    ordemCliques.push(label);

    if(ordemCliques.length === 2) conectivoSelecionado = true;

    atualizarCamadasPorProposicoesSimples(); 
    atualizarUI();
}

function inverterPonto(id){
    let p = pontos[id];
    if(!p) return;

    delete pontos[id];

    let valorAtual = getValorLogicoFatia(p.f);
    let alvo = !valorAtual;
    let novaFatia = p.f;
    let encontrou = false;

    for(let i = 1; i <= fatias; i++){
        let derecha = (p.f + i) % fatias;
        if(getValorLogicoFatia(derecha) === alvo){
            if(!existeProposicaoNoQuadrante(derecha)){
                novaFatia = derecha; encontrou = true; break;
            }
        }
        let esquerda = (p.f - i + fatias) % fatias;
        if(getValorLogicoFatia(esquerda) === alvo){
            if(!existeProposicaoNoQuadrante(esquerda)){
                novaFatia = esquerda; encontrou = true; break;
            }
        }
    }

    if(!encontrou){
        pontos[id] = p;
        return;
    }

    let novoID = id.startsWith("¬") ? id.substring(1) : "¬" + id;
    pontos[novoID] = { f: novaFatia, c: p.c };

    let idx = ordemCliques.indexOf(id);
    if(idx !== -1) ordemCliques[idx] = novoID;
}

function negarExpressaoInteira(){
    let distribuiuNegacao = false;

    if(ordemCliques.length === 1) conectivoSelecionado = true;

    if(operacao === "AND"){
        operacao = "OR";
        [...ordemCliques].forEach(id => { inverterPonto(id); });
        distribuiuNegacao = true;
    }
    else if(operacao === "OR"){
        operacao = "AND";
        [...ordemCliques].forEach(id => { inverterPonto(id); });
        distribuiuNegacao = true;
    }
    else if(operacao === "IF"){
        operacao = "AND";
        if(ordemCliques[1]) inverterPonto(ordemCliques[1]);
        distribuiuNegacao = true;
    }
    else if(operacao === "IFF"){
        operacao = "XOR"; distribuiuNegacao = true;
    }
    else if(operacao === "XOR"){
        operacao = "IFF"; distribuiuNegacao = true;
    }

    if(!distribuiuNegacao) negarGeral = !negarGeral;

    atualizarUI();
}

function registrarExpressao(){
    if(ordemCliques.length < 1){
        alert("Nenhuma expressão ativa.");
        return;
    }

    let id1 = ordemCliques[0];

    if (ordemCliques.length === 1 && !conectivoSelecionado) {
        alert("Não é possível registrar uma proposição simples isolada. Ative um conectivo ou adicione outro termo.");
        return;
    }

    let fatiaBase = pontos[id1].f;
    let resultadoText = calcularValorSemanticoExpressao() ? "V" : "F";
    
    let rotuloAtual = document.getElementById("expressao-dinamica") ? document.getElementById("expressao-dinamica").innerText.split('=')[0].replace(/^[A-Z]\.\s*/, '').trim() : "Expressão";

    let jaExiste = historicoResultados.some(item =>
        item.rotuloOriginal === rotuloAtual && item.valorGlobal === resultadoText
    );

    if (jaExiste) {
        alert("Essa expressão já está registrada!"); 
        return;
    }

    let letraComposta = String.fromCharCode(65 + historicoResultados.length); 

    let exprHTML_Historico = obterHTMLFormatadoParaHistorico();

    let novo = {
        numero: historicoResultados.length + 1,
        letra: letraComposta,
        rotuloOriginal: rotuloAtual,
        textoHTML: exprHTML_Historico,
        valorGlobal: resultadoText,
        operacaoOrigem: operacao,
        fFalsaOrigem: fatiaBase,
        negarGeralOrigem: negarGeral,
        camadasSubestrutura: ordemCliques.length >= 2 ? 2 : 1
    };

    historicoResultados.push(novo);

    let item = document.createElement("div");
    item.className = "log-item";
    item.style.padding = "4px";
    item.style.borderBottom = "1px solid #333";
    item.innerHTML = `<b>${novo.letra}.</b> ${novo.textoHTML} = <b>${novo.valorGlobal}</b>`;
    
    let logArea = document.getElementById("log-area");
    if(logArea) logArea.appendChild(item);
}

function obterHTMLFormatadoParaHistorico() {
    let id1 = ordemCliques[0];
    let corVerde = "#2ecc71";
    let corVermelha = "#e74c3c";

    let mapa = { AND: "∧", OR: "∨", IF: "→", IFF: "↔", XOR: "⊻" };
    
    if (ordemCliques.length === 1) {
        let valorPuro = getValorLogicoFatia(pontos[id1].f);
        if (negarGeral) valorPuro = !valorPuro;
        
        let corComponente = valorPuro ? corVerde : corVermelha;
        let ex = id1.toLowerCase();
        
        if (negarGeral) {
            return `<span style="color:${corComponente}">¬${ex}</span>`;
        }
        return `<span style="color:${corComponente}">${ex}</span>`;
    }
    
    let id2 = ordemCliques[1];
    let pVal = getValorLogicoFatia(pontos[id1].f);
    let qVal = getValorLogicoFatia(pontos[id2].f);
    let r = calcularOperacao(pVal, qVal, operacao);
    if(negarGeral) r = !r;
    
    let corOp = r ? corVerde : corVermelha;
    let corP = pVal ? corVerde : corVermelha;
    let corQ = qVal ? corVerde : corVermelha;
    let opSimbolo = mapa[operacao] || " ";
    
    let baseHTML = `(<span style="color:${corP}">${id1.toLowerCase()}</span> ${opSimbolo} <span style="color:${corQ}">${id2.toLowerCase()}</span>)`;
    if(negarGeral) baseHTML = `¬` + baseHTML;
    
    return `<span style="color:${corOp}">${baseHTML}</span>`;
}

function configurarEventosHistorico() {
    let logArea = document.getElementById("log-area");
    if(!logArea) return;
    // Função limpa sem gatilhos para reinserção de compostas no canvas
}

function atualizarCamadasPorProposicoesSimples() {
    if (!ordemCliques || ordemCliques.length === 0) {
        camadaObrigatoria = -1;
        return;
    }

    let unicas = new Set();

    ordemCliques.forEach(id => {
        let letra = String(id)
            .replace("¬", "")
            .trim()
            .toLowerCase();

        if (letra.length === 1) {
            unicas.add(letra);
        }
    });

    let n = unicas.size;
    if (n < 2) n = 2;

    let resultadoCamadas = Math.pow(2, n - 1);

    ordemCliques.forEach(id => {
        if (pontos[id]) {
            pontos[id].camadasSubestrutura = resultadoCamadas;
        }
    });
}

function windowResized(){
    let canvasSize = min(windowWidth - 30, 700);
    resizeCanvas(canvasSize, canvasSize);
    raioMax = (width / 2) * 0.85;
}