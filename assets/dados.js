/* RTC Fácil — carregamento de dados e lógica de correlação/validação */

let ITENS = [];
let FUNDAMENTACAO = {};
let CST_INFO = {};
const NBS_INDEX = {};

async function carregarBase() {
  const [itensRes, fundRes, cstRes] = await Promise.all([
    fetch('data/itens.json'),
    fetch('data/fundamentacao.json'),
    fetch('data/cst-info.json'),
  ]);
  ITENS = await itensRes.json();
  FUNDAMENTACAO = await fundRes.json();
  CST_INFO = await cstRes.json();

  ITENS.forEach(i => {
    i.nbs.forEach(n => {
      if (!NBS_INDEX[n.codigo]) NBS_INDEX[n.codigo] = [];
      NBS_INDEX[n.codigo].push({
        item: i.codigo, itemDescricao: i.descricao, nbsDescricao: n.descricao,
        cenarios: n.cenarios, classificacoes: n.classificacoes,
      });
    });
  });
}

function normaliza(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function formatarItemLC116(cTribNac) {
  if (!cTribNac || cTribNac.length < 4) return null;
  return cTribNac.substring(0, 2) + '.' + cTribNac.substring(2, 4);
}

function formatarNbsDaXml(cNbs) {
  if (!cNbs) return null;
  const d = cNbs.padStart(9, '0');
  return d[0] + '.' + d.substring(1, 5) + '.' + d.substring(5, 7) + '.' + d.substring(7, 9);
}

function getTxt(pai, tag) {
  if (!pai) return null;
  const els = pai.getElementsByTagName(tag);
  return els.length ? els[0].textContent.trim() : null;
}
