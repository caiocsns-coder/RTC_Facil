/* RTC Fácil — interface (depende de assets/dados.js já carregado) */

function cstBadge(cst) {
  const info = CST_INFO[cst];
  const titulo = info ? (info.nome + ' — ' + info.finalidade) : 'CST não catalogado';
  return '<span class="cst-badge" title="' + titulo.replace(/"/g, '&quot;') + '">CST ' + cst + '</span>';
}

function flagSelo(v) {
  if (v === 'S') return '<span class="selo-flag sim">Sim</span>';
  if (v === 'N') return '<span class="selo-flag nao">Não</span>';
  return '<span class="selo-flag indef">Indiferente</span>';
}

function formataData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return d + '/' + m + '/' + a;
}

function simNao(v) {
  return v ? '<span class="selo-flag sim">Sim</span>' : '<span class="selo-flag nao">Não</span>';
}

// Alíquotas de referência nacionais vigentes em 2026 (ano-teste da Reforma —
// vêm direto da tabela ALIQUOTA_REFERENCIA do banco oficial da calculadora).
// A partir de 2027 este mecanismo muda (entram alíquotas por UF/Município e o
// campo aliquotasNominais no payload) — esta estimativa vale só para 2026.
const ALIQUOTA_REFERENCIA_2026 = { cbs: 0.9, ibsUf: 0.1, ibsMun: 0.0, vigenciaInicio: '2026-01-01', vigenciaFim: '2026-12-31' };
const TIPOS_ALIQUOTA_ESTIMAVEIS = ['Padrão', 'Uniforme nacional (referência)', 'Sem alíquota'];

function estimarAliquota(op) {
  if (!op || !TIPOS_ALIQUOTA_ESTIMAVEIS.includes(op.tipoAliquota)) {
    return { computavel: false, motivo: op ? op.tipoAliquota : null };
  }
  if (op.tipoAliquota === 'Sem alíquota') {
    return { computavel: true, cbs: 0, ibsUf: 0, ibsMun: 0 };
  }
  const r = ALIQUOTA_REFERENCIA_2026;
  return {
    computavel: true,
    cbs: r.cbs * (1 - (op.reducaoCbs || 0) / 100),
    ibsUf: r.ibsUf * (1 - (op.reducaoIbsUf || 0) / 100),
    ibsMun: r.ibsMun * (1 - (op.reducaoIbsMun || 0) / 100),
  };
}

function formatarPct(v) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '%';
}

function renderEstimativaAliquota(op, baseCalculo) {
  const est = estimarAliquota(op);
  let html = '<div class="estimativa-caixa">';
  if (!est.computavel) {
    html += '<div class="estimativa-titulo">Estimativa de alíquota efetiva (2026)</div>';
    html += '<div class="estimativa-indisponivel">Tipo de alíquota "' + (est.motivo || '—') + '" não segue a fórmula simples de alíquota de referência × redução — não estimamos aqui pra não arriscar um número errado. Use a calculadora oficial.</div>';
  } else {
    const total = est.cbs + est.ibsUf + est.ibsMun;
    html += '<div class="estimativa-titulo">Estimativa de alíquota efetiva — 2026 <span class="estimativa-selo">alíquotas de teste</span></div>';
    html += '<div class="estimativa-linha">CBS ' + formatarPct(est.cbs) + ' · IBS-UF ' + formatarPct(est.ibsUf) + ' · IBS-Mun ' + formatarPct(est.ibsMun) + ' <strong>(total ' + formatarPct(total) + ')</strong></div>';
    if (baseCalculo && !isNaN(parseFloat(baseCalculo))) {
      const bc = parseFloat(baseCalculo);
      const vCbs = bc * est.cbs / 100, vIbsUf = bc * est.ibsUf / 100, vIbsMun = bc * est.ibsMun / 100;
      const fmt = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      html += '<div class="estimativa-linha">Sobre R$ ' + bc.toLocaleString('pt-BR', {minimumFractionDigits:2}) + ': CBS ' + fmt(vCbs) + ' · IBS-UF ' + fmt(vIbsUf) + ' · IBS-Mun ' + fmt(vIbsMun) + ' <strong>(total ' + fmt(vCbs+vIbsUf+vIbsMun) + ')</strong></div>';
    }
    html += '<div class="estimativa-nota">Estimativa própria (referência × redução), não é a calculadora oficial — as alíquotas de referência de 2026 ainda são de teste/calibração, e a partir de 2027 o mecanismo muda. Confirme sempre na calculadora oficial antes de usar em produção.</div>';
  }
  html += '</div>';
  return html;
}

