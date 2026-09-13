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
    dataHoraEmissao: '<AAAA-MM-DDThh:mm:ss-03:00>',
    municipio: '<codigo IBGE do municipio>',
    uf: '<UF>',
    itens: [{ numero: 1, nbs: nbsCodigo, cst: cst, baseCalculo: '<valor da operacao>', quantidade: 1, unidade: 'UN', cClassTrib: cclasstrib }],
  };
  const json = JSON.stringify(payloadObj, null, 2);
  let html = '<div class="payload-bloco">';
  html += '<h4>Payload de teste — POST /calculadora/regime-geral</h4>';
  html += '<p class="payload-nota">Referente ao item ' + itemCodigo + ' / NBS ' + nbsCodigo + '. Adaptado do schema oficial: o campo <code>ncm</code> da documentação foi trocado por <code>nbs</code>, já que este é um item de serviço — confirme o nome exato do campo na documentação da calculadora offline que você instalar. Preencha os campos entre &lt; &gt; antes de enviar.</p>';
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

  const cclassParaComparar = cClassTribReg || cClassTrib;
  if (!cClassTrib) {
    html += renderChecagem('erro', 'cClassTrib não encontrado no XML', 'Não achei a tag &lt;cClassTrib&gt; dentro de &lt;gIBSCBS&gt;.');
  } else {
    if (CST && cClassTrib.substring(0, 3) !== CST) {
      html += renderChecagem('erro', 'CST declarado (' + CST + ') não bate com os 3 primeiros dígitos do cClassTrib (' + cClassTrib + ')', 'Isso não deveria acontecer — vale checar o emissor.');
    } else {
      html += renderChecagem('ok', 'CST ' + CST + ' é coerente com o cClassTrib ' + cClassTrib, '');
    }

    if (cClassTribReg) {
      html += renderChecagem('alerta', 'Regime especial detectado: cClassTrib ' + cClassTrib + ' (CST ' + CST + ')', 'Existe um &lt;gTribRegular&gt; no XML, indicando que a classificação "de cima" é um regime especial (suspensão, diferimento etc). A classificação regular por trás é ' + cClassTribReg + ' (CST ' + CSTReg + ') — é ela que comparo com o Anexo VIII abaixo.');
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
      html += renderOperacional(fundPrincipal.operacional);
      html += '<div class="fundamento-trilha">' + fundPrincipal.referencia.join(' › ') + '</div>';
      html += '<div class="fundamento-texto">' + fundPrincipal.texto.replace(/\n/g, '<br>') + '</div>';
      html += '</div>';
    } else {
      html += renderChecagem('alerta', 'cClassTrib ' + cClassTrib + ' não encontrado no nosso catálogo de fundamentações (161 códigos)', 'Pode ser um código muito recente ou uma divergência de digitação.');
    }
  }

  if (cClassTrib) {
    const payloadObj = {
      id: infNFSe.getAttribute('Id') || '<gerar-id-unico>',
      versao: '0.0.1',
      dataHoraEmissao: dhEmi || '<AAAA-MM-DDThh:mm:ss-03:00>',
      municipio: cLocPrestacao || '<codigo IBGE do municipio>',
      uf: '<UF>',
      itens: [{
        numero: 1,
        nbs: nbsFormatado || '<NBS>',
        cst: CST,
        baseCalculo: vBC || vServ || '<valor da operacao>',
        quantidade: 1,
        unidade: 'UN',
        cClassTrib: cClassTrib,
        ...(cClassTribReg ? { tributacaoRegular: { cst: CSTReg, cClassTrib: cClassTribReg } } : {}),
      }],
    };
    const json = JSON.stringify(payloadObj, null, 2);
    html += '<div class="payload-bloco">';
    html += '<h4>Payload de teste — POST /calculadora/regime-geral</h4>';
    html += '<p class="payload-nota">Montado com os valores reais deste XML — reflete exatamente o que está na nota, inclusive se for regime especial. O campo <code>uf</code> não vem explícito no XML nessa forma — preencha antes de enviar. Confirme o nome exato dos campos na documentação da calculadora offline que você instalar.</p>';
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
  inputItem.addEventListener('input', () => {
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
