# RTC Fácil

Consulta da correlação oficial **Item LC 116 × NBS × INDOP × cClassTrib/CST**
do Anexo VIII da Reforma Tributária do Consumo (LC 214/2025), com
fundamentação legal completa — e um validador que confere se os campos
da reforma numa NFS-e estão coerentes entre si.

## Demo

👉 **[Abrir o RTC Fácil](https://caiocsns-coder.github.io/RTC_Facil/)**

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

**Simples Nacional** — referência das 15 atividades oficiais e o(s)
Anexo(s) de apuração aplicável(is). Consulta independente da busca por
Item/NBS: a atividade é característica do optante, não do serviço de
cada nota.

**Importante:** o payload de teste (nas duas primeiras abas) foi
**testado rodando a calculadora oficial de verdade** (JAR + banco
SQLite reais) contra uma NFS-e real — confirmou suspensão REIDI
corretamente aplicada, com IBS/CBS zerados e o valor "regular" por trás
calculado certo. Ainda assim, o validador confere só a *coerência
estrutural* dos campos — não calcula nem confirma valores de IBS/CBS.

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

## Mapeamento de regimes especiais (tributação regular obrigatória)

Achamos no código-fonte da calculadora a regra exata de quando o XML é
obrigado a informar `gTribRegular`: quando a classificação principal tem a
flag `exigeGrupoDesoneracao = true` (já está nos nossos dados). De 109
classificações relevantes para IBS/CBS, 27 exigem — mas só **2 se aplicam a
NFS-e** (REIDI e Rehidro; as outras 25 são de mercadorias/importação). Novo
link "Ver regimes especiais que exigem tributação regular" mostra essa lista
completa. O validador de XML agora usa essa regra com precisão (antes era só
um aviso baseado em "se veio gTribRegular, deve ser regime especial") e
também confere se a classificação regular informada não é ela mesma
incompatível com suspensão.

## Estimativa de alíquota efetiva (2026)

Cada classificação mostra uma estimativa de alíquota efetiva (CBS /
IBS-UF / IBS-Mun) = **alíquota de referência × (1 − redução)** — a
fórmula do ano-teste 2026, quando só existe a alíquota de referência
nacional e ainda não há alíquotas por UF/Município. Validada rodando a
calculadora oficial de verdade contra uma nota real — bateu ao centavo.

Só calculado para tipos "Padrão", "Uniforme nacional (referência)" e
"Sem alíquota" (96 dos 109 códigos). Pros outros 13 (Fixa, Uniforme
setorial, Combinadas), a ferramenta avisa que não estima — essas
fórmulas exigiriam o motor completo, e prefiro não arriscar um número
errado.

**Não substitui a calculadora oficial** — é uma estimativa só pra 2026;
a partir de 2027 o mecanismo muda.

## Payload conferido contra o código-fonte oficial

O payload de teste foi conferido contra o **código-fonte real da
calculadora oficial** (pacote `br.gov.serpro.rtc`, SERPRO):

- O campo `nbs` é confirmado no schema oficial, não uma adaptação.
- `dataHoraEmissao` está obsoleto — o campo correto é `dhFatoGerador`.
- Adicionado `tpDoc: 91` (NFS-e), campo que a API usa pra saber qual
  nomenclatura (NCM/NBS) exigir.
- **A partir de 01/01/2027, `aliquotasNominais` (cbs, ibsEstadual,
  ibsMunicipal) passa a ser obrigatório** — o validador de XML detecta
  a data do fato gerador e inclui esse campo automaticamente quando
  necessário.
- A calculadora expõe endpoints de referência de alíquota
  (`/aliquota-uniao`, `/aliquota-uf`, `/aliquota-municipio`), mas
  mesmo eles retornam aviso de "dados simulados" dependendo da data —
  as alíquotas definitivas ainda estão em calibração nesse período de
  transição.
- **Testado rodando a calculadora oficial de verdade** (JAR + banco
  SQLite reais) contra uma NFS-e real com suspensão REIDI: devolveu
  IBS/CBS zerados corretamente e o valor "regular" por trás calculado
  certo — confirmando que a lógica de geração do payload está certa.

## Fonte e manutenção

- Todos os dados (itens da LC 116, NBS, cenários de INDOP,
  classificações tributárias, CST, fundamentação legal) foram
  **reconstruídos direto do banco SQLite oficial da calculadora**
  (`calculadora-pro.db`), a mesma fonte que a calculadora usa
  internamente — não mais de planilhas/exports intermediários.
  Usa a versão de dados vigente a partir de 01/10/2026.
- CST e cClassTrib **não são globalmente únicos** no banco — o mesmo
  código pode ter significados diferentes por tributo (ex.: dois
  "cClassTrib 000001", um pra IBS/CBS e outro pra Imposto Seletivo).
  A extração usa sempre o vínculo por ID, nunca por código de texto.
- Simples Nacional: as 15 atividades e seus Anexos de apuração também
  vêm direto do banco oficial.
- Se a Receita publicar uma nova versão da base, os arquivos em
  `data/` precisam ser regenerados a partir do banco novo.

## Licença

Todos os direitos reservados. Entre em contato antes de reutilizar o
código ou os dados processados para fins comerciais.