function renderOperacional(op) {
  if (!op) return '';
  let html = '<div class="op-grid">';
  html += '<div><span class="op-rotulo">Tratamento</span>' + op.tratamento + ' <span class="op-tipo">(' + op.tipoAliquota + ')</span></div>';
  if (op.possuiReducao) {
    html += '<div><span class="op-rotulo">Redução</span>CBS ' + op.reducaoCbs + '% · IBS-UF ' + op.reducaoIbsUf + '% · IBS-Mun ' + op.reducaoIbsMun + '%</div>';
  } else {
    html += '<div><span class="op-rotulo">Redução</span>Sem redução</div>';
  }
  html += '<div><span class="op-rotulo">Crédito do adquirente</span>CBS ' + simNao(op.creditoAdqCbs) + ' · IBS ' + simNao(op.creditoAdqIbs) + '</div>';
  html += '<div><span class="op-rotulo">Crédito presumido</span>Fornecedor ' + simNao(op.creditoPresFornecedor) + ' · Adquirente ' + simNao(op.creditoPresAdquirente) + '</div>';
  html += '<div><span class="op-rotulo">Créd. operação antecedente</span>' + (op.creditoOperAntecedente || '—') + '</div>';
  html += '<div><span class="op-rotulo">Incompat. c/ suspensão</span>' + simNao(op.incompativelSuspensao) + ' <span class="op-tipo">· exige desoneração ' + simNao(op.exigeDesoneracao) + '</span></div>';
  html += '<div><span class="op-rotulo">Aplica-se a</span>' + op.tiposDfe.map(t => '<span class="dfe-badge">' + t + '</span>').join(' ') + '</div>';
  html += '<div><span class="op-rotulo">Atualizado em</span>' + formataData(op.atualizadoEm) + '</div>';
  html += '</div>';
  return html;
}

function renderPayload(itemCodigo, nbsCodigo, cst, cclasstrib, chave) {
  const payloadObj = {
    id: '<gerar-id-unico>',
    versao: '0.0.1',
    dhFatoGerador: '<AAAA-MM-DDThh:mm:ss-03:00>',
    municipio: '<codigo IBGE do municipio>',
    uf: '<UF>',
    tpDoc: 91,
    itens: [{ numero: 1, nbs: nbsCodigo, cst: cst, baseCalculo: '<valor da operacao>', quantidade: 1, unidade: 'UN', cClassTrib: cclasstrib }],
  };
  const json = JSON.stringify(payloadObj, null, 2);
  let html = '<div class="payload-bloco">';
  html += '<h4>Payload de teste — POST /calculadora/regime-geral</h4>';
  html += '<p class="payload-nota">Referente ao item ' + itemCodigo + ' / NBS ' + nbsCodigo + '. Campo <code>nbs</code> confirmado no schema oficial (não é adaptação). <code>tpDoc: 91</code> = NFS-e. Preencha os campos entre &lt; &gt; antes de enviar. <strong>Atenção:</strong> para fato gerador a partir de 01/01/2027, o schema passa a exigir também o campo <code>aliquotasNominais</code> (cbs, ibsEstadual, ibsMunicipal) — sem ele a calculadora rejeita a requisição.</p>';
  html += '<pre class="payload-json" id="payload-' + chave + '">' + json.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
  html += '<button type="button" class="botao-copiar" data-chave="' + chave + '">Copiar JSON</button>';
  html += '</div>';
  return html;
}

function ativarCopiar(escopo) {
  escopo.querySelectorAll('.botao-copiar').forEach(el => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const pre = document.getElementById('payload-' + el.dataset.chave);
      navigator.clipboard.writeText(pre.textContent).then(() => {
        const original = el.textContent;
        el.textContent = 'Copiado!';
        setTimeout(() => { el.textContent = original; }, 1500);
      }).catch(() => { el.textContent = 'Selecione e copie manualmente'; });
    });
  });
}

