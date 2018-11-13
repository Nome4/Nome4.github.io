// Fazer isso para a propriedade x das imagens funcionar

delete HTMLImageElement.prototype.x;
delete HTMLImageElement.prototype.y;


// Html's

const coracao=     document.querySelector("#coracao");
const wrapper=     document.querySelector("#jogo-wrapper"); // Pai do div principal (necessário para centralizá-lo)
const div=         document.querySelector("#jogo");         // Div principal
const divBattle=   document.querySelector("#batalha");
const spanHp=      document.querySelector("#vidaAtual");
const spanHpMax=   document.querySelector("#vidaMax");
const barraHp=     document.querySelector("#vida");
const divObsts=    document.querySelector("#obstaculos");
const balao=       document.querySelector("#balao");        // Balão de fala do boss
const opon=        document.querySelector("#oponente");
const bhpOpon=     document.querySelector("#vidaOpon");     // Barra HP oponente
const bhpOponCinza=document.querySelector("#barraOpon");    // Parte cinza da barra de HP
const divFF=       document.querySelector("#ff");
const spanFF=      document.querySelector("#multFF");       // Indicação da velocidade de passagem do tempo (FF = Fast Forward)
const meterDific=  document.querySelector("#meter");
if(imgOpon==undefined) imgOpon=document.querySelector("#imgOpon");

const tudo=document.querySelectorAll("#app *");
for(let i=0; i<tudo.length; i++){
  const objAttr=tudo[i].attributes;
  const objNovo=tudo[i].attrsInic=[];
  for(let j=0; j<objAttr.length; j++){
    objNovo[j]={
      name:objAttr[j].name,
      value:objAttr[j].value
    };
  }
}
let elsTemps=[];


// Relativas à luta

let larg,alt; // Largura e altura do div de batalha
let x,y,velX=0,velY=0,velRealX,velRealY,hpMax,hp,invul,xAnt,yAnt; // Variáveis relativas ao coraçãozinho
let direcaoHab,estaRapido;
let mult; /* Multiplicador da velocidade. Para torná-la constante, ela é dividida por Math.sqrt(2) quando o coração está
  movendo na diagonal. */
const hbc=6,roac=12; // hbc = hitbox do coração, roac = raio real
let premidas=[],tamPremidas=0; /* Guarda as teclas já apertadas, para ignorar novos eventos de aperto dela. Isso é necessário
  pois, se você segurar uma tecla por um tempo, o JavaScript começa a detectar vários eventos de click. */
let t,ronda,fase,emJogo,tFim,fases; // Relativas à fase
let dific,acelerando,incrDificSubito,incrDificGradual,dificUsuario;
let numObst,obsts;
let itens;
let multFF; /* Multiplicador da velocidade do jogo. Se a velocidade for normal é igual a 1. Menor que 1 o jogo fica mais lento
e maior fica mais rápido. */


// Relativas ao textinho pré-luta

let texto,textoAtual,txtDisponivel,pararTxt,pararJogo;


// Relativas à ação "fight"

const intv=300, // Intervalo médio entre as barrinhas
  qtd=4, // Num de barrinhas
  tt=intv*qtd, // Tempo total da ação fight
  espera=500; // Espera para a 1a barrinha surgir
const fadeDur=4*tt/19, // Duração da transição de visível para invisível das barrinhas
  fadeStart=15*tt/19; // Tempo para a barrinha ser considerada um "miss" e ter sua transição iniciada
const barraAtk=document.querySelector("#tiros"); // Div com as barrinhas brancas
const hpMaxOpon=700;
let hpOpon=hpMaxOpon;
let atkPlayer,velPlayer;

let tInic,tAtual;
let barraDano;  // Div com os efeitos de dano
let danoLuta;
let hits;
let acertou;
let timeoutFim;


// Responsa

/* Em vez de px, nessa página, usei a unidade "rem" (tamanho da fonte aplicado no elemento <html>) para poder aumentar e diminuir
o tamanho de tudo ao mesmo tempo mexendo somente no tamanho da fonte do <html> (pensando bem teria sido mais fácil se eu tivesse
usado transform...) */

let rem;
let html=document.documentElement,app=document.querySelector("#app");
const altApp=652/*app.offsetHeight*/,
  largApp=922/*app.offsetWidth*/;
  // Infelizmente temos que atualizar isso sempre que mudamos o layout.....
const lpaApp=largApp/altApp;

function autoSize(){
  let lpaW=innerWidth/innerHeight; // Largura por altura janela
  if(lpaW>=lpaApp){
    rem=innerHeight/altApp;
    html.style.fontSize=rem+"px";
  }
  else{
    rem=innerWidth/largApp;
    html.style.fontSize=rem+"px";
  }
}

autoSize();
addEventListener("resize",autoSize);


// Funções texto

function pararTexto(){ // Passa para a próxima fala do boss.
  txtDisponivel=true;
  clearInterval(pararTxt);
  textoAtual++;
}
function passarTexto(){ // Exibe a fala atual do boss.
  txtDisponivel=false;
  balao.innerHTML="";
  let pausa=0,i=0,tam=texto[textoAtual].length;
  let spansLetra=[];
  for(let j=0; j<tam; j++){
    spansLetra[j]=criarElEfemero("span");
    spansLetra[j].innerHTML=texto[textoAtual][j];
    balao.appendChild(spansLetra[j]);
  }

  clearInterval(pararTxt);
  pararTxt=setInterval(function () { // Mostra o texto letra por letra
    if(pausa===0){
      spansLetra[i].classList.add("letraVisivel");
      if(i==tam-1){
        pararTexto();
        return;
      } // Se for pontuação dá uma pausa:
      else{
        const ch=texto[textoAtual][i];
        if(ch==","||(ch=="."&&texto[textoAtual][i+1]!=".")||ch=="!"||ch=="?"||ch==":"){
          pausa=5;
        }
      }
      i++;
    }
    else{
      pausa--;
    }
  }, 33); // Cada letra demora 33ms para ser exibida
}


// Funções do jogo

function atualizarPosCor(){ // ATUALIZAR POSição do CORação
  coracao.style.left=x+"rem";
  coracao.style.top=y+"rem";
}

function criarElEfemero(tag="div"){
  const el=document.createElement(tag);
  elsTemps.push(el);
  return el;
}
function removerElEfemero(){
  el.remove();
  elsTemps.splice(elsTemps.indexOf(el),1);
}

function resetRonda(){
  ronda++;
  fase++;
  if(fase>=fases.length){
    fase=0;
    embaralhar(fases);
    acelerando=true;
    dific+=incrDificSubito-incrDificGradual;
  }
  emJogo=-1;
  obsts=[];
  invul=0;
  textoAtual=0;
  numObst=0;
  multFF=1;
  estaRapido=false;
  divBattle.classList.remove("visivel");

  t=0;
  funcFrameAntes=funcFrameDepois=undefined;
  numPlats=numChaves=chavesObtidas=0;

  if(ronda>0){
    if(acelerando){
      dific+=incrDificGradual;
    }
    divFF.className="";

    div.classList.add("hasTransition");
    div.style.width=div.style.height="";
    clearInterval(pararJogo);
    divObsts.innerHTML="";
    coracaoErrante.classList.remove("pseudoOculto");
    coracao.classList.remove("pseudoOculto");

    setTimeout(function () {
      div.classList.remove("hasTransition");
      mudarDivId("ane");
    },500);
  }
}


let roaxo,roayo,cox,coy,dx,ccy,ccx; // Variáveis hitbox

let funcFrameAntes,funcFrameDepois;
let numPlats,numChaves;
let multDific;
let chavesObtidas;

function preencherComObj(len,tag="div"){ // Cria "len" divs e os coloca no vetor de obstáculos
  let ret=numObst;
  for(let i=numObst; i<numObst+len; i++){
    obsts[i]=criarElEfemero(tag);
  }
  numObst+=len;
  return ret;
}


// Funções hitbox

function pitagoras(cat1,cat2){
  return Math.sqrt(cat1*cat1+cat2*cat2);
}
function getRaioObst(ob){
  roaxo=ob.widthRem/2;
  roayo=ob.heightRem/2;
  // Distância no eixo x/y da borda do obstáculo até seu centro
}
function getDists(ob){
  cox=ob.posX+roaxo;
  coy=ob.posY+roayo;
  // Coordenadas do centro do obstáculo

  dx=Math.abs(ccx-cox);
  dy=Math.abs(ccy-coy);
  // Distância entre centros do coração e obstáculo
}
function getTudo(ob){
  getRaioObst(ob);
  getDists(ob);
}
function quadradoSemGet(){
  return (dy<=roayo&&dx<=roaxo+hbc)||(dx<=roaxo&&dy<=roayo+hbc);
}
function quadrado(){ // this = obstáculo
  getTudo(this);
  return quadradoSemGet();
}


// Obsts gerais

function atualizaPosX(obs,val=obs.x){
  obs.style.left=(obs.posX=val)+"rem";
}
function atualizaPosY(obs,val=obs.y){
  obs.style.top=(obs.posY=val)+"rem";
}
function atualizaPosXGiro(obs,o){
  if(o.girar270){
    atualizaPosY(obs,obs.x);
  }
  else{
    atualizaPosX(obs,obs.x);
  }
}
function atualizaPosYGiro(obs,o){
  if(o.girar270){
    atualizaPosX(obs,obs.y);
  }
  else{
    atualizaPosY(obs,obs.y);
  }
}
function atualizaPosGiro(obs,o){
  atualizaPosXGiro(obs,o);
  atualizaPosYGiro(obs,o);
}
function atualizaPosNormal(obs){
  atualizaPosX(obs,obs.x);
  atualizaPosY(obs,obs.y);
}
function resizeX(obs,val){
  obs.style.width=(obs.widthRem=val)+"rem";
}
function resizeY(obs,val){
  obs.style.height=(obs.heightRem=val)+"rem";
}

function obstGenerico(o,funcApar,funcMov){
  o.velX*=multDific;
  o.velY*=multDific;
  o.tSurg/=multDific;
  /*
    Cria um obstáculo retangular sem nada especial.
    Recebe a função executada por esse obstáculo quando ele surge, a função que determina seu movimento,
    e um objeto com as propriedades:
      - tSurg: Frame no qual o obstáculo aparece, e será executada sua "funcApar".
      - cor: "laranja", "azul" ou "branco"
      - x, y: Coordenadas iniciais
      - velX, velY: Movimento por frame (pode ser negativo)
      - larg, alt: Largura, altura
  */

  let el=criarElEfemero("div");
  el.hitbox=quadrado;
  el.dano=o.dano==undefined? 9: o.dano;
  el.invul=o.invul==undefined? 100: o.invul;
  resizeX(el,o.larg);
  resizeY(el,o.alt);
  el.className=o.cor;
  el.tSurg=o.tSurg;
  obsts[numObst++]=el;

  if(funcApar==undefined){ // funcApar padrão, se nenhuma for passada
    funcApar=function () {
      el.x=o.x;
      el.y=o.y;
      atualizaPosNormal(el);
    }
  }
  if(funcMov==undefined){ // funcMov padrão
    funcMov=function () {
      el.x+=o.velX;
      el.y+=o.velY;
      atualizaPosNormal(el);
    }
  }

  el.funcApar=function () {
    funcApar(el,o);
  }

  el.funcMov=function () {
    funcMov(el,o);
  }
}

