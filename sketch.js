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

        // 3. Caso contrário, destaca a letra que está pronta para ser inserida

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



    // 6. Atualiza os textos dinâmicos (chama a função nativa do seu sistema)

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



    // Em vez de pegar uma fatia estática, calculamos com base no contexto atual da operação.

    // Se houver apenas 1 clique, usamos a fatia dele; se houver 2, avaliamos a relação entre eles.

    let id1 = ordemCliques[0];

    let fatiaBase = pontos[id1].f;

    let camadaBase = pontos[id1].c;



    // Se houver um segundo clique, a expressão estática superior deve considerar o encaixe global

    if(ordemCliques.length >= 2) {

        let id2 = ordemCliques[1];

        fatiaBase = pontos[id2].f; // Atualiza a fatia alvo para o escopo correto da operação

    }



    box.innerHTML = obterExpressaoHTMLColorida(fatiaBase, camadaBase, false);

}



function setEntrada(letra) {

    modoNegacaoManual = false; // Desliga a negação para aceitar a nova letra

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

        // Guarda temporariamente para não perder o padrão, mas limpa a seleção visual das letras

        entradaAtiva = "";

    } else {

        // Se desativar, volta para o padrão seguro

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



// =================================================================

// MODIFICAÇÃO DIRECIONADA: MAPEAMENTO E INTERAÇÃO EXCLUSIVA NA 8

// =================================================================



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



    // Descobre em qual fatia o mouse está no momento para calcular em tempo real

    let mx = mouseX - width / 2;

    let my = mouseY - height / 2;

    let fatiaAtual = floor(((atan2(my, mx) + TWO_PI) % TWO_PI) / (TWO_PI / fatias));



    if(ordemCliques.length === 1){

        if(ponto1.isCompostaHistorico) {

            // Calcula o valor real da composta nesta fatia específica

            let valorA_Orig = getValorLogicoFatia(ponto1.fFalsaOrigem);

            let valorB_Orig = getValorLogicoFatia(fatiaAtual);

            let vComposta = calcularOperacao(valorA_Orig, valorB_Orig, ponto1.operacaoOrigem);

            if(ponto1.negarGeralOrigem) vComposta = !vComposta;



            if (conectivoSelecionado) {

                // AUTO-CRUZAMENTO: Opera a composta contra ela mesma!

                let r = calcularOperacao(vComposta, vComposta, operacao);

                if(negarGeral) r = !r;

                return r;

            }

            return vComposta;

        }



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



    // Caso existam 2 elementos diferentes no diagrama

    let id2 = ordemCliques[1];

    let v1 = ponto1.isCompostaHistorico ? calcularResultadoCompostaFatiaOriginal(ponto1, fatiaAtual) : getValorLogicoFatia(ponto1.f);

    let v2 = pontos[id2].isCompostaHistorico ? calcularResultadoCompostaFatiaOriginal(pontos[id2], fatiaAtual) : getValorLogicoFatia(pontos[id2].f);



    let r = calcularOperacao(v1, v2, operacao);

    if(negarGeral) r = !r;

    return r;

}



// Função auxiliar para ajudar no cálculo híbrido de 2 cliques

function calcularResultadoCompostaFatiaOriginal(p, f) {

    let vA = getValorLogicoFatia(p.fFalsaOrigem);

    let vB = getValorLogicoFatia(f);

    let r = calcularOperacao(vA, vB, p.operacaoOrigem);

    if(p.negarGeralOrigem) r = !r;

    return r;

}



// Função auxiliar para ajudar no cálculo híbrido de 2 cliques

function calcularResultadoCompostaFatiaOriginal(p, f) {

    let vA = getValorLogicoFatia(p.fFalsaOrigem);

    let vB = getValorLogicoFatia(f);

    let r = calcularOperacao(vA, vB, p.operacaoOrigem);

    if(p.negarGeralOrigem) r = !r;

    return r;

}



function desenharResultado(){

    if(ordemCliques.length < 1) return;



    // Procura se existe alguma composta ativa, independente da posição

    let compostaID = null;



    for(let id of ordemCliques){

        if(pontos[id] && pontos[id].isCompostaHistorico){

            compostaID = id;

            break;

        }

    }



    // =====================================================

    // EXISTE UMA COMPOSTA ATIVA NO DIAGRAMA

    // =====================================================

    if(compostaID){



        let pontoComposta = pontos[compostaID];



        let totalCamadasComposta = pontoComposta.camadasSubestrutura || 2;

        let camadaInicial = pontoComposta.c;



        for(let k = 0; k < totalCamadasComposta; k++){



            let camadaAtual = camadaInicial - k;



            if(camadaAtual <= 0) break;



            for(let f = 0; f < fatias; f++){



                let valorA = getValorLogicoFatia(pontoComposta.fFalsaOrigem);



                if(k % 2 !== 0){

                    valorA = !valorA;

                }



                let valorB = getValorLogicoFatia(f);



                let r = calcularOperacao(

                    valorA,

                    valorB,

                    pontoComposta.operacaoOrigem

                );



                if(pontoComposta.negarGeralOrigem){

                    r = !r;

                }



                fill(

                    r

                    ? color(46,204,113,220)

                    : color(231,76,60,220)

                );



                noStroke();

                drawCasa(f, camadaAtual);

            }

        }



        return;

    }



    // =====================================================

    // COMPORTAMENTO ORIGINAL PARA SIMPLES

    // =====================================================

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



    // Identifica se estamos avaliando a subcamada analítica interna (Camada 2 de Dran)

    let isInterna = (camadaAtual === 2 || isSegundaCamadaInterna);



    // =========================================================================

    // TRATAMENTO PARA PROPOSIÇÃO COMPOSTA REGISTRADA (A. (p e q))

    // =========================================================================

    // =========================================================================

    // TRATAMENTO PARA PROPOSIÇÃO COMPOSTA REGISTRADA (A. (p e q))

    // =========================================================================

    if(pontos[id1].isCompostaHistorico) {

        let p1 = pontos[id1];

       

        let pVal;

        if (!isInterna) {

            // Se estiver na Camada 1 da subestrutura, mantém o valor estável original

            pVal = getValorLogicoFatia(p1.fFalsaOrigem);

        } else {

            // Se o cursor estiver no trajeto da Camada 2, inverte o valor para demonstrar as variáveis

            pVal = !getValorLogicoFatia(p1.fFalsaOrigem);

        }

       

        let qVal = getValorLogicoFatia(fatiaAtual);

        let rComposta = calcularOperacao(pVal, qVal, p1.operacaoOrigem);

        if(p1.negarGeralOrigem) rComposta = !rComposta;



        let textoLimpo = p1.rotuloOriginal.replace(/^\(|\)$/g, '');

        let partes = textoLimpo.split(/\s*[∧∨→↔⊻]\s*/);

        let pStr = partes[0] ? partes[0].trim() : "p";

        let qStr = partes[1] ? partes[1].trim() : "q";



        let opSimboloOriginal = mapaComposta[p1.operacaoOrigem] || " ";



        // Blindagem estrita de cores: variáveis fixas em seus valores individuais nesta camada

        let corP = pVal ? corVerde : corVermelha;

        let corQ = qVal ? corVerde : corVermelha;

        let corOpOrig = rComposta ? corVerde : corVermelha;



        let compostaHTML = `<span style="color:${corOpOrig}">(</span><span style="color:${corP}">${pStr}</span><span style="color:${corOpOrig}"> ${opSimboloOriginal} </span><span style="color:${corQ}">${qStr}</span><span style="color:${corOpOrig}">)</span>`;

        if(p1.negarGeralOrigem) compostaHTML = `<span style="color:${corOpOrig}">¬</span>` + compostaHTML;



        // === CORREÇÃO DE PRIORIDADE: DESTRAVA O CURSOR E A EXPRESSÃO DINÂMICA ===

        // Agora prioriza a variável global 'operacao'. Se você mudar o conectivo no painel,

        // o cursor e a caixa de texto responderão dinamicamente em tempo real!

        let opAtual = operacao || p1.operacaoOrigem;

        let negGeralAtual = negarGeral;



        if (ordemCliques.length === 1 && (conectivoSelecionado || p1.operacaoOrigem)) {

            let rFinal = calcularOperacao(rComposta, rComposta, opAtual);

            if(negGeralAtual) rFinal = !rFinal;

            let corEstrutura = rFinal ? corVerde : corVermelha;

            let opAtualSimbolo = mapaComposta[opAtual] || " ";



            let resultadoHTML = `<span style="color:${corEstrutura}">[</span>${compostaHTML}<span style="color:${corEstrutura}"> ${opAtualSimbolo} </span>${compostaHTML}<span style="color:${corEstrutura}">] = ${rFinal ? 'V' : 'F'}</span>`;

            if(negGeralAtual) resultadoHTML = `<span style="color:${corEstrutura}">¬</span>` + resultadoHTML;

            return resultadoHTML;

        }



        let corEstrutura = rComposta ? corVerde : corVermelha;

        let htmlResultado = `<span style="color:${corEstrutura}">(</span><span style="color:${corP}">${pStr}</span><span style="color:${corOpOrig}"> ${opSimboloOriginal} </span><span style="color:${corQ}">${qStr}</span><span style="color:${corEstrutura}">) = ${rComposta ? 'V' : 'F'}</span>`;

        if(p1.negarGeralOrigem) htmlResultado = `<span style="color:${corEstrutura}">¬</span>` + htmlResultado;

        return htmlResultado;

    }

   

    // =========================================================================

    // TRATAMENTO PARA PROPOSIÇÃO SIMPLES (CORREÇÃO DE EXIBIÇÃO DO SÍMBOLO ¬)

    // =========================================================================

    let p1 = pontos[id1];

   

    // Identifica se o ponto guardado no diagrama já está negado (ex: começou com ¬ no ID ou foi espelhado)

    let p1EstaNegado = id1.startsWith("¬") || (p1 && p1.fFalsaOrigem !== undefined && p1.negarGeralOrigem);

   

    // Formata o rótulo base da letra (ex: se id1 for "¬P", a base vira "p")

    let letraBaseP = id1.replace("¬", "").toLowerCase();

   

    // Monta o rótulo final do primeiro termo adicionando o ¬ se ele estiver negado

    let rotuloP = p1EstaNegado ? `¬${letraBaseP}` : letraBaseP;



    let opAtual = operacao;

    let negGeralAtual = negarGeral;

    let temConectivo = conectivoSelecionado;



    if(ordemCliques.length === 1){

        // CASO 1: Apenas 1 clique sem conectivo ativo (exibição simples)

        if(!temConectivo) {

            let pVal = getValorLogicoFatia(fatiaAtual);

            let valorFinal = pVal;

            if(negGeralAtual) valorFinal = !valorFinal;

           

            let corP = pVal ? corVerde : corVermelha;

            let corEstrutura = valorFinal ? corVerde : corVermelha;

           

            // Se o ponto individual já está negado no mapa, reflete no texto

            return `<span style="color:${corEstrutura}">${negGeralAtual ? '¬' : ''}</span><span style="color:${corP}">${rotuloP}</span><span style="color:${corEstrutura}"> = ${valorFinal ? 'V' : 'F'}</span>`;

        }



        // CASO 2: 1 clique + Conectivo Ativo (Auto-cruzamento: p vs p OU p vs ¬p)

        let valores = obterValoresUnarios(id1, fatiaAtual);

        let r = calcularOperacao(valores.valorA, valores.valorB, opAtual);

        if(negGeralAtual) r = !r;



        let corA = valores.valorA ? corVerde : corVermelha;

        let corB = valores.valorB ? corVerde : corVermelha;

        let corOp = r ? corVerde : corVermelha;

        let opSimbolo = mapaComposta[opAtual] || " ";



        // Regra essencial: Determina os termos baseado no botão de Negação Manual

        let termoA = rotuloP;

        let termoB = rotuloP;



        if (modoNegacaoManual) {

            // Se o botão "¬" está ativo no painel, o segundo termo ganha o ¬ obrigatoriamente

            // Se termoA já era "¬p", termoB vira "¬¬p" para clareza lógica, ou simplesmente aplica o inverso

            termoB = id1.startsWith("¬") ? letraBaseP : "¬" + rotuloP;

        } else if (id1.startsWith("¬")) {

            // Se o ponto já foi fixado como negado anteriormente, o auto-cruzamento padrão espelha a lógica

            termoA = rotuloP;

            termoB = rotuloP;

        }



        let str = `<span style="color:${corOp}">[</span><span style="color:${corA}">${termoA}</span><span style="color:${corOp}"> ${opSimbolo} </span><span style="color:${corB}">${termoB}</span><span style="color:${corOp}">] = ${r ? 'V' : 'F'}</span>`;

        if(negGeralAtual) str = `<span style="color:${corOp}">¬</span>` + str;

        return str;

    }



    // CASO 3: Dois cliques na tela operando entre si (ex: p e q)

    let id2 = ordemCliques[1];

    let p2 = pontos[id2];

    if (!p2) return "";



    // Identifica se o segundo ponto está negado

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



    // Retorna a expressão perfeita combinando os estados de negação individuais (ex: (¬p ∧ q) )

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

   

    // Tratamento dinâmico para compostas vindas do histórico

    if(pontos[id1].isCompostaHistorico) {

        let maxC = pontos[id1].c; // Camada externa (8)

        let minC = maxC - pontos[id1].camadasSubestrutura + 1; // Camada limite (7 se tiver subestrutura de 2 camadas)

       

        if(c >= minC && c <= maxC) {

            // Calcula dinamicamente se o cursor do mouse está na segunda camada (interna) da subestrutura

            let isSubCamadaInterna = (pontos[id1].camadasSubestrutura === 2 && c === (maxC - 1));

           

            // Renderiza passando a flag correta da subcamada baseada no trajeto do mouse

            tooltipExpressao.innerHTML = obterExpressaoHTMLColorida(f, isSubCamadaInterna ? 2 : 1, isSubCamadaInterna);

            tooltipExpressao.style.display = "block";

           

            let canvasBounding = document.querySelector("canvas").getBoundingClientRect();

            tooltipExpressao.style.left = `${window.scrollX + canvasBounding.left + mouseX + 15}px`;

            tooltipExpressao.style.top = `${window.scrollY + canvasBounding.top + mouseY + 15}px`;

        } else {

            tooltipExpressao.style.display = "none";

        }

        return;

    }



    // Tratamento padrão para proposições normais

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



    // BLOQUEIO VISUAL DO PREVIEW: Só renderiza o preview roxo se o alvo for estritamente a camada 8

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

   

    // BLOQUEIO LOGÍCO DE ENTRADA: Se o clique do aluno não for na camada 8, ignora o comando inteiramente

    if(c !== 8) return;



    let f = floor(((atan2(my, mx) + TWO_PI) % TWO_PI) / (TWO_PI / fatias));



    if(modoNegacaoManual){

        for(let id in pontos){

            let p = pontos[id];

            if(p.f === f && p.c === c){

                inverterPonto(id);

                atualizarCamadasPorProposicoesSimples(); // Recalcula ao inverter

                atualizarUI();

                return;

            }

        }

        return;

    }



    // Se clicar em cima de qualquer ponto existente (simples ou composta) na camada 8, remove ele

    for(let id in pontos){

        let p = pontos[id];

        if(p.f === f && p.c === c){

            delete pontos[id];

            ordemCliques = ordemCliques.filter(x => x !== id);

            if(ordemCliques.length === 0){

                camadaObrigatoria = -1;

                conectivoSelecionado = false;

                entradaAtiva = "P"; // reseta para um padrão

            }

            atualizarCamadasPorProposicoesSimples(); // Recalcula após remover

            atualizarUI();

            return;

        }

    }



    for(let id in pontos){

        let nomeBase = id.replace("¬", "");

        if(nomeBase === entradaAtiva) return;

    }



    if(ordemCliques.length === 0) {

        camadaObrigatoria = 8; // Sempre força fixar na camada 8 externa

    }

    if(ordemCliques.length === 1 && c !== camadaObrigatoria) return;

    if(ordemCliques.length >= 2) return;

    if(existeProposicaoNoQuadrante(f)) return;



    let label = entradaAtiva;

    pontos[label] = { f, c: camadaObrigatoria };

    ordemCliques.push(label);



    if(ordemCliques.length === 2) conectivoSelecionado = true;



    atualizarCamadasPorProposicoesSimples(); // Recalcula após inserir

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

    // BLOQUEIO 1: Impede o registro de proposição simples isolada
    if (ordemCliques.length === 1 && !pontos[id1].isCompostaHistorico && !conectivoSelecionado) {
        alert("Não é possível registrar uma proposição simples isolada. Ative um conectivo ou adicione outro termo.");
        return;
    }

    let fatiaBase = pontos[id1].f;
    let resultadoText = calcularValorSemanticoExpressao() ? "V" : "F";
   
    // CAPTURA CRÍTICA: Pegamos o texto limpo para validações e o HTML rico para a listagem visual
    let elementoDinamico = document.getElementById("expressao-dinamica");
    let rotuloTextoPuro = "Expressão";
    let exprHTML_Historico = "";

    if (elementoDinamico) {
        // Isola a parte da expressão antes do sinal de "="
        let partesHTML = elementoDinamico.innerHTML.split(/=\s*(?:<[^>]+>)*[VF]/i);
        exprHTML_Historico = partesHTML[0].replace(/^[A-Z]\.\s*/, '').trim();

        // Guarda a versão em texto puro apenas para o validador de repetição (evita quebrar o 'jaExiste')
        rotuloTextoPuro = elementoDinamico.innerText.split('=')[0].replace(/^[A-Z]\.\s*/, '').trim();
    } else {
        exprHTML_Historico = obterHTMLFormatadoParaHistorico();
        rotuloTextoPuro = exprHTML_Historico.replace(/<[^>]*>/g, '');
    }

    // BLOQUEIO 2: Evita repetições idênticas usando o texto puro estrutural
    let jaExiste = historicoResultados.some(item =>
        item.rotuloTextoPuro === rotuloTextoPuro && item.valorGlobal === resultadoText
    );

    if (jaExiste) {
        alert("Essa expressão já está registrada!");
        return;
    }

    let letraComposta = String.fromCharCode(65 + historicoResultados.length); // A, B, C...

    let novo = {
        numero: historicoResultados.length + 1,
        letra: letraComposta,
        rotuloTextoPuro: rotuloTextoPuro,
        rotuloOriginal: exprHTML_Historico, // Agora guarda o HTML colorido e exato da tela!
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
    item.style.cursor = "pointer";
    item.style.padding = "4px";
    item.style.borderBottom = "1px solid #333";
    
    // Renderiza o histórico aplicando a cor correta baseada no resultado V/F final do bloco
    let corResultado = resultadoText === "V" ? "#2ecc71" : "#e74c3c";
    item.innerHTML = `<b>${novo.letra}.</b> ${novo.textoHTML} = <b style="color:${corResultado}">${novo.valorGlobal}</b>`;
   
    item.addEventListener("click", () => {
        trazerCompostaParaDiagrama(novo);
    });

    let logArea = document.getElementById("log-area");
    if(logArea) logArea.appendChild(item);
}



function obterHTMLFormatadoParaHistorico() {
    let id1 = ordemCliques[0];
    let corVerde = "#2ecc71";
    let corVermelha = "#e74c3c";

    if (pontos[id1] && pontos[id1].isCompostaHistorico) {
        return pontos[id1].rotuloOriginal;
    }

    let mapa = { AND: "∧", OR: "∨", IF: "→", IFF: "↔", XOR: "⊻" };
    
    // 1. Se houver apenas 1 ponto clicado no diagrama
    if (ordemCliques.length === 1) {
        let p1EstaNegado = id1.startsWith("¬");
        let letraBaseP = id1.replace("¬", "").toLowerCase();
        let rotuloP = p1EstaNegado ? `¬${letraBaseP}` : letraBaseP;

        if (conectivoSelecionado) {
            let valores = obterValoresUnarios(id1, pontos[id1].f);
            
            // CRÍTICO: Ajusta os valores iniciais se a proposição base já veio com símbolo de negação
            let vA = p1EstaNegado ? !valores.valorA : valores.valorA;
            let vB = p1EstaNegado ? !valores.valorB : valores.valorB;
            
            // O modo de negação manual altera especificamente o segundo termo interno da operação unária
            if (modoNegacaoManual) {
                vB = !vB;
            }

            let rFinal = calcularOperacao(valores.valorA, valores.valorB, operacao);
            if (negarGeral) rFinal = !rFinal;

            let corEstrutura = rFinal ? corVerde : corVermelha;
            let corA = (negarGeral ? !vA : vA) ? corVerde : corVermelha;
            let corB = (negarGeral ? !vB : vB) ? corVerde : corVermelha;

            let termoA = rotuloP;
            let termoB = rotuloP;
            if (modoNegacaoManual) {
                termoB = id1.startsWith("¬") ? letraBaseP : "¬" + rotuloP;
            }

            let pSpan = `<span style="color:${corA}">${termoA}</span>`;
            let qSpan = `<span style="color:${corB}">${termoB}</span>`;
            let opSpan = `<span style="color:${corEstrutura}"> ${mapa[operacao]} </span>`;
            
            let htmlFormado = `<span style="color:${corEstrutura}">(</span>${pSpan}${opSpan}${qSpan}<span style="color:${corEstrutura}">)</span>`;
            
            if (negarGeral) {
                htmlFormado = `<span style="color:${corEstrutura}">¬</span>${htmlFormado}`;
            }
            return htmlFormado;
        } 
        else {
            let pVal = getValorLogicoFatia(pontos[id1].f);
            if (p1EstaNegado) pVal = !pVal;
            
            let valorFinal = pVal;
            if (negarGeral) valorFinal = !valorFinal;
            
            let corP = (negarGeral ? !pVal : pVal) ? corVerde : corVermelha;
            let corEstrutura = valorFinal ? corVerde : corVermelha;
            
            if (negarGeral) {
                return `<span style="color:${corEstrutura}">¬</span><span style="color:${corP}">${rotuloP}</span>`;
            }
            return `<span style="color:${corP}">${rotuloP}</span>`;
        }
    }

    // 2. Se forem dois pontos distintos operando entre si
    let id2 = ordemCliques[1];
    let p1 = pontos[id1];

    let p1EstaNegado = id1.startsWith("¬");
    let letraBaseP = id1.replace("¬", "").toLowerCase();
    let rotuloP = p1EstaNegado ? `¬${letraBaseP}` : letraBaseP;

    let p2EstaNegado = id2.startsWith("¬");
    let letraBaseQ = id2.replace("¬", "").toLowerCase();
    let rotuloQ = p2EstaNegado ? `¬${letraBaseQ}` : letraBaseQ;

    let isInterna = (p1.camada === 2 || p1.isSegundaCamadaInterna);

    let pVal = getValorLogicoFatia(p1.f);
    if (p1EstaNegado) pVal = !pVal;
    if (isInterna) pVal = !pVal;

    let qVal = getValorLogicoFatia(pontos[id2].f);
    if (p2EstaNegado) qVal = !qVal;

    let rFinal = calcularOperacao(pVal, qVal, operacao);
    if (negarGeral) rFinal = !rFinal;

    // Garante que as cores individuais das letras no span considerem as inversões locais das proposições
    let corEstrutura = rFinal ? corVerde : corVermelha; 
    let corP = (negarGeral ? !pVal : pVal) ? corVerde : corVermelha;          
    let corQ = (negarGeral ? !qVal : qVal) ? corVerde : corVermelha;

    let pSpan = `<span style="color:${corP}">${rotuloP}</span>`;
    let qSpan = `<span style="color:${corQ}">${rotuloQ}</span>`;
    let opSpan = `<span style="color:${corEstrutura}"> ${mapa[operacao]} </span>`;
    
    let htmlFormado = `<span style="color:${corEstrutura}">(</span>${pSpan}${opSpan}${qSpan}<span style="color:${corEstrutura}">)</span>`;
    
    if (negarGeral) {
        htmlFormado = `<span style="color:${corEstrutura}">¬</span>${htmlFormado}`;
    }
    
    return htmlFormado;
}



function configurarEventosHistorico() {

    let logArea = document.getElementById("log-area");

    if(!logArea) return;

    logArea.querySelectorAll(".log-item").forEach((item, index) => {

        item.style.cursor = "pointer";

        item.addEventListener("click", () => {

            if(historicoResultados[index]) {

                trazerCompostaParaDiagrama(historicoResultados[index]);

            }

        });

    });

}



function trazerCompostaParaDiagrama(infoComposta) {

    // Se já existirem 2 elementos no diagrama (sejam simples ou compostas), não permite adicionar mais

    if(ordemCliques.length >= 2) {

        alert("O diagrama já possui 2 elementos ativos. Remova um ou limpe o diagrama para operar.");

        return;

    }

   

    let alvoValorLogico = (infoComposta.valorGlobal === "V");

    let fatiaDestino = -1;

   

    // Procura uma fatia/quadrante disponível que corresponda ao valor lógico da expressão

    for(let f = 0; f < fatias; f++) {

        if(getValorLogicoFatia(f) === alvoValorLogico) {

            if(!existeProposicaoNoQuadrante(f)) {

                fatiaDestino = f;

                break;

            }

        }

    }

   

    if(fatiaDestino === -1) {

        alert("Não há quadrante vazio correspondente ao valor lógico desta proposição!");

        return;

    }

   

    let label = infoComposta.letra; // "A", "B", "C"...

   

    // Registra a composta no objeto de pontos exatamente na posição encontrada

    pontos[label] = {

        f: fatiaDestino,

        c: 8, // Sempre força o início na camada externa 8

        isCompostaHistorico: true,

        valorGlobalHistorico: infoComposta.valorGlobal,

        operacaoOrigem: infoComposta.operacaoOrigem,

        fFalsaOrigem: infoComposta.fFalsaOrigem,

        negarGeralOrigem: infoComposta.negarGeralOrigem,

        camadasSubestrutura: infoComposta.camadasSubestrutura,

        rotuloOriginal: infoComposta.rotuloOriginal

    };

   

    ordemCliques.push(label);

    camadaObrigatoria = 8;

   

    // === CORREÇÃO DO TRAVAMENTO DO BOTÃO NA UI ===

    if (infoComposta.operacaoOrigem) {

        operacao = infoComposta.operacaoOrigem;

    }

    if (infoComposta.negarGeralOrigem !== undefined) {

        negarGeral = infoComposta.negarGeralOrigem;

    }

   

    // Força o conectivo a ficar ativo para habilitar o auto-cruzamento visual imediato

    conectivoSelecionado = true;

   

    if(ordemCliques.length === 1) {

        entradaAtiva = label;

    }

   

    atualizarCamadasPorProposicoesSimples(); // Recalcula após trazer do histórico

    atualizarUI();

}



function windowResized(){

    let canvasSize = min(windowWidth - 30, 700);

    resizeCanvas(canvasSize, canvasSize);

    raioMax = (width / 2) * 0.85;

}



function calcularValorCompostaNaFatia(pontoComposta, fatia) {

    // Recupera os valores originais que formavam a composta nesta fatia específica

    let pVal = getValorLogicoFatia(pontoComposta.fFalsaOrigem);

   

    // Se a composta original tinha subcamadas (ex: inversões), preservamos a lógica original

    // Caso contrário, avaliamos o comportamento padrão P e Q na fatia atual

    let qVal = getValorLogicoFatia(fatia);

   

    let r = calcularOperacao(pVal, qVal, pontoComposta.operacaoOrigem);

    if (pontoComposta.negarGeralOrigem) r = !r;

    return r;

}



function atualizarCamadasPorProposicoesSimples() {

    if (!ordemCliques || ordemCliques.length === 0) {

        camadaObrigatoria = -1;

        return;

    }



    let unicas = new Set();



    ordemCliques.forEach(id => {

        let p = pontos[id];

        if (!p) return;



        let texto = "";



        if (p.isCompostaHistorico && p.rotuloOriginal) {



            texto = p.rotuloOriginal;



            texto = texto.replace(/<[^>]+>/g, " ");

            texto = texto.replace(/[∧∨→↔⊻¬()]/g, " ");



            let letras = texto.match(/[a-z]/gi);



            if (letras) {

                letras.forEach(letra => {

                    unicas.add(letra.toLowerCase());

                });

            }



        } else {



            let letra = String(id)

                .replace("¬", "")

                .trim()

                .toLowerCase();



            if (letra.length === 1) {

                unicas.add(letra);

            }

        }

    });



    let n = unicas.size;



    if (n < 2) n = 2;



    let resultadoCamadas = Math.pow(2, n - 1);



    console.log(

        "[DRAN]",

        "Variáveis:",

        Array.from(unicas),

        "Camadas:",

        resultadoCamadas

    );



    ordemCliques.forEach(id => {

        if (pontos[id]) {

            pontos[id].camadasSubestrutura = resultadoCamadas;

        }

    });



    // FORÇA A COMPOSTA A RECEBER O NÚMERO REAL DE CAMADAS

    ordemCliques.forEach(id => {

        let p = pontos[id];



        if (p && p.isCompostaHistorico) {

            p.camadasSubestrutura = resultadoCamadas;

        }

    });



    // IMPORTANTE:

    // quando existir uma composta e uma simples juntas,

    // a composta deve assumir a posição principal

    if (ordemCliques.length === 2) {



        let a = pontos[ordemCliques[0]];

        let b = pontos[ordemCliques[1]];



        if (

            a &&

            b &&

            !a.isCompostaHistorico &&

            b.isCompostaHistorico

        ) {

            let temp = ordemCliques[0];

            ordemCliques[0] = ordemCliques[1];

            ordemCliques[1] = temp;

        }

    }

} 