// ---------- Consulta de combinações ----------
function renderItem(i) {
  const alvo = document.getElementById('resultado');
  let html = '<div class="resultado-cabecalho"><span class="tag-item">' + i.codigo + '</span><h2>' + i.descricao + '</h2></div>';
  html += '<p class="contagem-nbs">' + i.nbs.length + ' código(s) NBS associados</p>';

  i.nbs.forEach((n, idx) => {
    const csts = [...new Set(n.classificacoes.map(c => c.cst))];
    html += '<div class="nbs-card">';
    html += '<div class="nbs-cabecalho" data-idx="' + idx + '">';
    html += '<span class="nbs-cod">' + n.codigo + '</span>';
    html += '<span class="nbs-desc">' + n.descricao + '</span>';
    html += '<span class="nbs-resumo">' + csts.map(cstBadge).join(' ') + '</span>';
    html += '</div>';

    html += '<div class="nbs-detalhe" data-idx="' + idx + '">';
    html += '<h4>Cenários de incidência (INDOP)</h4>';
    html += '<table class="mini"><thead><tr><th>P/S onerosa</th><th>Adq. exterior</th><th>INDOP</th><th>Local de incidência (IBS)</th></tr></thead><tbody>';
    n.cenarios.forEach(c => {
      html += '<tr><td>' + flagSelo(c.psOnerosa) + '</td><td>' + flagSelo(c.adqExterior) + '</td><td>' + (c.indop || '—') + '</td><td>' + (c.local || '—') + '</td></tr>';
    });
    html += '</tbody></table>';

    html += '<h4>Classificações tributárias (cClassTrib)</h4>';
    html += '<table class="mini"><thead><tr><th>cClassTrib</th><th>CST</th><th>Descrição</th><th>Detalhes</th></tr></thead><tbody>';
    n.classificacoes.forEach((c, cidx) => {
      const fund = FUNDAMENTACAO[c.cclasstrib];
      const chave = idx + '-' + cidx;
      const rotulo = fund ? fund.textoCurto : 'ver payload';
      html += '<tr><td>' + c.cclasstrib + '</td><td>' + cstBadge(c.cst) + '</td><td>' + (c.nome || '—') + '</td><td><span class="link-fundamento" data-chave="' + chave + '">' + rotulo + '</span></td></tr>';

      html += '<tr class="linha-fundamento oculta" data-chave="' + chave + '"><td colspan="4">';
      html += '<div class="fundamento-caixa">';
      if (fund) {
        html += renderEstimativaAliquota(fund.operacional, null);
        html += renderOperacional(fund.operacional);
        html += '<div class="fundamento-trilha">' + fund.referencia.join(' › ') + '</div>';
        html += '<div class="fundamento-texto">' + fund.texto.replace(/\n/g, '<br>') + '</div>';
      }
      html += renderPayload(i.codigo, n.codigo, c.cst, c.cclasstrib, chave);
      html += '</div></td></tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';
  });

  alvo.innerHTML = html;
  alvo.querySelectorAll('.nbs-cabecalho').forEach(el => {
    el.addEventListener('click', () => {
      alvo.querySelector('.nbs-detalhe[data-idx="' + el.dataset.idx + '"]').classList.toggle('aberto');
    });
  });
  alvo.querySelectorAll('.link-fundamento').forEach(el => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      alvo.querySelector('.linha-fundamento[data-chave="' + el.dataset.chave + '"]').classList.toggle('oculta');
    });
  });
  ativarCopiar(alvo);
}

function renderNbs(codigo, descricaoNbs) {
  const alvo = document.getElementById('resultado');
  const entradas = NBS_INDEX[codigo];
  if (!entradas || entradas.length === 0) {
    alvo.innerHTML = '<div class="aviso-vazio">Esse NBS não está correlacionado a nenhum item da LC 116 na nossa base.</div>';
    return;
  }

  let html = '<div class="resultado-cabecalho"><span class="tag-item">' + codigo + '</span><h2>' + descricaoNbs + '</h2></div>';
  html += '<p class="contagem-nbs">' + entradas.length + ' item(ns) da LC 116 associados</p>';

  entradas.forEach((e, idx) => {
    const csts = [...new Set(e.classificacoes.map(c => c.cst))];
    html += '<div class="nbs-card">';
    html += '<div class="nbs-cabecalho" data-idxnbs="' + idx + '">';
    html += '<span class="nbs-cod">' + e.item + '</span>';
    html += '<span class="nbs-desc">' + e.itemDescricao + '</span>';
    html += '<span class="nbs-resumo">' + csts.map(cstBadge).join(' ') + '</span>';
    html += '</div>';

    html += '<div class="nbs-detalhe" data-idxnbs="' + idx + '">';
    html += '<h4>Cenários de incidência (INDOP)</h4>';
    html += '<table class="mini"><thead><tr><th>P/S onerosa</th><th>Adq. exterior</th><th>INDOP</th><th>Local de incidência (IBS)</th></tr></thead><tbody>';
    e.cenarios.forEach(c => {
      html += '<tr><td>' + flagSelo(c.psOnerosa) + '</td><td>' + flagSelo(c.adqExterior) + '</td><td>' + (c.indop || '—') + '</td><td>' + (c.local || '—') + '</td></tr>';
    });
    html += '</tbody></table>';

    html += '<h4>Classificações tributárias (cClassTrib)</h4>';
    html += '<table class="mini"><thead><tr><th>cClassTrib</th><th>CST</th><th>Descrição</th><th>Detalhes</th></tr></thead><tbody>';
    e.classificacoes.forEach((c, cidx) => {
      const fund = FUNDAMENTACAO[c.cclasstrib];
      const chave = 'nbs' + idx + '-' + cidx;
      const rotulo = fund ? fund.textoCurto : 'ver payload';
      html += '<tr><td>' + c.cclasstrib + '</td><td>' + cstBadge(c.cst) + '</td><td>' + (c.nome || '—') + '</td><td><span class="link-fundamento" data-chavenbs="' + chave + '">' + rotulo + '</span></td></tr>';

      html += '<tr class="linha-fundamento oculta" data-chavenbs="' + chave + '"><td colspan="4">';
      html += '<div class="fundamento-caixa">';
      if (fund) {
        html += renderEstimativaAliquota(fund.operacional, null);
        html += renderOperacional(fund.operacional);
        html += '<div class="fundamento-trilha">' + fund.referencia.join(' › ') + '</div>';
        html += '<div class="fundamento-texto">' + fund.texto.replace(/\n/g, '<br>') + '</div>';
      }
      html += renderPayload(e.item, codigo, c.cst, c.cclasstrib, chave);
      html += '</div></td></tr>';
    });
    html += '</tbody></table>';
    html += '</div></div>';
  });

  alvo.innerHTML = html;
  alvo.querySelectorAll('.nbs-cabecalho').forEach(el => {
    el.addEventListener('click', () => {
      alvo.querySelector('.nbs-detalhe[data-idxnbs="' + el.dataset.idxnbs + '"]').classList.toggle('aberto');
    });
  });
  alvo.querySelectorAll('.link-fundamento').forEach(el => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      alvo.querySelector('.linha-fundamento[data-chavenbs="' + el.dataset.chavenbs + '"]').classList.toggle('oculta');
    });
  });
  ativarCopiar(alvo);
}

