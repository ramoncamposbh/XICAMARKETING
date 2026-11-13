# Site XICA MARKETING (PT · ES · EN)

Site institucional estático, sem banco de dados e sem dependências externas. Um gerador em Node (`build.js`, ~400 linhas, sem pacotes npm) monta o HTML final dos três idiomas a partir de arquivos de texto. Assim os textos ficam separados do layout e o HTML sai pronto para SEO.

## Publicar

**Opção 1: subir a pasta pronta.** A pasta `dist/` já está gerada. Arraste-a para o Netlify (Deploys → drag and drop) ou para qualquer hospedagem estática.

**Opção 2: conectar ao Git (recomendado).** Suba esta pasta para um repositório e importe na Vercel ou no Netlify. `vercel.json` e `netlify.toml` já indicam o build (`node build.js`) e a pasta de saída (`dist`). Confira esses campos na documentação atual da plataforma escolhida.

Para gerar localmente: `node build.js` (Node 18 ou superior).

## Onde editar

| O quê | Arquivo |
|---|---|
| Domínio, WhatsApp, e-mail, redes sociais, link da DICO, GA4, Meta Pixel, CNPJ | `src/config.json` |
| Todos os textos de cada idioma, inclusive pacotes e preços | `src/locales/pt.json`, `es.json`, `en.json` |
| Marcas atendidas e cases | `src/data/brands.json` |
| Cores, fontes e espaçamentos | `src/assets/css/styles.css` (bloco `:root`) |

Depois de editar, rode `node build.js` de novo.

### Itens que se ajustam sozinhos

- **WhatsApp:** o número fica só em `whatsappNumber`. As mensagens de cada idioma ficam em `whatsapp.message` nos arquivos de idioma. Botões de serviço e de pacote acrescentam "Tenho interesse em: …".
- **Redes sociais:** um ícone só aparece quando o link estiver preenchido.
- **E-mail:** enquanto estiver vazio, o rodapé mostra "[A DEFINIR]".
- **CNPJ/razão social:** só aparecem se `company.showLegalInfo` for `true`.
- **Link da DICO:** enquanto estiver vazio, o card mostra "[A DEFINIR]".
- **Cases:** em `brands.json`, troque `"case": null` pelos dados reais por idioma. O botão "Ver case" aparece automaticamente.
- **Logos pendentes (RACAM GROUP, Tecnodry):** coloque `nome.webp` e `nome.png` em `src/assets/img/brands/` e preencha `"logo": "nome"`.

## Idiomas e domínios

- PT em `/`, ES em `/py/`, EN em `/eua/` (`config.json → locales`).
- `canonical`, `hreflang`, Open Graph e `sitemap.xml` usam `siteUrl` (**atualize antes de publicar**).
- **Para mover um idioma para um domínio próprio**, preencha `locales.es.domain` (ex.: `"https://www.xica.com.py"`). O build passa a gerar `dist-es/`, um site separado para esse domínio, e todos os `hreflang` e links do seletor de idioma são atualizados.

## Medição (GA4 + Meta Pixel)

- Preencha `analytics.ga4Id` (ex.: `G-XXXX`) e `analytics.metaPixelId` em `config.json`.
- Os scripts **só carregam depois que o visitante clica em "Aceitar"** no aviso de cookies. Se ele recusar, nada é carregado.
- Cada clique em WhatsApp gera:
  - GA4: evento `whatsapp_click` com `source` (hero, header, menu, service, package, brands, cta, footer, floating), `item`, `language` e os UTMs da visita. Marque `whatsapp_click` como **evento principal (conversão)** no GA4.
  - Meta: evento padrão `Contact`.
  - `dataLayer.push({ event: 'whatsapp_click', ... })`, útil se no futuro houver Google Tag Manager.
- Parâmetros UTM, `gclid` e `fbclid` são guardados durante a sessão e anexados aos eventos.

## Antes de publicar

- [ ] `siteUrl` com o domínio real
- [ ] Textos em ES e EN revisados por falante nativo
- [ ] Política de Privacidade revisada por profissional jurídico. Depois disso, remova o aviso "Documento-modelo" (`privacy.draftNotice`) e ajuste o texto.
- [ ] Logotipo XICA em vetor (SVG), para nitidez e para confirmar o verde exato
- [ ] Logos RACAM GROUP e Tecnodry
- [ ] IDs do GA4 e do Meta Pixel, e-mail, redes sociais, link da DICO

## Fontes

Archivo (títulos, com eixo de largura) e Manrope (texto), ambas sob licença SIL Open Font License e hospedadas no próprio site. Assim não há chamadas ao Google Fonts antes do consentimento. As licenças estão em `src/assets/fonts/`.