function embaralhar(v) { // Embrarlha vetor
  for (let i = v.length-1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = v[i];
    v[i] = v[j];
    v[j] = temp;
  }
}
function atualizaFF(x){ // Muda o valor de multFF (velocidade do jogo)
  multFF=x;
  spanFF.innerHTML=x;
  if(x>=64){
    estaRapido=true;
  }
}
function sinalAleatorio(x){ // Retorna X com um sinal aleatório
  return Math.random()>0.5? x: -x;
}
function setMultDific(aum,dim=aum){
  const m=dific*dificUsuario;
  multDific=1+((m-1)*(m>1? aum: dim));
}


// Lasers!

const pares1=[
  [resizeX,resizeY],
  [atualizaPosY,atualizaPosX]
];
const pares2=[
  [resizeY,resizeX],
  [atualizaPosX,atualizaPosY]
];

function l(altObj,velX,velY,tSurg,cores,girar270=false,toler=120,compr,passouX=0){
  // Cria objeto com os parâmetros para a função laserColorido
  return{
    altObj:altObj,
    velX:velX,
    velY:velY,
    tSurg:tSurg,
    cores:cores,
    girar270:girar270,
    toler:toler,
    compr:compr,
    passouX:passouX
  };
}


function laserColorido(o,funcCria){
  o.velY*=multDific;
  o.velX*=multDific;
  o.tSurg/=multDific;
  /*
    Cria um obstáculo com várias cores que vão se alternando.
    Parâmetros:
      - o: objeto com seguintes propriedades:
        - cores: Vetor com qualquer combinação entre as strings "branco", "azul" e "laranja".
        - altObj: Espessura do laser.
        - toler: Distância da zona de batalha que o laser vai estar quando surgir.
        - compr: Comprimento do laser. Se não for passado é toda a largura ou altura da zona de batalha (dependendo do parâmetro girar270)
        - velX: Movimento por frame das partes coloridas do laser no eixo paralelo ao de movimento do laser. Pode ser negativo.
        - passouX: Deslocamento inicial. estritamente positivo
        - velY: Movimento por frame no eixo de movimento do laser. Se negativo, o laser surge em baixo da zona de batalha; se positivo, em cima.
        - tSurg: Já expliquei.
        - girar270: se verdadeiro, torna o eixo de movimento do laser o X em vez do Y, girando-o 270 graus no sentido horário.
     - funcCria: função extra que será executada quando der a hora do laser surgir.
  */
  o.numCores=o.cores.length;
  o.numObstAnt=preencherComObj(o.numCores*2);

  if(o.altObj==undefined) o.altObj=6;
  if(o.passouX==undefined) o.passouX=0;

  for(let i=0; i<o.numCores*2; i++){


    // Fixos

    let a=obsts[i+o.numObstAnt];
    a.hitbox=quadrado;
    a.invul=100;
    a.tSurg=o.tSurg;

    a.funcApar=function () {


      // Comuns a todos

      if(i==0){
        if(funcCria) funcCria(o);

        if(o.girar270){
          o.pares=pares2;
          if(o.compr==undefined){
            o.compr=alt;
            o.deslocX=0;
          }
          else{
            o.deslocX=alt-o.compr/2;
          }
        }
        else{
          o.pares=pares1;
          if(o.compr==undefined){
            o.compr=larg;
            o.deslocX=0;
          }
          else{
            o.deslocX=larg-o.compr/2;
          }
        }

        o.largCada=o.compr/o.numCores;
      }

      a.classList.add(o.cores[i%o.numCores]);
      o.pares[0][1](a,o.altObj);
      o.pares[0][0](a,o.largCada);


      // Eixo de movimento do laser

      a.y=o.toler-o.altObj/2;
      if(o.velY>0){
        a.y*=-1;
      }
      else{
        a.y+=(o.girar270? larg: alt);
      }


      // Eixo de movimento das cores

      if(o.velX>0){
        if(i<o.numCores-1 || (i==o.numCores-1 && o.passouX==0)){
          a.x=o.largCada*(i-(o.numCores-1))+o.passouX;
          a.larg=0;
          o.pares[0][0](a,0);
          a.dano=0;
        }
        else{
          if(i==o.numCores-1){
            a.larg=o.passouX;
            a.x=o.largCada*(i-(o.numCores-1))+o.passouX-a.larg;
          }
          else{
            if(i==o.numCores*2-1 && o.passouX!=0){
              a.larg=o.largCada-o.passouX;
              a.x=o.compr-a.larg;
            }
            else{
              a.larg=o.largCada;
              a.x=o.largCada*(i-(o.numCores-1))+o.passouX-a.larg;
            }
          }

          o.pares[0][0](a,a.larg);
          a.dano=9;
        }
      }


      else{
        if(i<o.numCores-1 || (i==o.numCores-1 && o.passouX==0)){
          a.x=o.largCada*(-i+(o.numCores-1))-o.passouX+o.compr;
          a.larg=0;
          o.pares[0][0](a,0);
          a.dano=0;
        }
        else{
          if(i==o.numCores-1){
            a.larg=o.passouX;
            a.x=o.largCada*(i-(o.numCores-1))-o.passouX+o.compr;
          }
          else{
            if(i==o.numCores*2-1 && o.passouX!=0){
              a.larg=o.largCada-o.passouX;
              a.x=0;
            }
            else{
              a.larg=o.largCada;
              a.x=o.largCada*(-i+(o.numCores-1))-o.passouX+o.compr;
            }
          }

          o.pares[0][0](a,a.larg);
          a.dano=9;
        }
      }

      o.pares[1][1](a,a.x+o.deslocX);
      o.pares[1][0](a,a.y);
    };

    a.funcMov=function () {
      if(o.velX>0){ // Eixo X
        if(a.x>=(o.numCores-1)*o.largCada){
          if(a.larg>0){
            a.larg-=o.velX;
            a.x+=o.velX;
          }
          else{
            o.pares[0][0](a,0);
            a.x=-(o.numCores-1)*o.largCada+a.x%o.largCada;
            // isso ta meio esquisito mas ok
            a.dano=0;
          }
        }
        else if(a.x<=0&&a.x>-o.velX&&a.larg<o.largCada){
          a.larg+=o.velX;
          a.dano=9;
        }
        else{
          a.x+=o.velX;
        }
      }

      else{
        if(a.x<=0){
          if(a.larg>0){
            a.larg+=o.velX;
          }
          else{
            o.pares[0][0](a,0);
            a.x=(o.numCores*2-1)*o.largCada+o.velX;
            a.larg=0;
            a.dano=0;
          }
        }
        else if(a.x<=o.compr&&a.larg<o.largCada){
          a.larg-=o.velX;
          a.dano=9;
          a.x+=o.velX;
        }
        else{
          a.x+=o.velX;
        }
      }


      a.y+=o.velY; // Eixo Y

      if(o.velY>0){
        if(a.y>120+o.altObj/2+larg){
          a.classList.remove("visivel");
        }
      }
      else{
        if(a.y<-120+o.altObj/2){
          a.classList.remove("visivel");
        }
      }

      if(a.larg){
        o.pares[1][1](a,a.x+o.deslocX);
        o.pares[1][0](a,a.y);
        o.pares[0][0](a,a.larg);
      }
    }
  }
}

function laserMonocor(o,funcCria){
  o.velX*=multDific;
  o.velY*=multDific;
  o.tSurg/=multDific;

  let el=criarElEfemero("div");
  obsts[numObst++]=el;

  el.hitbox=quadrado;
  el.dano=9;
  el.invul=100;
  el.tSurg=o.tSurg;

  el.funcApar=function () {

    if(funcCria) funcCria(o);

    if(o.altObj==undefined) o.altObj=6;

    if(o.girar270){
      o.pares=pares2;
      if(o.compr==undefined){
        o.compr=alt;
      }
    }
    else{
      o.pares=pares1;
      if(o.compr==undefined){
        o.compr=larg;
      }
    }

    el.classList.add(o.cor);
    o.pares[0][1](el,o.altObj);
    o.pares[0][0](el,o.compr);


    // Eixo de movimento do laser

    el.y=o.toler-o.altObj/2;
    if(o.velY>0){
      el.y*=-1;
    }
    else{
      el.y+=(o.girar270? larg: alt);
    }

    o.pares[1][1](el,0);
    o.pares[1][0](el,el.y);
  };

  el.funcMov=function () {
    el.y+=o.velY*multFF; // Eixo Y

    if(o.velY>0){
      if(el.y>120+o.altObj/2+larg){
        el.classList.remove("visivel");
      }
    }
    else{
      if(el.y<-120+o.altObj/2){
        el.classList.remove("visivel");
      }
    }

    o.pares[1][0](el,el.y);
  }
}


// Caixas!

const tamCaixa=40;

function caixa(o,funcCria){
  /*
    Basicamente um obstáculo genérico, mas já vem com alguns estilos e propriedades predefinidas.
    Acho que nada aqui vai ser útil pra você.
  */
  o.velY*=multDific;
  o.tSurg/=multDific;

  let el=criarElEfemero("div");
  el.hitbox=quadrado;
  el.dano=9;
  el.invul=100;
  el.className=o.semBuraco? o.cor: "caixaComBuraco "+o.cor;
  el.tSurg=o.tSurg;
  obsts[numObst++]=el;

  el.funcApar=function () {
    if(funcCria){
      funcCria(o);
    }

    o.larg=o.larg||tamCaixa;
    resizeX(el,o.larg);
    resizeY(el,o.larg);

    el.x=o.deslocX;
    if(o.velY*multFF<0){
      el.y=larg+o.toler;
    }
    else{
      el.y=-o.toler-o.larg;
    }
    atualizaPosGiro(el,o);
  };

  el.funcMov=function () {
    if(!o.nSome){
      const cond=o.velY>0;
      if(cond && el.y>larg+o.toler || !cond && el.y<-o.toler-o.larg){
        el.classList.remove("visivel");
      }
    }
    el.y+=o.velY*multFF;
    atualizaPosYGiro(el,o);
  };
}


// Plataformas!

const largPlat=40,altPlat=6;

function plataforma(o){
  /*
    Cria um obstáculo que não dá dano mas não é atravessável. Parâmetros:
    - o: Objeto com seguintes propriedades:
      - larg, alt, x, y: Óbvios
      - girar270: Se verdadeiro, troca largura por altura
  */
  let el=criarElEfemero("div");
  el.hitbox=quadrado;
  el.dano=0;
  el.invul=0;
  el.tSurg=0;
  el.className="plataforma";
  obsts[numObst++]=el;

  el.funcApar=function () {
    el.larg=o.girar270? altPlat: o.larg;
    el.alt=o.girar270? o.larg: altPlat;
    resizeX(el,el.larg);
    resizeY(el,el.alt);
    el.x=o.x;
    el.y=o.y;
    atualizaPosX(el,el.x);
    atualizaPosY(el,el.y);
  };

  el.funcMov=function(){};
}