// ---------- Validador de XML ----------
function icone(status) {
  const cls = { ok: 'ok', erro: 'erro', alerta: 'alerta' }[status];
  const simb = { ok: '✓', erro: '✕', alerta: '!' }[status];
  return '<span class="check-icone ' + cls + '">' + simb + '</span>';
}

function renderChecagem(status, titulo, detalhe) {
  return '<div class="check-item">' + icone(status) + '<div class="check-corpo"><div class="check-titulo">' + titulo + '</div><div class="check-detalhe">' + (detalhe || '') + '</div></div></div>';
}

function processarXml(texto) {
  const alvo = document.getElementById('resultado-xml');
  let doc;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(texto, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('XML mal formado');
  } catch (e) {
    alvo.innerHTML = '<div class="erro-xml">Não consegui ler esse XML. Confira se o conteúdo está completo e bem formado.</div>';
    return;
  }

  const infNFSe = doc.getElementsByTagName('infNFSe')[0];
  if (!infNFSe) {
    alvo.innerHTML = '<div class="erro-xml">Não encontrei a tag &lt;infNFSe&gt; — confirme que este é um XML de NFS-e no padrão nacional.</div>';
    return;
  }
  const dps = infNFSe.getElementsByTagName('infDPS')[0];

  const nNFSe = getTxt(infNFSe, 'nNFSe');
  const xLocPrestacao = getTxt(infNFSe, 'xLocPrestacao');
  const xTribNac = getTxt(infNFSe, 'xTribNac');
  const xNBS = getTxt(infNFSe, 'xNBS');
  const emitNome = getTxt(infNFSe.getElementsByTagName('emit')[0], 'xNome');
  const tomaNome = dps ? getTxt(dps.getElementsByTagName('toma')[0], 'xNome') : null;
  const vServ = dps ? getTxt(dps.getElementsByTagName('vServPrest')[0], 'vServ') : null;
  const vBC = getTxt(infNFSe.getElementsByTagName('valores')[0], 'vBC');
  const dhEmi = dps ? getTxt(dps, 'dhEmi') : null;

  const cServ = dps ? dps.getElementsByTagName('cServ')[0] : null;
  const cTribNac = getTxt(cServ, 'cTribNac');
  const cNBSraw = getTxt(cServ, 'cNBS');
  const cLocPrestacao = dps ? getTxt(dps.getElementsByTagName('locPrest')[0], 'cLocPrestacao') : null;

  const ibscbsDps = dps ? dps.getElementsByTagName('IBSCBS')[0] : null;
  const cIndOp = ibscbsDps ? getTxt(ibscbsDps, 'cIndOp') : null;
  const gIBSCBS = ibscbsDps ? ibscbsDps.getElementsByTagName('gIBSCBS')[0] : null;
  const CST = gIBSCBS ? getTxt(gIBSCBS, 'CST') : null;
  const cClassTrib = gIBSCBS ? getTxt(gIBSCBS, 'cClassTrib') : null;
  const gTribRegular = gIBSCBS ? gIBSCBS.getElementsByTagName('gTribRegular')[0] : null;
  const CSTReg = gTribRegular ? getTxt(gTribRegular, 'CSTReg') : null;
  const cClassTribReg = gTribRegular ? getTxt(gTribRegular, 'cClassTribReg') : null;

  const itemLC116 = formatarItemLC116(cTribNac);
  const nbsFormatado = formatarNbsDaXml(cNBSraw);

  let html = '<div class="relatorio-cabecalho"><h2>Relatório de conformidade</h2></div>';

  html += '<div class="resumo-doc">';
  html += '<div><span class="rot">NFS-e nº</span>' + (nNFSe || '—') + '</div>';
  html += '<div><span class="rot">Emissão</span>' + (dhEmi || '—') + '</div>';
  html += '<div><span class="rot">Prestador</span>' + (emitNome || '—') + '</div>';
  html += '<div><span class="rot">Tomador</span>' + (tomaNome || '—') + '</div>';
  html += '<div><span class="rot">Valor do serviço</span>' + (vServ ? 'R$ ' + vServ : '—') + '</div>';
  html += '<div><span class="rot">Local da prestação</span>' + (xLocPrestacao || '—') + '</div>';
  html += '</div>';

  const item = itemLC116 ? ITENS.find(i => i.codigo === itemLC116) : null;
  if (!cTribNac) {
    html += renderChecagem('erro', 'Código do item da LC 116 não encontrado no XML', 'Não achei a tag &lt;cTribNac&gt; dentro de &lt;cServ&gt;.');
  } else if (!item) {
    html += renderChecagem('alerta', 'Item ' + itemLC116 + ' (cTribNac ' + cTribNac + ') não está na nossa base do Anexo VIII', 'Pode ser um item que não existe, ou nossa base pode estar desatualizada.');
  } else {
    html += renderChecagem('ok', 'Item ' + itemLC116 + ' encontrado — ' + item.descricao, xTribNac ? 'Descrição no XML: "' + xTribNac + '"' : '');
  }

  let nbsEntradaCorrespondente = null;
  if (!cNBSraw) {
    html += renderChecagem('erro', 'Código NBS não encontrado no XML', 'Não achei a tag &lt;cNBS&gt; dentro de &lt;cServ&gt;.');
  } else {
    const entradasNbs = NBS_INDEX[nbsFormatado];
    if (!entradasNbs) {
      html += renderChecagem('alerta', 'NBS ' + nbsFormatado + ' não está na nossa base do Anexo VIII', xNBS ? 'Descrição no XML: "' + xNBS + '"' : '');
    } else {
      nbsEntradaCorrespondente = entradasNbs.find(e => e.item === itemLC116) || null;
      if (nbsEntradaCorrespondente) {
        html += renderChecagem('ok', 'NBS ' + nbsFormatado + ' confere com o item ' + itemLC116, nbsEntradaCorrespondente.nbsDescricao);
      } else {
        const outrosItens = entradasNbs.map(e => e.item).join(', ');
        html += renderChecagem('alerta', 'NBS ' + nbsFormatado + ' existe no Anexo VIII, mas não sob o item ' + itemLC116, 'Na nossa base, esse NBS aparece associado a: ' + outrosItens + '. Pode ser só uma variação não catalogada — vale conferir.');
      }
    }
  }

  if (!cIndOp) {
    html += renderChecagem('erro', 'INDOP não encontrado no XML', 'Não achei a tag &lt;cIndOp&gt; dentro de &lt;IBSCBS&gt;.');
  } else if (nbsEntradaCorrespondente) {
    const indopsValidos = nbsEntradaCorrespondente.cenarios.map(c => c.indop);
    if (indopsValidos.includes(cIndOp)) {
      html += renderChecagem('ok', 'INDOP ' + cIndOp + ' é um cenário válido para esse NBS', '');
    } else {
      html += renderChecagem('alerta', 'INDOP ' + cIndOp + ' não está entre os cenários que temos catalogados para esse NBS', 'Cenários esperados: ' + indopsValidos.join(', '));
    }
  } else {
    html += renderChecagem('alerta', 'INDOP ' + cIndOp + ' — não deu pra verificar', 'Só valido o INDOP quando o NBS bate com o item (ver checagem acima).');
  }

  const fundPrincipalPrevia = cClassTrib ? FUNDAMENTACAO[cClassTrib] : null;
  const exigeDesoneracao = !!(fundPrincipalPrevia && fundPrincipalPrevia.operacional.exigeDesoneracao);
  const cclassParaComparar = cClassTribReg || cClassTrib;
  if (!cClassTrib) {
    html += renderChecagem('erro', 'cClassTrib não encontrado no XML', 'Não achei a tag &lt;cClassTrib&gt; dentro de &lt;gIBSCBS&gt;.');
  } else {
    if (CST && cClassTrib.substring(0, 3) !== CST) {
      html += renderChecagem('erro', 'CST declarado (' + CST + ') não bate com os 3 primeiros dígitos do cClassTrib (' + cClassTrib + ')', 'Isso não deveria acontecer — vale checar o emissor.');
    } else {
      html += renderChecagem('ok', 'CST ' + CST + ' é coerente com o cClassTrib ' + cClassTrib, '');
    }

    if (exigeDesoneracao && !cClassTribReg) {
      html += renderChecagem('erro', 'Falta o grupo de tributação regular (gTribRegular)', 'O cClassTrib ' + cClassTrib + ' (' + (fundPrincipalPrevia ? fundPrincipalPrevia.operacional.tratamento : '') + ') exige informar a tributação regular — sem isso, a calculadora oficial rejeitaria essa nota com o erro "tributação regular não informada". Confira com o emissor.');
    } else if (exigeDesoneracao && cClassTribReg) {
      html += renderChecagem('ok', 'Regime especial com desoneração — gTribRegular informado corretamente', 'cClassTrib ' + cClassTrib + ' (CST ' + CST + ') exige a tributação regular, e ela veio: ' + cClassTribReg + ' (CST ' + CSTReg + ') — é essa que comparo com o Anexo VIII abaixo.');
      const fundRegular = FUNDAMENTACAO[cClassTribReg];
      if (fundRegular && fundRegular.operacional.incompativelSuspensao) {
        html += renderChecagem('erro', 'Classificação regular incompatível com suspensão', 'A tributação regular informada (' + cClassTribReg + ') é ela mesma marcada como incompatível com suspensão/desoneração — essa combinação seria rejeitada pela calculadora oficial.');
      }
    } else if (!exigeDesoneracao && cClassTribReg) {
      html += renderChecagem('alerta', 'gTribRegular informado, mas não é obrigatório para ' + cClassTrib, 'Não é erro — a calculadora aceita, só não exige nesse caso. Comparando ' + cClassTribReg + ' com o Anexo VIII mesmo assim.');
    }

    if (nbsEntradaCorrespondente) {
      const classifsValidas = nbsEntradaCorrespondente.classificacoes.map(c => c.cclasstrib);
      if (classifsValidas.includes(cclassParaComparar)) {
        html += renderChecagem('ok', 'Classificação ' + cclassParaComparar + ' bate com o Anexo VIII para esse NBS', '');
      } else {
        html += renderChecagem('alerta', 'Classificação ' + cclassParaComparar + ' não está entre as esperadas pelo Anexo VIII para esse NBS', 'Esperadas: ' + classifsValidas.join(', ') + '. Pode ser um regime especial legítimo não coberto pela correlação padrão — ver fundamentação abaixo.');
      }
    }

    const fundPrincipal = FUNDAMENTACAO[cClassTrib];
    if (fundPrincipal) {
      html += '<div class="fundamento-caixa" style="margin-top:10px;">';
      html += '<div class="check-titulo" style="margin-bottom:8px;">Fundamentação do cClassTrib ' + cClassTrib + '</div>';
      html += renderEstimativaAliquota(fundPrincipal.operacional, vBC || vServ);
      html += renderOperacional(fundPrincipal.operacional);
      html += '<div class="fundamento-trilha">' + fundPrincipal.referencia.join(' › ') + '</div>';
      html += '<div class="fundamento-texto">' + fundPrincipal.texto.replace(/\n/g, '<br>') + '</div>';
      html += '</div>';
    } else {
      html += renderChecagem('alerta', 'cClassTrib ' + cClassTrib + ' não encontrado no nosso catálogo de fundamentações (109 códigos)', 'Pode ser um código muito recente ou uma divergência de digitação.');
    }
  }

  if (cClassTrib) {
    const anoFatoGerador = dhEmi ? parseInt(dhEmi.substring(0, 4), 10) : null;
    const exigeAliquotasNominais = anoFatoGerador !== null && anoFatoGerador >= 2027;

    const payloadObj = {
      id: infNFSe.getAttribute('Id') || '<gerar-id-unico>',
      versao: '0.0.1',
      dhFatoGerador: dhEmi || '<AAAA-MM-DDThh:mm:ss-03:00>',
      municipio: cLocPrestacao || '<codigo IBGE do municipio>',
      uf: '<UF>',
      tpDoc: 91,
      itens: [{
        numero: 1,
        nbs: nbsFormatado || '<NBS>',
        cst: CST,
        baseCalculo: vBC || vServ || '<valor da operacao>',
        quantidade: 1,
        unidade: 'UN',
        cClassTrib: cClassTrib,
        ...(cClassTribReg ? { tributacaoRegular: { cst: CSTReg, cClassTrib: cClassTribReg } } : {}),
        ...(exigeAliquotasNominais ? { aliquotasNominais: { cbs: '<aliquota nominal CBS %>', ibsEstadual: '<aliquota nominal IBS-UF %>', ibsMunicipal: '<aliquota nominal IBS-Mun %>' } } : {}),
      }],
    };
    const json = JSON.stringify(payloadObj, null, 2);
    html += '<div class="payload-bloco">';
    html += '<h4>Payload de teste — POST /calculadora/regime-geral</h4>';
    html += '<p class="payload-nota">Montado com os valores reais deste XML — reflete exatamente o que está na nota, inclusive se for regime especial. O campo <code>uf</code> não vem explícito no XML nessa forma — preencha antes de enviar. <code>tpDoc: 91</code> = NFS-e. '
      + (exigeAliquotasNominais
        ? 'Fato gerador em ' + anoFatoGerador + ' — incluí <code>aliquotasNominais</code>, obrigatório a partir de 01/01/2027; preencha os valores reais antes de enviar.'
        : 'Fato gerador em ' + (anoFatoGerador || '?') + ' — <code>aliquotasNominais</code> não se aplica ainda (só passa a ser exigido a partir de 01/01/2027).')
      + '</p>';
    html += '<pre class="payload-json" id="payload-xml">' + json.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
    html += '<button type="button" class="botao-copiar" data-chave="xml">Copiar JSON</button>';
    html += '</div>';
  }

  alvo.innerHTML = html;
  ativarCopiar(alvo);
}

