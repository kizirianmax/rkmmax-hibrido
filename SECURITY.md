# Política de Segurança — RKMMax Híbrido

## Versões Suportadas

Apenas a versão principal ativa recebe correções de segurança.

| Versão | Suportada          |
| ------ | ------------------ |
| 3.1.x  | :white_check_mark: |
| 3.0.x  | :x:                |
| < 3.0  | :x:                |

## Reportar uma Vulnerabilidade

### Contato

Envie um e-mail **privado** para: **kizirianmax@gmail.com**  
Assunto: `[SECURITY] <resumo breve da vulnerabilidade>`

> ⚠️ **Não abra uma Issue pública** para vulnerabilidades de segurança — isso pode expor usuários a riscos antes da correção.

### Prazos de Resposta

| Etapa | Prazo |
|-------|-------|
| Acuse de recebimento | até **48 horas** após o envio |
| Avaliação inicial (é válida?) | até **5 dias úteis** |
| Correção e deploy | até **7 dias úteis** (crítica) ou **30 dias úteis** (moderada/baixa) |
| Notificação ao pesquisador | após o deploy da correção |

Se não receber resposta dentro de 48 horas, tente reenviar com o mesmo assunto.

## Escopo

### ✅ Considerado Vulnerabilidade

- **API keys ou tokens expostos** no frontend ou em commits públicos
- **Injeção** (SQL, NoSQL, command injection) em endpoints serverless
- **XSS** (Cross-Site Scripting) em qualquer rota da aplicação
- **CSRF** em ações que modificam estado do usuário
- **IDOR** (acesso a dados de outros usuários sem autorização)
- **Vazamento de dados sensíveis** (créditos, histórico de conversas, dados pessoais) via API
- **Bypass de autenticação** ou acesso não autorizado a rotas protegidas
- **Dependências com CVE crítico** em uso ativo em produção

### ❌ Fora do Escopo (não reportar como vulnerabilidade)

- Bugs de UI ou problemas visuais (abrir como Issue normal)
- Feature requests (abrir como Issue normal)
- Vulnerabilidades em dependências de desenvolvimento (`devDependencies`) que não chegam ao bundle de produção
- Rate limiting genérico sem impacto real de segurança
- Bugs em versões não suportadas (< 3.0)

## Divulgação Responsável (Responsible Disclosure)

Seguimos o modelo de **divulgação coordenada**:

1. Pesquisador reporta a vulnerabilidade em **privado** por e-mail.
2. Mantemos comunicação com o pesquisador durante a investigação.
3. Desenvolvemos e implantamos a correção.
4. Pesquisador recebe crédito público (se desejar) após o deploy.
5. Divulgação pública ocorre somente **após** a correção estar em produção.

Pedimos um período mínimo de **90 dias** antes de qualquer divulgação pública, salvo em casos críticos que exijam alerta imediato aos usuários.

## Stack e Superfície de Ataque

Este projeto é um monorepo híbrido com:

- **Frontend**: React (Vite) — servido como SPA estática na Vercel
- **Backend**: Vercel Serverless Functions (`/api`) — Node.js 22
- **APIs externas**: Groq API (LLM), Supabase (banco de dados), Stripe (pagamentos)
- **Autenticação**: Supabase Auth (JWT)

As principais superfícies de ataque são os endpoints serverless em `/api` e o manuseio de API keys via variáveis de ambiente da Vercel.