function criarPlat(x,y,girou,larg=largPlat){
  plataforma({
    x: x-(girou? altPlat/2: 0),
    y:y-(girou? 0: altPlat/2),
    girar270:girou,
    larg:larg
  });
  numPlats++;
}

function ffaPlat(){
  /*
    Se estiver usando plataformas, a variável funcFrameAntes, que é uma função que é executada antes do movimento em cada
    frame, deve ser essa. Ela guarda a posição do coração anterior, que é necessária para a próxima função.
  */
  xAnt=x;
  yAnt=y;
}

function ffdPlat(start=0){
  /*
    Se estiver usando plataformas, a variável funcFrameDepois, que é uma função que é executada depois do movimento em cada
    frame, deve ser essa. Ela não deixa o coração atravessar plataformas.
  */
  for(let i=start; i<numPlats+start; i++){
    const el=obsts[i];

    for(let k=0; k<2; k++){
      let eixoPara,eixoMov,areaCol,espessura,coordMovAnt,coordParaAnt,coordMov,coordPara;

      if(k==1){
        if(velY==0) continue;
        eixoPara="x";
        eixoMov="y";
        areaCol="larg";
        espessura="alt";
        coordMov=y;
        coordPara=x;
        coordMovAnt=yAnt;
        coordParaAnt=xAnt;
      }
      else{
        if(velX==0) continue;
        eixoPara="y";
        eixoMov="x";
        areaCol="alt";
        espessura="larg";
        coordMov=x;
        coordPara=y;
        coordMovAnt=xAnt;
        coordParaAnt=yAnt;
      }

      // Tecnicamente a hitbox do coração é um círculo mas dane-se

      for(let j=0; j<2; j++){
        let coordMovCol,cond,coordParaCol;

        if(j==1){
          coordMovCol=el[eixoMov]+el[espessura];
          cond=coordMov<coordMovCol && coordMovAnt>=coordMovCol;
        }
        else{
          coordMovCol=el[eixoMov]-roac*2;
          cond=coordMov>coordMovCol && coordMovAnt<=coordMovCol;
        }

        if(cond && function(){
          coordParaCol=coordParaAnt+(coordPara-coordParaAnt)*((coordMovAnt-coordMovCol)/(coordMovAnt-coordMov));
          return coordParaCol>el[eixoPara]-2*roac && coordParaCol<el[eixoPara]+el[areaCol];
        }()){
          /*if(k==1){
            x=coordParaCol;
          }
          else{
            y=coordParaCol;
          }*/

          if(k==1){
            y=coordMovCol;
            if(y==yAnt) velRealY=0;
          }
          else{
            x=coordMovCol;
            if(x==xAnt) velRealX=0;
          }
        }
      }
    }
  }
}

function ffdChave(start){
  for(let i=start; i<start+numChaves; i++){
    let el=obsts[i];
    if(!el.classList.contains("visivel")){
      continue;
    }

    for(let k=0; k<2; k++){
      let eixoMov,areaCol,coordMovAnt,coordMov;

      if(k==1){
        if(velY==0) continue;
        eixoMov="y";
        eixoPara="x";
        areaCol="offsetWidth";
        espessura="offsetHeight";
        coordMov=y;
        coordMovAnt=yAnt;
        coordPara=x;
        coordParaAnt=xAnt;
      }
      else{
        if(velX==0) continue;
        eixoMov="x";
        eixoPara="y";
        areaCol="offsetHeight";
        espessura="offsetWidth";
        coordMov=x;
        coordMovAnt=xAnt;
        coordPara=y;
        coordParaAnt=yAnt;
      }

      // Tecnicamente a hitbox do coração é um círculo mas dane-se

      for(let j=0; j<2; j++){
        let coordMovCol,cond;

        if(j==1){
          coordMovCol=el[eixoMov]+el[espessura];
          cond=coordMov<coordMovCol && coordMovAnt>=coordMovCol;
        }
        else{
          coordMovCol=el[eixoMov]-roac*2;
          cond=coordMov>coordMovCol && coordMovAnt<=coordMovCol;
        }

        if(cond && function(){
          const coordParaCol=coordParaAnt+(coordPara-coordParaAnt)*((coordMovAnt-coordMovCol)/(coordMovAnt-coordMov));
          return coordParaCol>el[eixoPara]-2*roac && coordParaCol<el[eixoPara]+el[areaCol];
        }()){
          el.classList.remove("visivel");
          chavesObtidas++;
          if(chavesObtidas==numChaves){
            tFim=t+40*multFF;
          }
        }
      }
    }
  }
}


// Laser grosso

const largLaser=40;
const comprBoca=60;
const altBoca=comprBoca*(527/401); // Resolução da img
const toler=60;
const overlap=10;

function gaster(o,funcCria){
  /*
    Laser branco grosso lançado por aquela boca estranha. Muito específico logo acho que você não vai achar útil também
  */
  o.tSurg/=multDific;
  o.tAviso/=multDific;
  let pla,plab;

  const aviso=criarElEfemero("img");
  resizeX(aviso,comprBoca);
  aviso.dano=0;
  aviso.tSurg=o.tSurg*multFF;
  obsts[numObst++]=aviso;

  const el=criarElEfemero("div");
  el.hitbox=quadrado;
  if(o.tAtk==undefined) o.tAtk=50;
  if(o.invul==undefined) o.invul=5;
  if(o.dano==undefined) o.dano=1;
  el.tSurg=(o.tSurg+o.tAviso)*multFF;
  obsts[numObst++]=el;

  o.tAtk/=multDific;
  o.invul/=multDific;

  let transform;
  let transformStr;
  let tDec;
  const durTrans=10,deslocTrans=24;
  let aoContr;

  aviso.funcApar=function () {
    if(funcCria) funcCria(o);
    aoContr=multFF<=0;

    aviso.src=aoContr? "laser-grosso-ativo.png": "laser-grosso.png";
    triggered=false;
    transform=0;
    tDec=0;

    if(o.girar270){
      pla=[resizeY,resizeX];
      plab=[altBoca,comprBoca];
    }
    else{
      pla=[resizeX,resizeY];
      plab=[comprBoca,altBoca];
    }

    // Toler: Negativo = embaixo, positivo = em cima
    let rotacao=0;
    if(o.girar180==false){
      aviso.y=-(toler+(comprBoca+altBoca+(o.girar270? -overlap: overlap))/2);
      // Não sei porque essa conta aí mas funcionou
    }
    else{
      aviso.y=(o.girar270? larg: alt)+toler-(comprBoca-altBoca-(o.girar270? -overlap: -3*overlap))/2; // Idem
      // Porque -3? Sei lá ;-;
      rotacao+=180;
    }

    if(o.girar270){
      rotacao+=270;
    }

    aviso.x=o.x-(plab[0]-largLaser)/2;
    transformStr="rotate("+rotacao+"deg)"+" translateY(-";
    aviso.style.transform=transformStr+(aoContr? "": deslocTrans+"rem)")+(aoContr? " scale(0.94)": "");

    atualizaPosGiro(aviso,o);
  }

  aviso.funcMov=function () {
    if(!aoContr){
      if(tDec<durTrans){
        tDec++;
        aviso.style.transform=transformStr+((durTrans-tDec)/durTrans*deslocTrans)+"rem)";
      }
    }
    else{
      tDec++;
      if(tDec>o.tAviso){
        if(tDec>=o.tAviso+10){
          aviso.classList.remove("visivel");
        }
        else{
          aviso.style.transform=transformStr+((tDec-o.tAviso)/durTrans*deslocTrans)+"rem)";
        }
      }
      else if(tDec>=o.tAtk){
        aviso.src="laser-grosso.png";
      }
    }
  }


  el.funcApar=function () {
    el.x=o.x;
    el.y=-toler;
    pla[1](el,larg+2*toler);
    pla[0](el,largLaser);
    el.className="gasterLaser branco";
    el.dano=o.dano;
    el.invul=o.invul;
    aoContr=multFF<=0;

    if(o.girar270){
      el.classList.add("girar270");
    }
    else{
      el.classList.add("nao");
    }
    el.style.animationDuration=o.tAtk*10+100+"ms";
    atualizaPosGiro(el,o);

    if(!aoContr){
      aviso.src="laser-grosso-ativo.png";
      aviso.style.transform+=" scale(0.94)";
    }
    else{
      el.classList.add("reverso");
      aviso.funcApar();
      aviso.classList.add("visivel");
      aviso.apareceu=true;
      tDec=0;
    }
  }

  el.funcMov=function () {
    if((t-el.tSurg)/multFF>=o.tAtk){
      el.dano=0;
      setTimeout(function () {
        el.className="";
      },100);
      if(!aoContr){
        aviso.classList.remove("visivel");
      }
    }
  }
}


// Caixa com buraco grande

const tTrans=50;

function configuraCxGrande(o){
  let el=criarElEfemero("div");
  el.className="caixaPseudoBuraco azul";
  el.tam=o.tam;
  resizeX(el,o.tam);
  resizeY(el,o.tam);
  el.tSurg=o.tSurg=o.tSurg || 0;
  el.dano=9;
  el.invul=100;
  el.hitbox=function () {
    roayo=el.tam/2;
    roaxo=roayo;
    getDists(el);
    const raioInterno=(el.tam/Math.sqrt(2)-roac-hbc)/2;
    return quadradoSemGet() && pitagoras(dx,dy)>=raioInterno;
  }
  obsts[numObst++]=el;
  return el;
}

function configuraFundo(o){
  let fundo=criarElEfemero("div");
  fundo.className="branco";
  resizeX(fundo,larg);
  resizeY(fundo,alt);
  atualizaPosX(fundo,0);
  atualizaPosY(fundo,0);
  fundo.invul=100;
  const ant=numObst+1;
  fundo.hitbox=function () {
    roayo=obsts[ant].tam/2;
    roaxo=roayo;
    getDists(obsts[ant]);
    roayo-=roac;
    roaxo-=roac;
    return !quadradoSemGet();
  }
  fundo.funcMov=function(){};
  obsts[numObst++]=fundo;
  return fundo;
}

function caixaGrandeCPrevia(o,script,funcReset){
  // Fundo e el tem que ser nessa ordem
  let fundo=configuraFundo(o);
  let el=configuraCxGrande(o);

  fundo.classList.add("fundoFade");
  fundo.tSurg=100000;
  fundo.funcApar=function(){
    setTimeout(function () {
      fundo.dano=9;
    },500);
  };

  function surgir(){
    el.x=o.x;
    el.y=o.y;
    atualizaPosNormal(el);
    script.passo=0;
    if(funcReset) funcReset();
  }

  el.funcApar=function () {
    if(o.x==undefined) o.x=(larg-el.tam)/2;
    if(o.y==undefined) o.y=(alt-el.tam)/2;
    surgir();
  };

  let nAtivou=true;

  el.funcMov=function () {
    if(t<=o.tRep+o.tSurg){
      script(t-o.tSurg,el,o);
    }
    else{
      if(nAtivou){
        multFF=0;
        fundo.classList.add("visivel");
        nAtivou=false;
        pode=false;

        x=larg/2-roac;
        y=alt/2-roac;
        coracao.style.transition=el.style.transition="left 500ms linear, top 500ms linear";
        void coracao.offsetHeight; // Reflow

        setTimeout(function () {
          multFF=1;
          coracao.style.transition=el.style.transition="";
        },500);

        atualizarPosCor();
        surgir();
      }
      else{
        if(t>=2*o.tRep+o.tSurg+tTrans){
          fundo.classList.remove("visivel");
          el.classList.remove("visivel");
        }
        else if(t>=o.tRep+tTrans+o.tSurg){
          script(t-o.tSurg-o.tRep-tTrans,el,o);
        }
      }
    }
  };
}