// ---------- Inicialização ----------
async function iniciar() {
  await carregarBase();

  document.getElementById('total-itens').textContent = ITENS.length;
  const nbsSet = new Set();
  const cclassSet = new Set();
  ITENS.forEach(i => i.nbs.forEach(n => { nbsSet.add(n.codigo); n.classificacoes.forEach(c => cclassSet.add(c.cclasstrib)); }));
  document.getElementById('total-nbs').textContent = nbsSet.size;
  document.getElementById('total-cclass').textContent = cclassSet.size;
  document.getElementById('total-cst').textContent = Object.keys(CST_INFO).length;

  document.querySelectorAll('nav.tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('ativa'));
      document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
      btn.classList.add('ativa');
      document.getElementById(btn.dataset.painel).classList.add('ativo');
    });
  });

  const inputItem = document.getElementById('busca-item');
  const sugestoesItem = document.getElementById('sugestoes-item');
  let itemAtual = null;

  inputItem.addEventListener('input', () => {
    itemAtual = null;
    const termo = normaliza(inputItem.value.trim());
    if (termo.length < 1) { sugestoesItem.hidden = true; return; }
    const achados = ITENS.filter(i => normaliza(i.codigo).includes(termo) || normaliza(i.descricao).includes(termo)).slice(0, 10);
    sugestoesItem.innerHTML = '';
    if (achados.length === 0) {
      sugestoesItem.innerHTML = '<div class="vazio">Nenhum item encontrado</div>';
    } else {
      achados.forEach(i => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = '<span class="cod">' + i.codigo + '</span><span class="desc">' + i.descricao + '</span>';
        div.addEventListener('click', () => {
          inputItem.value = i.codigo + ' — ' + i.descricao;
          inputNbs.value = '';
          itemAtual = i;
          sugestoesItem.hidden = true;
          renderItem(i);
        });
        sugestoesItem.appendChild(div);
      });
    }
    sugestoesItem.hidden = false;
  });
  document.addEventListener('click', (e) => {
    if (!sugestoesItem.contains(e.target) && e.target !== inputItem) sugestoesItem.hidden = true;
  });

  // ---------- Autocomplete NBS ----------
  const inputNbs = document.getElementById('busca-nbs');
  const sugestoesNbs = document.getElementById('sugestoes-nbs');
  let nbsLista = null;

  function montarListaNbs() {
    if (nbsLista) return nbsLista;
    const vistos = {};
    nbsLista = [];
    ITENS.forEach(i => {
      i.nbs.forEach(n => {
        if (!vistos[n.codigo]) {
          vistos[n.codigo] = true;
          nbsLista.push({ codigo: n.codigo, descricao: n.descricao });
        }
      });
    });
    nbsLista.sort((a, b) => a.codigo.localeCompare(b.codigo));
    return nbsLista;
  }

  inputNbs.addEventListener('input', () => {
    const termo = normaliza(inputNbs.value.trim());
    if (termo.length < 1) { sugestoesNbs.hidden = true; return; }
    const lista = itemAtual
      ? itemAtual.nbs.map(n => ({ codigo: n.codigo, descricao: n.descricao }))
      : montarListaNbs();
    const achados = lista.filter(n => normaliza(n.codigo).includes(termo) || normaliza(n.descricao).includes(termo)).slice(0, 10);
    sugestoesNbs.innerHTML = '';
    if (achados.length === 0) {
      const msgVazio = itemAtual
        ? 'Nenhum NBS desse item bate com a busca — ' + itemAtual.codigo + ' tem ' + itemAtual.nbs.length + ' NBS associados. Apague o campo "Item da LC 116" acima pra buscar entre todos os NBS.'
        : 'Nenhum NBS encontrado';
      sugestoesNbs.innerHTML = '<div class="vazio">' + msgVazio + '</div>';
    } else {
      achados.forEach(n => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = '<span class="cod">' + n.codigo + '</span><span class="desc">' + n.descricao + '</span>';
        div.addEventListener('click', () => {
          inputNbs.value = n.codigo + ' — ' + n.descricao;
          sugestoesNbs.hidden = true;
          if (itemAtual) {
            renderItem(itemAtual);
            const idx = itemAtual.nbs.findIndex(x => x.codigo === n.codigo);
            const cabecalho = document.querySelector('.nbs-cabecalho[data-idx="' + idx + '"]');
            const detalhe = document.querySelector('.nbs-detalhe[data-idx="' + idx + '"]');
            if (detalhe) detalhe.classList.add('aberto');
            if (cabecalho) cabecalho.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            inputItem.value = '';
            renderNbs(n.codigo, n.descricao);
          }
        });
        sugestoesNbs.appendChild(div);
      });
    }
    sugestoesNbs.hidden = false;
  });
  document.addEventListener('click', (e) => {
    if (!sugestoesNbs.contains(e.target) && e.target !== inputNbs) sugestoesNbs.hidden = true;
  });

  const botaoCst = document.getElementById('botao-cst');
  const painelCst = document.getElementById('painel-cst');
  botaoCst.addEventListener('click', () => {
    const abrindo = painelCst.hidden;
    if (abrindo && !painelCst.dataset.montado) {
      let html = '<table><thead><tr><th>Código</th><th>Descrição</th><th>Finalidade</th></tr></thead><tbody>';
      Object.keys(CST_INFO).sort().forEach(cod => {
        const info = CST_INFO[cod];
        html += '<tr><td class="cod">' + cod + '</td><td>' + info.nome + '</td><td>' + info.finalidade + '</td></tr>';
      });
      html += '</tbody></table>';
      painelCst.innerHTML = html;
      painelCst.dataset.montado = '1';
    }
    painelCst.hidden = !abrindo;
    botaoCst.textContent = abrindo ? 'Esconder tabela de CST' : 'Ver tabela de CST (IBS/CBS)';
  });

  const botaoRegimes = document.getElementById('botao-regimes');
  const painelRegimes = document.getElementById('painel-regimes');
  botaoRegimes.addEventListener('click', () => {
    const abrindo = painelRegimes.hidden;
    if (abrindo && !painelRegimes.dataset.montado) {
      const todos = Object.keys(FUNDAMENTACAO).filter(cod => FUNDAMENTACAO[cod].operacional.exigeDesoneracao);
      const doNfse = todos.filter(cod => FUNDAMENTACAO[cod].operacional.tiposDfe.includes('NFS-e'));
      const outros = todos.filter(cod => !FUNDAMENTACAO[cod].operacional.tiposDfe.includes('NFS-e'));

      let html = '<p style="font-size:12.5px;color:var(--ink-muted);margin:0 0 12px;">Regra oficial (código-fonte da calculadora): sempre que a classificação tributária tem a flag <code>exigeGrupoDesoneracao</code>, o XML é obrigado a informar <code>gTribRegular</code> — sem isso, a calculadora rejeita com "tributação regular não informada". De ' + Object.keys(FUNDAMENTACAO).length + ' classificações catalogadas, ' + todos.length + ' exigem — e dessas, só <strong>' + doNfse.length + '</strong> se aplicam a NFS-e (as demais são de NF-e/importação de mercadorias).</p>';

      html += '<h4 style="font-size:11px;text-transform:uppercase;color:var(--ink-muted);margin:0 0 6px;">Se aplicam a NFS-e</h4>';
      html += '<table><thead><tr><th>cClassTrib</th><th>Fundamento</th><th>Tratamento</th></tr></thead><tbody>';
      doNfse.forEach(cod => {
        const f = FUNDAMENTACAO[cod];
        html += '<tr><td class="cod">' + cod + '</td><td>' + f.textoCurto + '</td><td>' + f.operacional.tratamento + '</td></tr>';
      });
      html += '</tbody></table>';

      html += '<h4 style="font-size:11px;text-transform:uppercase;color:var(--ink-muted);margin:14px 0 6px;">Não se aplicam a NFS-e (mercadorias/importação — ' + outros.length + ' códigos)</h4>';
      html += '<p style="font-size:12px;color:var(--ink-muted);margin:0;">' + outros.map(cod => cod + ' (' + FUNDAMENTACAO[cod].operacional.tratamento + ')').join('; ') + '.</p>';

      painelRegimes.innerHTML = html;
      painelRegimes.dataset.montado = '1';
    }
    painelRegimes.hidden = !abrindo;
    botaoRegimes.textContent = abrindo ? 'Esconder regimes especiais' : 'Ver regimes especiais que exigem tributação regular';
  });

  document.getElementById('arquivo-xml').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { document.getElementById('texto-xml').value = ev.target.result; };
    reader.readAsText(file, 'UTF-8');
  });

  document.getElementById('botao-validar-xml').addEventListener('click', () => {
    const texto = document.getElementById('texto-xml').value.trim();
    if (!texto) {
      document.getElementById('resultado-xml').innerHTML = '<div class="erro-xml">Escolha um arquivo ou cole o XML antes de validar.</div>';
      return;
    }
    processarXml(texto);
  });
}

iniciar();
