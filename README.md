# RTC Fácil

Consulta da correlação oficial **Item LC 116 × NBS × INDOP × cClassTrib/CST**
do Anexo VIII da Reforma Tributária do Consumo (LC 214/2025), com
fundamentação legal completa — e um validador que confere se os campos
da reforma numa NFS-e estão coerentes entre si.

## Demo

👉 **[Abrir o RTC Fácil](#)** — *(substitua pelo link do GitHub Pages depois de publicar)*

## O que ele faz

**Consultar combinações** — digite um item da LC 116 (ex.: `07.02`) ou
parte da descrição do serviço, e veja:
- Todos os códigos NBS correlacionados a esse item
- Os cenários de INDOP (operação onerosa / adquirente no exterior →
  local de incidência do IBS) para cada NBS
- As classificações tributárias (cClassTrib) aplicáveis, com o CST
  derivado, os detalhes operacionais (percentual de redução, crédito do
  adquirente, crédito presumido, documentos fiscais aceitos) e a
  fundamentação legal (artigo da LC 214/2025, com o texto e a
  localização no diploma)
- Um payload de teste pronto para o endpoint `POST
  /calculadora/regime-geral` da Calculadora oficial de Tributos sobre o
  Consumo

**Validar XML de NFS-e** — suba ou cole o XML de uma NFS-e (padrão
nacional) e a ferramenta confere:
- Se o item da LC 116 (`cTribNac`) existe na base do Anexo VIII
- Se o NBS (`cNBS`) está correlacionado a esse item
- Se o INDOP (`cIndOp`) é um dos cenários esperados
- Se o CST bate com os 3 primeiros dígitos do cClassTrib
- Se a classificação tributária é coerente com o Anexo VIII — quando a
  nota usa um **regime especial** (suspensão, diferimento etc., via
  `gTribRegular`), a ferramenta detecta isso e compara a classificação
  regular por trás, que é o que de fato consta no Anexo VIII
- Gera um payload de teste com os valores reais do XML, pronto para
  conferir na calculadora oficial

**Importante:** o validador confere a *coerência estrutural* dos campos
— não calcula nem confirma se o valor de IBS/CBS destacado na nota está
certo. Isso só a calculadora oficial da Receita (rodando com as
alíquotas de referência vigentes) pode garantir.

## Privacidade

Site 100% estático — inclusive a validação de XML roda inteiramente no
seu navegador. Nenhum dado do XML (nem o arquivo, nem os campos
extraídos) sai da sua máquina ou é enviado a qualquer servidor.

## Como rodar localmente

É um site estático puro (HTML/CSS/JS), sem build step.

```bash
git clone <este-repositório>
cd rtcfacil
python3 -m http.server 8000
# abra http://localhost:8000
```

(precisa de um servidor local por causa do `fetch()` dos arquivos JSON
— abrir o `index.html` direto como `file://` não funciona por restrição
do navegador.)

## Publicando no GitHub Pages

1. Settings → Pages → Source: branch `main`, pasta `/ (root)`.
2. Pronto — o site fica em `https://<usuario>.github.io/<repo>/`.

**Atenção ao subir pelo upload web do GitHub:** arraste o *conteúdo* da
pasta (`assets/`, `data/`, `index.html`, `README.md`) — não a pasta em
si. Se arrastar a pasta inteira, o GitHub cria um nível a mais e o
Pages retorna 404 por não achar o `index.html` na raiz.

## Stack

- HTML/CSS/JS puro, sem framework, sem build.
- Dados do Anexo VIII processados a partir da planilha oficial,
  respeitando célula por célula as mesclagens do Excel original (item →
  NBS → cenários de INDOP → classificações tributárias).
- Fundamentação legal e detalhes operacionais de cada cClassTrib vêm do
  registro oficial de classificações tributárias e fundamentações
  legais da Reforma Tributária.

## Fonte e manutenção

- Dados extraídos do arquivo oficial "Anexo VIII — correlação item NBS
  INDOP cClassTrib (IBS/CBS)", v1.01.00.
- A tabela de CST (nomes e finalidades) foi cadastrada manualmente a
  partir da tabela oficial de CSTs da Reforma Tributária.
- Fundamentação legal e detalhes operacionais: 161 códigos cClassTrib
  cadastrados, cobrindo os 27 usados nas correlações do Anexo VIII.
- Se a Receita publicar uma nova versão de qualquer uma dessas fontes,
  os arquivos em `data/` precisam ser regenerados a partir dos dados
  novos.

## Licença

Todos os direitos reservados. Entre em contato antes de reutilizar o
código ou os dados processados para fins comerciais.