function caixaGrande(o,script){
  let fundo=configuraFundo(o);
  let el=configuraCxGrande(o);

  fundo.funcApar=function(){};
  fundo.tSurg=o.tSurg;
  fundo.dano=9;

  el.funcApar=function () {
    if(o.x==undefined) o.x=(larg-el.tam)/2;
    if(o.y==undefined) o.y=(alt-el.tam)/2;
    el.x=o.x;
    el.y=o.y;
    atualizaPosNormal(el);
  };

  el.funcMov=function () {
    script(t-o.tSurg,el,o);
  }
}


const largChave=24;

function chave(o){
  let el=criarElEfemero("img");
  obsts[numObst++]=el;
  el.src="chave.png";
  el.dano=0;
  el.tSurg=0;
  el.hitbox=1;
  resizeX(el,largChave);
  el.className="chave";

  el.funcApar=function () {
    el.x=o.x;
    el.y=o.y;
    atualizaPosNormal(el);
  }

  el.funcMov=function () {}
}

function criarChave(x,y){
  chave({
    x:x,
    y:y
  });
  numChaves++;
}


function keyup(e){
  // Reverte mudanças na velocidade quando solta tecla
  if(e.which<=40&&e.which>=37){ // Se não for setinha, ignorar
    tamPremidas--;
    for(let i=0; i<=tamPremidas; i++){
      if(e.which==premidas[i]){
        let ret=premidas[tamPremidas];
        premidas[i]=ret;
        premidas.pop();
        break;
      }
    }
    mudaVel(e.which,-1);
  }
}

function keydown(e){
  function prepararFase(fDepois){
    if(hpOpon<=0){
      ronda=-1;
      alt=240;
      larg=240;
    }
    else{
      larg=fases[fase].larg;
      alt=fases[fase].alt;
    }

    if(alt>240){
      div.classList.add("overflow");
    }
    else{
      div.classList.remove("overflow");
    }

    div.classList.add("hasTransition");
    div.style.width=larg+"rem";
    div.style.height=alt+"rem";
    emJogo=-4;

    // Colocar no vetor "texto" strings com a fala desejada do boss, de acordo com a rodada.
    if(ronda==-1){
      texto=["Não gosto de clichês, mas, obviamente, agora vai ser o ataque mais difícil.",
      "Sobrecarregando armas, iniciando sequência de autodestruição..."];
    }
    else if(ronda==fases.length){
      texto=["Acabaram as fases. Agora vai repetir tudo de novo...",
      "Só que mais rápido, é claro."];
    }

    setTimeout(function () {
      inicRonda();
      if(fDepois) fDepois();
      div.classList.remove("hasTransition");
    },500);
  }


  // Fim da luta

  function finalizarFight(){
    // Cria elemento que indica o dano causado
    let toma=criarElEfemero("span");
    toma.innerHTML=acertou? Math.round(danoLuta): "MISS";
    opon.appendChild(toma);
    toma.className="spanFight "+(acertou? "hit": "miss");
    toma.style.top=(opon.offsetHeight-toma.offsetHeight)/2+"rem";

    setTimeout(function () {
      barraAtk.innerHTML="";
      divAtual.style.transform="scale(0)";
      divAtual.classList.add("pseudoOculto");

      prepararFase(function () {
        divAtual.classList.remove("pseudoOculto");
        divAtual.style.transform="";
        divAtual.classList.remove("visivel");
        toma.remove();
      });
    },1000);

    if(acertou){
      // Dano no boss
      hpOpon-=danoLuta;
      bhpOponCinza.classList.remove("pseudoOculto");
      bhpOpon.style.left=-(1- hpOpon/hpMaxOpon) *100+"%";
      imgOpon.style.animation="shake 1s linear 0s 1";

      setTimeout(function () {
        bhpOponCinza.classList.add("pseudoOculto");
        imgOpon.style.animation="";
      },tt);
    }
  }


  // Ignorar evento em teclas já abaixadas

  if(e.which<=40&&e.which>=37){
    for(let i=0; i<tamPremidas; i++){
      if(e.which==premidas[i]) return;
    }
    premidas.push(e.which);
    tamPremidas++;
    mudaVel(e.which,1);
  }


  /* Navegação */

  if(emJogo==-1){
    if(e.which<=40&&e.which>=37){ // Moveu
      function eListaDupla(){
        return divAtual.childNodes[1].classList.contains("dlpl");
      }

      if(vetorAtual==botoes){
        if(e.which==38){
          const len=lis[idxDiva].length;
          if(len){
            if(eListaDupla()){
              let indEsq,indDir;
              if(len%2==1){
                indEsq=len-1;
                indDir=len-2;
              }
              else{
                indEsq=len-2;
                indDir=len-1;
              }

              if(idxEla<=1){
                moverCoracao(lis[idxDiva],indEsq);
              }
              else{
                moverCoracao(lis[idxDiva],indDir);
              }
            }

            else{
              moverCoracao(lis[idxDiva],len-1);
            }
          }
        }

        else if(e.which==37){
          if(idxEla!=0) moverCoracao(botoes,idxEla-1);
        }
        else if(e.which==39){
          if(idxEla!=botoes.length-1) moverCoracao(botoes,idxEla+1);
        }
      }
      else{
        const eListaDuplaRet=eListaDupla();
        const idxElaEPar=idxEla%2==0;
        let limite=eListaDuplaRet? 2: 1;

        if(e.which==40){
          const novoInd=idxEla+limite;
          if(novoInd>=vetorAtual.length){
            if(eListaDuplaRet && !idxElaEPar){
              moverCoracao(botoes,2);
            }
            else{
              moverCoracao(botoes,0);
            }
          }
          else{
            moverCoracao(vetorAtual,novoInd);
          }
        }
        else if(e.which==38){
          const novoInd=idxEla-limite;
          if(novoInd>=0){
            moverCoracao(vetorAtual,novoInd);
          }
        }
        else if(eListaDuplaRet){
          if(e.which==37){
            if(!idxElaEPar){
              moverCoracao(vetorAtual,idxEla-1);
            }
          }
          else{
            const novoInd=idxEla+1;
            if(idxElaEPar && vetorAtual[novoInd]){
              moverCoracao(vetorAtual,novoInd);
            }
          }
        }
      }
    }
    else if(e.which==90){ // Apertou Z
      if(vetorAtual==botoes){
        mudarDivId(elAtual.dataset.div);


        if(elAtual.dataset.div=="fight"){

          // Fight!! Início

          emJogo=-2;
          tLuta=[];
          hits=0;
          coracaoErrante.classList.add("pseudoOculto");
          danoLuta=atkPlayer*(0.95+0.1*Math.random());
          barraDano=[];
          acertou=false;

          function criaBarraDano(i){
            barraDano[i]=criarElEfemero("div");
            barraDano[i].classList.add("tiro");
            barraAtk.appendChild(barraDano[i]);

            barraDano[i].style.animation="pow "+tt+"ms linear,blur "+fadeDur+"ms linear "+fadeStart+"ms forwards";
            barraDano[i].style.left="100%";

            barraDano[i].t=tLuta[i];
          }

          setTimeout(function () {
            tLuta[0]=0;
            tInic=performance.now(); // Pega tempo atual (em milissegundos)
            criaBarraDano(0);
            for(let i=1; ; ++i){
              tLuta[i]=tLuta[i-1]+intv/2+Math.random()*intv;
              setTimeout(function () {
                criaBarraDano(i);
              },tLuta[i]);

              if(i==qtd-1){
                timeoutFim=setTimeout(function () {
                  danoLuta*=Math.pow(0.5,4-hits);
                  finalizarFight();
                },tLuta[i]+tt);
                break;
              }
            }
          },espera);
        }
        else{
          moverCoracao(lis[idxDiva],0);
        }
      }

      else{
        coracaoErrante.classList.add("pseudoOculto");

        if(divAtual.id=="item"){
          emJogo=-3;
          mudarDivId("itemUsado");

          const o=itens[idxEla];
          pItemUsado.innerHTML=o.txItemUsado;
          pHpCurado.innerHTML=o.txHpCurado;
          pExtra.innerHTML=o.txExtra;
          o.funcConsumo();

          elAtual.remove();
          lis[2].splice(idxEla, 1);
          itens.splice(idxEla, 1);
          moverCoracao(botoes,2);
        }

        else if(divAtual.id=="act"){
          emJogo=-3;
          if(idxEla==0){
            mudarDivId("checkMsg");
          }
          moverCoracao(botoes,1);
        }

        else{
          divAtual.classList.remove("visivel");
          moverCoracao(botoes,3);
          prepararFase();
        }
      }
    }
    else if(e.which==88){ // Apertou X (voltar)
      if(vetorAtual==lis[idxDiva]){
        moverCoracao(botoes,function() {
          for(let i=0; i<botoes.length; i++){
            if(botoes[i].dataset.div==containers[idxDiva].id){
              return i;
            }
          }
        }());
        mudarDivId("ane");
      }
    }
  }


  // Dar um hit

  else if(emJogo==-2&&e.which==90){
    if(barraDano[hits]!==undefined){
      let th,atual;
      function atualiza(){
        th=barraDano[hits];
        atual=(performance.now()-tInic)-th.t;
      }
      const tt2=tt/2;

      // Se barras passaram da distância limite, considerá-las como miss e pulá-las. Se não, ir para a próxima barra
      do{
        atualiza();
        /*
          BUG: Se você apertar Z depois da última barrinha de ataque ter passado da última linha vermelha, aparece um erro no console.
          Mas como o programa continua rodando sem problema depois disso, eu ignorei kkkk
        */
        hits++;
      }while(atual>=fadeStart && function() { // Só executa essa função se atual>=fadeStart, ou seja, caso de miss
        danoLuta*=0.5;
        return true;
      }());

      th.style.setProperty("animation-delay", "0s,"+atual+"ms", "important");
      let sangue=criarElEfemero("div");
      barraAtk.appendChild(sangue);
      sangue.classList.add("sangue");
      sangue.style.left=atual/tt*100+"%";
      acertou=true;

      function x(){

      }

      danoLuta*=function(){
        let porc=(tt2-Math.abs(tt2-atual))/tt2;
        /* Multiplica o dano por um número menor que 1 se o ataque foi imperfeito */
        if(porc<8/19){
          return 0.5;
        }
        else if(porc<14/19){
          return 2/3;
        }
        else if(porc<18/19){
          return 5/6;
        }
        else{
          return 1;
        }
      }();

      if(hits==qtd){
        setTimeout(function () {
          clearTimeout(timeoutFim);
          finalizarFight();
        },fadeDur);
      }
    }
  }


  else if(emJogo==-3){
    divAtual.classList.remove("visivel");
    prepararFase();
  }


  else if(emJogo===0){
    if(e.which==90){
      if(textoAtual<texto.length){ // Se o boss vai falar alguma coisa...
        if(txtDisponivel){
          passarTexto();
        }
      }
      else{ // Senão inicia direto
        balao.classList.add("oculto");
        novaRonda();
      }
    }
    else if(e.which==88&&txtDisponivel==false){ // Se apertar X o texto todo fica visível de uma vez
      balao.innerHTML=("<span class=\"letraVisivel\">"+texto[textoAtual]+"</span>");
      pararTexto();
    }
  }
}


