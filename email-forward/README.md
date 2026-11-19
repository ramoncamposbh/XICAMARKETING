# xica-email-forward

Função na Vercel que encaminha para o Gmail os e-mails que o Resend recebe em `comercial@xicamarketing.com.br`.

- Rota: `POST /api/inbound` (webhook `email.received` do Resend)
- Projeto Vercel separado do site, com **Root Directory = `email-forward`**

## Variáveis de ambiente (Vercel)

| Nome | Valor |
|---|---|
| `RESEND_API_KEY` | chave **Full access** do Resend (precisa ler os e-mails recebidos) |
| `RESEND_WEBHOOK_SECRET` | segredo `whsec_...` do webhook no Resend |
| `FORWARD_TO` | `xicamarketingepublicidade@gmail.com` |
| `FORWARD_ADDRESSES` | `comercial@xicamarketing.com.br` (vários separados por vírgula) |
| `FORWARD_FROM` | `comercial@xicamarketing.com.br` |

## Webhook no Resend

Resend → Webhooks → Add webhook → URL `https://<projeto>.vercel.app/api/inbound`, evento `email.received`.

## O que chega no Gmail

- Assunto: `[comercial] <assunto original>`
- Remetente: `<Nome do cliente> via XICA <comercial@xicamarketing.com.br>`
- "Responder" vai direto para o cliente.
- Corpo original com um cabeçalho (recebido em, de, para) e os anexos.

Para incluir outro endereço (ex.: `contato@`), basta adicioná-lo em `FORWARD_ADDRESSES` e fazer redeploy.