function novaRonda(){ // Carrega a fase atual
  divBattle.classList.add("visivel");
  y=alt/2-roac;
  x=larg/2-roac;
  atualizarPosCor();

  if(ronda==-1){ // Qdo ele morre vai pra essa ronda
    setMultDific(0);
    let cores=["azul","laranja"];
    const velLs=2,tLs=120;
    let tTotal=50;

    embaralhar(cores);
    function ls1(i){
      laserMonocor({
        toler:240,
        cor:cores[i],
        velY:sinalAleatorio(velLs),
        girar270: i==0,
        tSurg:tTotal
      });
    }
    ls1(0);
    ls1(1);
    tTotal+=tLs;

    embaralhar(cores);
    function ls2(i){
      const ie0=i==0;
      laserMonocor({
        toler:240,
        cor:cores[i],
        velY:ie0? velLs: -velLs,
        girar270: ie0,
        tSurg:tTotal
      },function (o) {
        const distX=x-(larg/2-roac);
        const distY=y-(alt/2-roac);
        if(Math.abs(distX)>Math.abs(distY)){
          o.girar270=true;
        }
        else{
          o.girar270=false;
        }
      });
    }
    ls2(0);
    ls2(1);
    tTotal+=tLs;

    const cxs=larg/tamCaixa;
    let xCxs=[],yCxs=[];
    for(let i=0; i<cxs; i++){
      xCxs[i]=yCxs[i]=i;
    }
    embaralhar(xCxs);
    embaralhar(yCxs);
    const velCx=2;
    const girar180cx1=sinalAleatorio(-1);
    const girar180cx2=sinalAleatorio(-1);
    const intvMinCx=tamCaixa/velCx;
    for(let i=0; i<cxs; i++){
      caixa({
        velY:velCx*girar180cx1,
        toler:240,
        cor:"branco",
        tSurg:tTotal,
        girar270:false,
        deslocX: xCxs[i]*tamCaixa
      });
      caixa({
        velY:velCx*girar180cx2,
        toler:240,
        cor:"branco",
        tSurg:tTotal,
        girar270:true,
        deslocX: yCxs[i]*tamCaixa
      });
      tTotal+=3*intvMinCx;
    }

    tTotal+=120;
    const tGst=tTotal;
    let xGst,yGst;
    const numGst=4;
    const intvGst=160;
    const espacGst=50;
    function gstGroup(pioneiro){
      for(let j=0; j<numGst; j++){
        function gst(girar270){
          gaster({
            tSurg:tTotal,
            tAviso:intvGst,
            x:j*espacGst,
            girar180:false,
            girar270:girar270
          },function (o) {
            if(j==0 && girar270){
              if(pioneiro){
                function get(coord){
                  return Math.floor((coord+roac)/(larg/(numGst+1)));
                }
                xGst=get(x);
                yGst=get(y);
              }
              let novoXGst,novoYGst;
              do{
                const dir=Math.random()<0.5;
                const mov=sinalAleatorio(2);
                const movSec=sinalAleatorio(1);
                if(dir){
                  novoXGst=xGst+mov;
                  novoYGst=yGst+movSec;
                }
                else{
                  novoXGst=xGst+movSec;
                  novoYGst=yGst+mov;
                }
              }while(novoXGst<0 || novoYGst<0 || novoXGst>numGst || novoYGst>numGst);
              xGst=novoXGst;
              yGst=novoYGst;
            }
            if(j>=(girar270? yGst: xGst)){
              o.x+=espacGst;
            }
          });
        }
        gst(true);
        gst(false);
      }
    }
    gstGroup(true);
    tTotal+=intvGst+20;
    gstGroup();
    tTotal+=intvGst-50;
    caixa({
      velY:3,
      cor:"branco",
      tSurg:tTotal
    },function (o) {
      const largReal=larg-2*roac;
      const dif=(espacGst-tamCaixa)/2;
      const xEsp=xGst*espacGst+dif,yEsp=yGst*espacGst+dif;
      const toler=360;
      if(yEsp<largReal/3){
        o.girar270=false;
        o.toler=toler-yEsp;
        o.deslocX=xEsp-(tamCaixa-2*roac)/2;
      }
      else{
        o.girar270=true;
        o.deslocX=yEsp-(tamCaixa-2*roac)/2;
        if(xEsp>largReal/2){
          o.toler=toler-(largReal-xEsp);
          o.velY*=-1;
        }
        else{
          o.toler=toler-xEsp;
        }
      }
    });
    tTotal+=intvGst-60;

    let coresLc=["azul","laranja"];
    const velLc=0.4;
    const vels=[0,0.4,0.8,1.2];
    function lc(i,g270,g180) {
      embaralhar(coresLc)
      laserColorido({
        velX:sinalAleatorio(vels[i]),
        velY:g180? -velLc: velLc,
        tSurg:tTotal,
        cores:coresLc,
        toler:120,
        passouX:Math.random()*larg/2,
        girar270:g270
      });
    }
    embaralhar(vels);
    lc(0,true,true);
    lc(1,false,false);
    lc(2,true,false);
    lc(3,false,true);

    tTotal+=(120+larg)/velLc+235;
    const tCabum=tTotal;
    const durBalango=475;
    const inicBalango=tCabum-durBalango;
    const incrIncr=0.001;
    let incr=0;
    let balangoAtual=0;

    const largEst=12,altEst=12;
    const centroDispY=-132,centroDispX=larg/2-roac;
    const disp=120;
    const velEst=2;
    const accEst=velEst*velEst*0.004;

    function estilhaco(ang){
      const el=criarElEfemero("div");
      el.className="estilhaco branco";
      el.tSurg=tCabum;
      el.invul=5;
      el.dano=9;
      resizeX(el,largEst);
      resizeY(el,altEst);
      el.hitbox=function () {
        roayo=altEst/2;
        roaxo=largEst/2;
        getDists(el);
        let ret=pitagoras(dx,dy)<=roaxo+hbc;
        if(ret) el.classList.remove("visivel");
        return ret;
      }
      obsts[numObst++]=el;
      let o={};

      el.funcApar=function () {
        const sin=Math.sin(ang),cos=Math.cos(ang);
        el.y=centroDispY;
        el.x=centroDispX;
        const random=Math.sqrt(Math.random());
        o.velY=random*velEst*sin;
        o.velX=random*velEst*cos;
        atualizaPosNormal(el);
      }

      el.funcMov=function () {
        o.velY+=accEst;
        el.x+=o.velX;
        el.y+=o.velY;
        atualizaPosNormal(el);
      }
    }

    const num=48;
    function gerar(n,ang,rand){
      for(let i=0; i<n; i++){
        estilhaco((ang+rand*Math.random())*Math.PI);
      }
    }
    gerar(num,0,2);
    gerar(num/2,1,1);
    gerar(num/4,1.25,0.5);
    gerar(num/8,1.375,0.25);
    gerar(num/16,1.4375,0.125);

    funcFrameAntes=function () {
      if(t==tCabum){
        imgOpon.style.left="";
        imgOpon.style.top="";
        imgOpon.classList.add("explodido");
      }
      else if(t<tCabum && t>=inicBalango){
        if(t%4==0){
          incr+=incrIncr;
          balangoAtual+=incr;
          function balango() {
            return (Math.random()*2-1)*balangoAtual+"rem";
          }
          imgOpon.style.left=balango();
          imgOpon.style.top=balango();
        }
      }
    }
    tFim=tTotal+400;
  }
  else{
    fases[fase].fn();
  }

  for(let i=0; i<numObst; i++){ // Coloca os obstáculos no HTML
    divObsts.appendChild(obsts[i]);
    obsts[i].apareceu=false;
  }
  if(divFF.classList.contains("visivel") && (larg<120 || alt<60)){
    divFF.classList.add("embaixo");
  }
  tFim/=multDific;
  emJogo=1;
  frame(funcFrameAntes,funcFrameDepois);
  pararJogo=setInterval(function () { // 100 frames por segundo
    frame(funcFrameAntes,funcFrameDepois);
  },10);
}


function inicFase(){ // Chamada quando o jogo inicia
  ronda=-1 // -1 porque a função resetRonda faz ronda++, aí ronda fica sendo 0, que é o número da 1a fase.
  fase=ronda;
  dific=1;
  hpMax=76; // Sua vida
  hp=hpMax;
  atkPlayer=100;
  velPlayer=2;
  aacelerando=false;
  barraHp.style.width="100%";
  spanHp.innerHTML=hp;
  spanHpMax.innerHTML=hp;
  divMenu.classList.add("oculto");
  app.classList.remove("oculto");
  moverCoracao(botoes,0);
  mudarDivId("ane");
  texto=[];
  if(meterDific.value<0.5){
    dificUsuario=0.7+0.6*meterDific.value;
  }
  else{
    dificUsuario=0.6+0.8*meterDific.value;
  }


  fases=[
    {//r1
      larg:240,
      alt:240,
      fn:function () {
        function naSorte(x,vely,ft){
          let cores=["azul","branco","laranja"];
          const ordem=[[1,false],[-1,true],[-1,false],[1,true]];
          for(let i=0; i<x; i++){
            embaralhar(cores);
            laserColorido(l(6,sinalAleatorio(i%2? 0.66667: 1.33333),ordem[i][0]*vely,ft(i),cores,ordem[i][1],240,undefined,Math.random()*79));
          }
        }

        setMultDific(1,1);
        const spd1=1.1111111111,spd2=0.8888888889;

        naSorte(4,spd1,function (i) {
          return 144*i;
        });

        naSorte(4,spd2,function (i) {
          switch(i){
            case 0:
            return 644;
            case 1:
            return 696;
            case 2:
            return 936;
            case 3:
            return 1003;
          }
        });

        tFim=1600;
      }
    },

    {//r2
      larg:240,
      alt:24,
      fn:function () {
        setMultDific(1);
        const cores2=["laranja","azul"];
        let t=0;
        const velx1=1.5,vely1=1.5,velx2=0.75,vely2=1.5;
        const disty=264,distx=280,multRapido=0.5;

        laserColorido(l(6,sinalAleatorio(velx1),vely1,t,cores2,false,360,undefined,Math.random()*80));
        t+=Math.round(disty/vely1);
        laserColorido(l(6,sinalAleatorio(velx1),vely1,t,cores2,true,180,larg,Math.random()*80),function (o) {
          if(x>(larg-roac)/2) o.velY*=-1;
        });
        t+=Math.round(distx/vely1);

        laserColorido(l(6,sinalAleatorio(velx2),vely2,t,cores2,false,360,undefined,Math.random()*80));
        t+=Math.round(disty/vely2*multRapido);
        laserColorido(l(6,sinalAleatorio(velx2),vely2,t,cores2,false,360,undefined,Math.random()*80));
        t+=Math.round(disty/vely2*multRapido);
        laserColorido(l(6,sinalAleatorio(velx2),vely2,t,cores2,false,360,undefined,Math.random()*80));
        t+=Math.round(disty/vely2);

        let ladoEscolhido;
        laserColorido(l(6,sinalAleatorio(velx1),vely1,t,cores2,true,180,larg,Math.random()*80),function (o) {
          if(x>(larg-roac)/2){
            ladoEscolhido=-1;
            o.velY*=-1;
          }
          else{
            ladoEscolhido=1;
          }
        });
        t+=Math.round(disty/vely2*multRapido);
        laserColorido(l(6,sinalAleatorio(velx1),vely1,t,cores2,true,180,larg,Math.random()*80),function (o) {
          o.velY*=ladoEscolhido;
        });
        t+=Math.round(disty/vely2*multRapido);
        laserColorido(l(6,sinalAleatorio(velx1),vely1,t,cores2,true,180,larg,Math.random()*80),function (o) {
          o.velY*=ladoEscolhido;
        });
        t+=Math.round(distx*2/vely2); // Vezes 2 porque sim

        tFim=t;
      }
    },

    {//r3
      larg:240,
      alt:240,
      fn:function () {
        setMultDific(0.5);
        const vel=1,num=24,tCada=120;

        for(let i=0; i<num; i++){
          caixa({
            velY:vel,
            toler:240,
            cor:"branco",
            tSurg:i*tCada
          },function(o){
            if(i%2==1){
              o.girar270=true;
              o.deslocX=y-8; // 8 pq eh o tam da caixa menos o do coracao sobre 2
            }
            else{
              o.girar270=false;
              o.deslocX=x-8;
            }

            const j=i%4;
            if(j==1 || j==2){
              o.velY*=-1;
            }
          });
        }

        for(let i=0; i<7; i++){
          gaster({
            tSurg:360*(i+1),
            tAviso:160,
            x:(larg-largLaser)/2,
            girar180:Math.random()<0.5
          },function (o) {
            o.girar270=Math.abs(x-(larg-roac)/2)<Math.abs(y-(alt-roac)/2);
          });
        }

        tFim=num*tCada;
        const incr=(1/tFim)*1.5*multDific;

        funcFrameAntes=function () {
          multFF+=incr;
          spanFF.innerHTML=multFF.toFixed(1);
        };

        divFF.classList.add("visivel");
      }
    },

    {//r4
      larg:76,
      alt:110,
      fn:function () {
        setMultDific(1.25);
        const vel=6.66667,num=10;
        const tCada=tamCaixa/vel*4;
        const cores=["azul","laranja"];
        let ultimo=1;

        atualizaFF(0.25);

        for(let i=0; i<num; i++){
          caixa({
            velY:vel,
            toler:240,
            cor:function () {
              let ind;
              if(ultimo==0){
                ind=1;
              }
              else{
                ind=Math.random()<0.5? 0: 1;
              }
              ultimo=ind;
              return cores[ind];
            }(),
            tSurg:25+i*tCada,
            deslocX:(larg-tamCaixa)/2
          });
        }

        laserColorido(l(6,2,0,0,["branco","azul"],true,-21));
        laserColorido(l(6,-2,0,0,["branco","azul"],true,-55));

        tFim=tCada*num+(280+alt)/vel;
        divFF.classList.add("visivel");
      }
    },

    {//r5
      larg:240,
      alt:240,
      fn:function () {
        setMultDific(1);
        atualizaFF(64);
        divFF.classList.add("visivel");

        criarPlat(0,largPlat,false);
        criarPlat(2*largPlat,0,true);
        criarPlat(2.5*largPlat,0*largPlat,true,2.25*largPlat);
        criarPlat(2*largPlat,5*largPlat,false);
        criarPlat(2*largPlat,4*largPlat,false);
        criarPlat(5*largPlat,4.5*largPlat,false);
        criarPlat(3.75*largPlat,2*largPlat,false,2.25*largPlat);
        criarPlat(1.25*largPlat,5*largPlat,true);
        criarPlat(4*largPlat,3*largPlat,true);
        criarPlat(0.25*largPlat,2.5*largPlat,true,2*largPlat);
        criarPlat(3.25*largPlat,1*largPlat,false,1.5*largPlat);
        criarPlat(4*largPlat,0,true);
        criarPlat(2*largPlat,1*largPlat,false,0.5*largPlat);

        funcFrameAntes=ffaPlat;
        funcFrameDepois=ffdPlat;

        let tInic=360;
        const intvMedio=110,intvCurto=85,av1=160,av2=160,av3=440,av4=600;

        function gasterEsperto(girar180,girar270,tSurg,tAviso){
          gaster({
            girar180:girar180,
            girar270:girar270,
            tSurg:tSurg,
            tAviso:tAviso
          },function (o) {
            o.x=(girar270? y: x)-(largLaser-2*roac)/2;
          });
        }

        gasterEsperto(false,false,100,av1);

        gasterEsperto(false,false,tInic,av1);
        tInic+=intvCurto;
        gasterEsperto(false,true,tInic,av1);
        tInic+=intvCurto;
        gasterEsperto(true,false,tInic,av1);
        tInic+=intvCurto;
        gasterEsperto(true,true,tInic,av1);
        tInic+=intvCurto+av1;

        gasterEsperto(false,false,tInic,av2);
        gasterEsperto(false,true,tInic,av2);
        tInic+=intvMedio;
        gasterEsperto(true,false,tInic,av2);
        gasterEsperto(true,true,tInic,av2);
        tInic+=intvMedio;
        gasterEsperto(false,false,tInic,av2);
        gasterEsperto(false,true,tInic,av2);
        tInic+=intvMedio+av2;


        const linhas=larg/largLaser;

        function gasterSet(girar180,girar270,toler,tAviso){ // Melhorar quando der vontade
          let linhaEsc=Math.floor(Math.random()*(linhas-1-toler));
          if(linhaEsc==linhas-2-toler) linhaEsc++;

          for(let i=0; i<linhas; i++){
            if(i==linhaEsc){
              if(linhaEsc!=0){
                i+=toler+1;
              }
              else{
                i+=toler;
              }
            }
            else{
              gaster({
                girar180:girar180,
                girar270:girar270,
                tSurg:tInic,
                tAviso:tAviso,
                x:i*largLaser
              });
            }
          }
        }

        gasterSet(false,true,1,av3);
        gasterSet(false,false,1,av3);
        tInic+=av3+50;

        gasterSet(true,false,0,av4);
        gasterSet(true,true,0,av4);
        tInic+=av4+50;

        tFim=tInic*multFF+100;
      }
    },

    {//r6
      larg:280,
      alt:260,
      fn:function () {
        setMultDific(1);
        atualizaFF(64);
        divFF.classList.add("visivel");

        criarPlat(2*largPlat,1.5*largPlat,false);
        criarPlat(2*largPlat,1.5*largPlat,true,0.75*largPlat);
        criarPlat(1.5*largPlat,4.5*largPlat,false);
        criarPlat(5*largPlat,5*largPlat,false);
        criarPlat(6*largPlat,4.25*largPlat,true,largPlat*3/4);
        criarPlat(0,5.5*largPlat,false);
        criarPlat(3.25*largPlat,5.5*largPlat,false,1.75*largPlat);
        criarPlat(6*largPlat-3,3.5*largPlat,false,largPlat+3);
        criarPlat(5.5*largPlat-3,1*largPlat,true);
        criarPlat(4.5*largPlat-3,1*largPlat,false);
        criarPlat(3*largPlat-3,3*largPlat,true,1.25*largPlat);

        criarChave(5.5*largPlat-6,2*largPlat+4);
        criarChave(larg-32,4.25*largPlat);

        funcFrameAntes=function () {
          multFF+=0.032*multDific;
          spanFF.innerHTML=multFF.toFixed(0);
          ffaPlat();
        };
        funcFrameDepois=function () {
          ffdPlat();
          ffdChave(numPlats);
        };

        for(let i=0; i<61; i++){ // MELHORAR ESSA ZORRA
          const restoIpor4=i%4;
          gaster({
            girar180:restoIpor4==1 || restoIpor4==2,
            girar270:restoIpor4==1 || restoIpor4==3,
            tSurg:200+i*240,
            tAviso:160,
          },function (o) {
            o.x=(o.girar270? y: x)-(largLaser-2*roac)/2;
          });
        }

        tFim=6000*160;
      }
    },

    {//r7
      larg:80,
      alt:80,
      fn:function () {
        setMultDific(1);
        divFF.classList.add("visivel");
        spanFF.innerHTML="1.0";
        multFF=1;
        const intv=320,pares=3;
        const numGasters=pares*2;
        const multPt2=4;
        const areas=larg/largLaser;

        let gastersAnts=[];
        let areasPerigosas=[];
        for(let i=0; i<areas; i++){
          areasPerigosas[i]=[];
        }

        do{
          for(let i=0; i<areas; i++){
            for(let j=0; j<areas; j++){
              areasPerigosas[i][j]=0;
            }
          }

          for(let i=0; i<pares; i++){
            function set(zeroou1){
              const atual=2*i+zeroou1;
              let parteQInteressa={};

              function setRandom(){
                parteQInteressa.girar180=p=Math.random()>0.5;
                parteQInteressa.areaX=Math.floor(Math.random()*areas);
                if(atual>=2){
                  if(parteQInteressa.girar180==gastersAnts[atual-2].girar180
                  && parteQInteressa.areaX==gastersAnts[atual-2].areaX){
                    parteQInteressa.girar180=!parteQInteressa.girar180;
                  }
                }
              }

              function addLinha(j){
                for(let i=0; i<areas; i++){
                  areasPerigosas[j][i]++;
                }
              }
              function addCol(j){
                for(let i=0; i<areas; i++){
                  areasPerigosas[i][j]++;
                }
              }

              setRandom();
              if(zeroou1==1){
                addLinha(parteQInteressa.areaX);
              }
              else{
                addCol(parteQInteressa.areaX);
              }
              gastersAnts[atual]=parteQInteressa;
            }

            set(0);
            set(1);
          }
        } while(function(){
          for(let i=0; i<areas; i++){
            for(let j=0; j<areas; j++){
              if(areasPerigosas[i][j]==0) return true;
            }
          }
          return false;
        }());

        for(let i=0; i<numGasters; i++){
          gaster({
            girar180:gastersAnts[i].girar180,
            girar270:i%2==1,
            x:gastersAnts[i].areaX*largLaser,
            tAviso:intv,
            tSurg:Math.floor(i/2)*intv
          },function (o) {
            if(multFF>1){
              o.tAtk=Math.round(50/multPt2);
              o.dano=9/o.tAtk;
            }
          });
        }


        const tRev=(pares*intv+50)/multDific;
        let varia=0;
        let nZerou1=true,nZerou2=true,nIniciou2=true;

        function resetObsts(){
          for(let i=0; i<numObst; i++){
            obsts[i].apareceu=false;
          }
        }

        funcFrameAntes=function () {
          if(t>tRev && nIniciou2){
            if(multFF>0) varia++;
            else{
              varia--;
              if(nZerou1){
                divFF.classList.add("reverso");
                resetObsts();
                nZerou1=false;
              }
            }
            multFF-=0.0004*varia;
            spanFF.innerHTML=Math.abs(multFF).toFixed(1);
          }
          else if(!nZerou1 && (t<=0 || !nIniciou2) && multFF<multPt2){
            if(nIniciou2){
              varia=0;
              nIniciou2=false;
              tFim=tRev+50; // tFim de verdade
            }
            if(multFF<(-1+multPt2)/2){
              varia++;
              if(nZerou2 && multFF>0){
                divFF.classList.remove("reverso");
                resetObsts();
                nZerou2=false;
              }
            }
            else{
              varia--;
            }
            if(varia==0){
              nZerou1=true;
            }
            else{
              multFF+=0.00016*varia;
              spanFF.innerHTML=Math.abs(multFF).toFixed(1);
            }
          }
        }
        tFim=10000;
      }
    },

    {//r8
      larg:400,
      alt:400,
      fn:function () {
        setMultDific(0.5);
        y=alt-2*roac-10;
        x=10;

        tFim=2000;
        const tLava=2000;

        obstGenerico({
          larg:larg,
          x:0,
          y:alt,
          alt:0,
          cor:"laranja",
          tSurg:400,
          invul:200
        },undefined,function (el,o) {
          if(t<tLava){
            o.alt+=alt/((tLava/multDific)-o.tSurg);
            resizeY(el,o.alt);
            atualizaPosY(el,o.y-o.alt);
          }
        });

        criarChave(10,10);

        criarPlat(0,85,false,larg-90);
        criarPlat(100,180,false,larg-100);
        criarPlat(0,295,false,larg-110);

        laserColorido(l(6,2,0,0,["azul","laranja"],true,-197));

        funcFrameAntes=function () {
          ffaPlat();
        }
        funcFrameDepois=function () {
          ffdChave(1);
          ffdPlat(2);
        }

        for(let tSurg=50; tSurg<tLava;){
          const dado=Math.random();

          if(dado<0.45){
            const dado2bool=Math.random()<0.5;
            const dado3=Math.random();
            const xPossivelMax=larg-largLaser;

            gaster({
              girar180:dado2bool,
              girar270:true,
              tSurg:tSurg,
              tAviso:160,
              x:xPossivelMax*dado3
            });

            tSurg+=90;
          }

          else{
            const xPossivelMax=larg-tamCaixa;
            function jogarDado(){
              let res=Math.random()*larg-tamCaixa/2;
              if(res<0) res=0;
              else if(res>xPossivelMax) res=xPossivelMax;
              return res;
            }

            let dadoscx=[jogarDado()];
            do{
              dadoscx[1]=jogarDado();
            } while(Math.abs(dadoscx[1]-dadoscx[0])<tamCaixa+12);

            function cx(i){
              caixa({
                velY:2,
                toler:200,
                cor:"branco",
                tSurg:tSurg,
                girar270:false,
                deslocX: dadoscx[i]
              });
            }
            cx(0);
            cx(1);

            tSurg+=80;
          }
        }
      }
    },

    {//r9
      larg:400,
      alt:400,
      fn:function () {
        setMultDific(1.25);
        const vel=1,num=24,tCada=90;
        let vicio=0.5,resAnt;

        for(let i=0; i<num; i++){
          let res=Math.random()<vicio;
          if(i==0 || res!=resAnt){
            vicio=0.5;
          }
          if(resAnt) vicio-=0.25;
          else vicio+=0.25;
          resAnt=res;

          laserMonocor({
            toler:120,
            cor:res? "laranja": "azul",
            velY:Math.random()<0.5? vel: -vel,
            girar270: Math.random()<0.5,
            tSurg:i*tCada
          });
        }

        tFim=(num+1)*tCada;
      }
    },

    {//r10
      larg:240,
      alt:240,
      fn:function () {
        setMultDific(0.5);
        let vel4,angCirc,nFoi3;
        let nAcabou1=true;
        const vel2=1*multDific;
        const tCirc=376/multDific,velCirc=0.5;
        const tInic=50/multDific;

        caixaGrandeCPrevia({
          tSurg:0,
          tRep:1000000,
          tam:120
        },function f(tf,el,o) {
          if(f.passo==0){
            if(tf>=tInic){
              f.passo++;
            }
          }
          else{
            if(f.passo==1){
              el.y+=(tf<100+tInic? (tf-tInic)/100*2: 2)*multDific;
              if(el.y>=alt-el.tam/2){
                f.passo++;
              }
            }

            else if(f.passo==2){
              el.y-=vel2*0.8;
              el.x-=vel2*0.6;
              if(el.x<=-el.tam/2){
                f.passo++;
              }
            }

            else if(f.passo==3){
              el.x-=Math.cos(angCirc)*velCirc*multDific;
              el.y-=Math.sin(angCirc)*velCirc*multDific;
              angCirc+=Math.PI/tCirc;
              if(angCirc>3*Math.PI/2){
                if(nFoi3){
                  angCirc=Math.PI/2;
                  nFoi3=false;
                }
                else{
                  f.passo++;
                }
              }
            }

            else if(f.passo==4){
              el.y+=vel4*0.8*multDific;
              el.x-=vel4*0.6*multDific;
              if(vel4<1.5){
                vel4+=0.02;
              }
              else{
                vel4=1.5;
                if(el.x<=o.x){
                  f.passo++;
                }
              }
            }

            else{
              if(nAcabou1){
                nAcabou1=false;
                o.tRep=tf+50;
                tFim=o.tSurg+2*o.tRep+2*tTrans;
              }
            }

            atualizaPosNormal(el);
          }
        },function () {
          angCirc=Math.PI/2;
          nFoi3=true;
          vel4=velCirc;
        });
        tFim=100000;
      }
    },

    {//r11
      larg:320,
      alt:320,
      fn:function () {
        setMultDific(0.5);
        function randomCSinal(x){
          return Math.random()*2*x-x;
        }

        let accAng=randomCSinal(0.5);
        let acc=0;
        const accMax=0.4*multDific;
        const accSuper=0.8*multDific;
        let ang=2*Math.PI*Math.random();
        const velMax=1;
        const tStart=50;
        let tObst=tStart+250;

        const tCada=300;
        let dirs=[true,false];
        let cores=["laranja","azul"];
        embaralhar(dirs);
        embaralhar(cores);

        caixaGrande({
          tSurg:0,
          tam:160
        },function(tf,el,o){
          if(tf<tStart/multDific) return;

          if(acc<accMax || (t>tObst/multDific && acc<accSuper)){
            acc+=accMax/100*multDific;
          }
          accAng+=function () {
            return (Math.random()*(2-Math.abs(accAng))-Math.min(accAng+1,1))/10;
          }();
          ang+=accAng*Math.PI/20*acc;

          let vel=(1-Math.abs(accAng))*acc;
          el.x+=vel*Math.cos(ang);
          el.y+=vel*Math.sin(ang);

          if(el.x<0){
            el.x=0;
            ang=-ang+Math.PI;
          }

          else if(el.x>larg-el.tam){
            el.x=larg-el.tam;
            ang=-ang+Math.PI;
          }

          else if(el.y<0){
            el.y=0;
            ang=-ang;
          }

          else if(el.y>alt-el.tam){
            el.y=alt-el.tam;
            ang=-ang;
          }

          atualizaPosNormal(el);
        });

        for(let i=0; i<2; i++){
          laserMonocor({
            toler:160,
            cor:cores[i],
            velY:1.33333,
            girar270: dirs[i],
            tSurg:tObst
          },function (o) {
            if(o.girar270){
              if(x>larg/2-roac) o.velY*=-1;
            }
            else{
              if(y>alt/2-roac) o.velY*=-1;
            }
          });
          tObst+=tCada;
        }

        laserColorido({
          velX:1,
          velY:0.73,
          tSurg:tObst,
          cores:cores,
          toler:120,
          passouX:Math.random()*larg/2
        },
        function (o) {
          const distX=x-(larg/2-roac);
          const distY=y-(alt/2-roac);
          if(Math.abs(distX)>Math.abs(distY)){
            o.girar270=true;
            if(distX>0) o.velY*=-1;
          }
          else{
            o.girar270=false;
            if(distY>0) o.velY*=-1;
          }
        });
        tObst+=600;

        tFim=tObst+400;
      }
    },

    {//r12
      larg:240,
      alt:400,
      fn:function () {
        setMultDific(0.3);
        let espacoAtual=2,espacoAnt=espacoAtual;
        let dir,dirAnt;
        const tamCxMaior=48;
        const espacos=larg/tamCxMaior;
        const vel=2.4;
        const tCada=tamCxMaior/vel;
        let tTotal=0;
        const toler=240;
        const fim=20;

        atualizaFF(0.5);
        divFF.classList.add("visivel");
        y=40;

        for(let i=0; i<fim; i++){
          function cx(j){
            caixa({
              velY:vel,
              toler:toler,
              cor:"branco",
              tSurg:tTotal,
              deslocX:tamCxMaior*j-0.5,
              girar270:false,
              larg:tamCxMaior+1
            });
          }

          for(let j=0; j<espacos; j++){
            if(j!=espacoAtual && j!=espacoAnt){
              cx(j);
            }
          }

          espacoAnt=espacoAtual;
          tTotal+=tCada;

          const iMenorQue10=i<10;
          if(i>0 && !((iMenorQue10 && i%2==0) || (!iMenorQue10 && i%3==0))){
            if(espacoAtual==0){
              dir=1;
            }
            else if(espacoAtual==espacos-1){
              dir=-1;
            }
            else{
              dir=sinalAleatorio(1);
            }
            espacoAtual+=dir;

            if(tTotal>0 && dir!=dirAnt){
              obstGenerico({
                alt:6,
                larg:tamCxMaior+1,
                x:tamCxMaior*espacoAtual-0.5,
                y:-toler-3,
                cor:"branco",
                tSurg:tTotal
              },undefined,function (el,o) {
                el.y+=vel*multFF*multDific;
                if(el.y>alt+toler-3){
                  el.classList.remove("visivel");
                }
                else atualizaPosY(el,el.y);
              });
            }

            dirAnt=dir;
          }
        }

        tFim=tTotal+270;
      }
    },

    {//r13
      larg:360,
      alt:24,
      fn:function () {
        setMultDific(0.3);
        const tamCxMaior=72;
        const espacos=larg/tamCxMaior;
        let espacoAtual=2,espacoAnt=espacoAtual;
        let dir,dirAnt;
        const vel=1.6;
        const tCada=tamCxMaior/vel;
        let tTotal=0;
        const toler=240;
        const fim=8;

        atualizaFF(0.75);
        divFF.classList.add("visivel");

        for(let i=0; i<fim; i++){
          function cx(j){
            caixa({
              velY:vel,
              toler:toler,
              cor:"branco",
              tSurg:tTotal,
              deslocX:tamCxMaior*j-0.5,
              girar270:false,
              larg:tamCxMaior+1,
              nSome:true
            });
          }

          for(let j=0; j<espacos; j++){
            if(j!=espacoAtual && j!=espacoAnt){
              cx(j);
            }
          }

          espacoAnt=espacoAtual;
          tTotal+=tCada;

          if(espacoAtual==0){
            dir=1;
          }
          else if(espacoAtual==espacos-1){
            dir=-1;
          }
          else{
            dir=sinalAleatorio(1);
          }
          espacoAtual+=dir;

          if(tTotal>0 && dir!=dirAnt){
            obstGenerico({
              alt:6,
              larg:tamCxMaior+1,
              x:tamCxMaior*espacoAtual-0.5,
              y:-toler-3,
              cor:"branco",
              tSurg:tTotal
            },undefined,function (el,o) {
              el.y+=vel*multFF*multDific;
              atualizaPosY(el,el.y);
            });
          }

          dirAnt=dir;
        }

        let varia=1;
        const start=multFF,end=-1.125;
        const meio=(start+end)/2;
        let nTrocou=true,comecouAMudar=false;
        const tTroca=(tTotal+(toler+alt+tamCxMaior)/vel)/multDific;

        funcFrameAntes=function () {
          if(t>tTroca || comecouAMudar){
            comecouAMudar=true;
            if(multFF>end && varia!=0){
              multFF-=0.002*varia;
              spanFF.innerHTML=Math.abs(multFF).toFixed(1);

              if(multFF<0 && nTrocou){
                for(let i=0; i<numObst; i++){
                  if(!obsts[i].classList.contains("visivel")){
                    obsts[i].classList.add("visivel");
                    obsts[i].funcApar();
                  }
                }
                nTrocou=true;
                divFF.classList.add("reverso");
              }

              if(multFF>meio){
                varia++;
              }
              else{
                varia--;
              }
            }
            else{
              multFF=end;
              varia=0;
              comecouAMudar=false;
              spanFF.innerHTML=Math.abs(multFF).toFixed(1);
            }
          }

          else if(multFF<0 && t<=0){
            resetRonda();
          }
        }

        tFim=10000;
      }
    }
  ];

  if(incrDificSubito==undefined){
    incrDificSubito=0.2;
    incrDificGradual=incrDificSubito/(fases.length+1);
  }

  function torta(){
    return{
      txItemUsado:"Você comeu a Torta.",
      txHpCurado:"Sua vida foi completamente restaurada.",
      txExtra:"",
      funcConsumo:function () {
        cura(hpMax);
      }
    }
  }
  function bife(){
    return{
      txItemUsado:"Você comeu o Bife.",
      txHpCurado:"57 HP restaurados.",
      txExtra:"",
      funcConsumo:function () {
        cura(57);
      }
    }
  }
  function seatea(){
    return{
      txItemUsado:"Você tomou o chá.",
      txHpCurado:"19 HP restaurados.",
      txExtra:"Sua velocidade aumentou!",
      funcConsumo:function () {
        cura(19);
        velPlayer+=0.5;
      }
    }
  }
  function lhero(){
    return{
      txItemUsado:"Você comeu o sanduíche.",
      txHpCurado:"38 HP restaurados.",
      txExtra:"Seu ataque aumentou!",
      funcConsumo:function () {
        cura(38);
        atkPlayer+=12.5;
      }
    }
  }

  itens=[
    torta(),
    bife(),
    bife(),
    bife(),
    seatea(),
    seatea(),
    lhero(),
    lhero()
  ];

  addEventListener("keyup",keyup);
  addEventListener("keydown",keydown);

  resetRonda();
}

function mudaVel(tecla,z){ // Muda velocidade com base na tecla apertada
  if(tecla==38){
    velY-=z; // Cima
    direcaoHab=-1;
  }
  else if(tecla==40){
    velY+=z; // Baixo
    direcaoHab=-1;
  }
  else if(tecla==37){
    velX-=z; // Esquerda
    direcaoHab=1;
  }
  else if(tecla==39){
    velX+=z; // Direita
    direcaoHab=1;
  }
}


/* Navegação pré-batalha */

let errante=document.querySelector("#coracaoErrante");
let elAtual,idxEla;
let divAtual,idxDiva;
let vetorAtual;
let botoes=document.querySelectorAll("#botoes button");
let containers=document.querySelectorAll(".tx"),lenCont=containers.length;
let lis=[];

function moverCoracao(vetor,i){
  let el=vetor[i];
  if(elAtual&&elAtual.tagName=="LI") elAtual.classList.remove("hasHeart");
  elAtual=el;
  if(elAtual.tagName=="LI") elAtual.classList.add("hasHeart");
  idxEla=i;
  vetorAtual=vetor;
  let obj=el.getBoundingClientRect();
  let teste=vetor==botoes;
  errante.style.top=(obj.top+scrollY)/rem+(teste? roac: 7)+"rem";
  errante.style.left=obj.left/rem+(teste? roac: -3)+"rem";
}

function mudarDivId(id){
  for(let i=0; i<lenCont; i++){
    if(containers[i].id==id){
      containers[i].classList.add("visivel");
      divAtual=containers[i];
      idxDiva=i;
    }
    else{
      containers[i].classList.remove("visivel");
    }
  }
}

for(let i=0; i<lenCont; i++){
  let filho=containers[i].childNodes[1];
  if(filho&&filho.tagName=="UL"){
    // Ignora ChildNodes vazios (que só contêm espaço)
    lis[i]=function(f) {
      let semVazios=[];
      for(let i=1; i<f.length; i+=2){
        semVazios.push(f[i]);
      }
      return semVazios;
    }(filho.childNodes);
  }
  else{
    lis[i]=[];
  }
}

const pItemUsado=document.querySelector("#voceComeu");
const pHpCurado=document.querySelector("#hpRestaurado");
const pExtra=document.querySelector("#extra");

function cura(qtd){
  let curouTudo=false;
  hp+=qtd;
  if(hp>=hpMax){
    hp=hpMax;
    curouTudo=true;
  }
  atualizaVida();
}

function inicRonda(){
  // Chamada antes de começar o ataque do boss

  if(texto.length){
    emJogo=0;
    balao.classList.remove("oculto");
    passarTexto();
  }
  else novaRonda();
}

function atualizaVida(){
  spanHp.innerHTML=Math.round(hp);
  barraHp.style.width=Math.round(100*hp/hpMax)+"%";
}

function dano(obst){ // Quando é atingido por um obstáculo
  if(invul<=0){
    const resto=invul;
    hp-=obst.dano;
    invul=obst.invul+resto;
    atualizaVida();
  }
}

function frame(funcFrameAntes,funcFrameDepois){
  /* Função executada a cada 10ms durante as fases. Os parâmetros são opcionais e são funções que, se existirem, são executadas
  antes e depois de ser computado o movimento do coração. */

  if(t>=tFim){ // Se acabou fase
    resetRonda();
    return;
  }

  if(funcFrameAntes) funcFrameAntes();


  // Movimento

  mult=velPlayer; // Velocidade base do coração (pode mudar pra ficar + ou - rápido)
  if(multFF<0) mult*=-1;

  {
    let multFF2=multFF;

    if(estaRapido){
      multFF2=450;
      if(tamPremidas==2){
        if(direcaoHab==1){
          y+=velY*mult*multFF2;
        }
        else{
          x+=velX*mult*multFF2;
        }
        direcaoHab*=-1;
      }
      else{
        y+=velY*mult*multFF2;
        x+=velX*mult*multFF2;
      }
    }
    else{
      if(tamPremidas==2){
        mult/=Math.sqrt(2); // Se estiver andando na diagonal fica mais lento
      }
      y+=velY*mult*multFF2;
      x+=velX*mult*multFF2;
    }
  }

  velRealX=velX;
  velRealY=velY;
  /* Variáveis que verificam se o coração realmente andou. Se, por exemplo, ele já estiver o mais em cima possível e tentar
  andar mais para cima, velRealY será 0 e o coração será considerado como parado (para ataques azuis e laranjas). Obs: Isso
  ainda não funciona com plataformas. */

  if(x<0){
    x=0;
    velRealX=0;
  }
  else if(x>larg-2*roac){
    x=larg-2*roac;
    velRealX=0;
  }

  if(y<0){
    y=0;
    velRealY=0;
  }
  else if(y>alt-2*roac){
    y=alt-2*roac;
    velRealY=0;
  }

  if(funcFrameDepois) funcFrameDepois();

  for(let i=0; i<numObst; i++){
    if(obsts[i].classList.contains("visivel")){
      obsts[i].funcMov();
    }
  }


  // Obstáculos

  {
    let cond=multFF>0;
    for(let i=0; i<numObst; i++){
      if((cond? t>=obsts[i].tSurg: t<=obsts[i].tSurg) && !obsts[i].apareceu){
        obsts[i].funcApar();
        obsts[i].classList.add("visivel");
        obsts[i].apareceu=true;
      }
    }
  }


  // Dano

  if(invul>0){
    invul--;
    if(invul%20==10){
      coracao.classList.add("pseudoOculto");
    }
    else if(invul%20===0){
      coracao.classList.remove("pseudoOculto");
    }
  }
  else{
    // Hitbox!!!
    // A hitbox do coração está sendo assumida como circular de raio 6 (hbc==6).

    ccx=x+roac;
    ccy=y+roac;
    // Coordenadas do centro do coração x/y. Relembrando que roac é o raio do coração.

    for(let i=0; i<numObst; i++){
      if(obsts[i].dano&&
        obsts[i].classList.contains("visivel")&&(
          obsts[i].classList.contains("branco")||
          (obsts[i].classList.contains("laranja")&&velRealX==0&&velRealY==0)||
          (obsts[i].classList.contains("azul")&&(velRealX!=0||velRealY!=0))
      )){
        if(obsts[i].hitbox()){
          dano(obsts[i]);
          break;
        }
      }
    }
  }


  if(multFF!=0){
    atualizarPosCor();
    t+=multFF; // Incrementa tempo
  }
}


// Menu

const divMenu=document.querySelector("#menu");
const btnsMenu=document.querySelectorAll("#menu button");
const modais=document.querySelectorAll(".modal");

btnsMenu[0].addEventListener("click",inicFase);

function exit(){ // TODO: Terminar!
  app.classList.add("oculto");
  divMenu.classList.remove("oculto");
  removeEventListener("keyup",keyup);
  removeEventListener("keydown",keydown);
  if(pararJogo!=undefined) clearInterval(pararJogo);
  if(pararTxt!=undefined) clearInterval(pararTxt);

  for(let i=0; i<tudo.length; i++){
    const el=tudo[i];
    const attrsInic=el.attrsInic;
    const attrsAtuais=el.attributes;
    for(let j=0; j<attrsAtuais.length; j++){
      el.removeAttribute(attrsAtuais[j].name);
    }
    for(let j=0; j<attrsInic.length; j++){
      const attr=attrsInic[j];
      el.setAttribute(attr.name,attr.value);
    }
  }
}
