import React from "react";

export default function Privacy() {
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1>Política de Privacidade</h1>

      <h2>1. Introdução</h2>
      <p>
        A RKMMAX respeita sua privacidade. Esta Política de Privacidade explica como coletamos,
        usamos e protegemos seus dados pessoais.
      </p>
      <p>
        A RKMMAX é um serviço SaaS pago por assinatura/recorrência. Atualmente, não há plano
        gratuito previsto para usuários finais.
      </p>

      <h2>2. Conformidade Legal</h2>
      <p>Este site está em conformidade com:</p>
      <ul>
        <li>
          <strong>GDPR (Regulamento Geral de Proteção de Dados)</strong> - União Europeia
        </li>
        <li>
          <strong>LGPD (Lei Geral de Proteção de Dados)</strong> - Brasil
        </li>
        <li>
          <strong>Google Play Store</strong> - Políticas de Privacidade
        </li>
      </ul>

      <h2>3. Dados Coletados</h2>
      <p>Coletamos apenas dados necessários para:</p>
      <ul>
        <li>Autenticação e acesso à conta</li>
        <li>Segurança, estabilidade e correção de erros da plataforma</li>
        <li>Prevenção de abuso e suporte ao usuário</li>
        <li>Melhoria operacional do serviço, sem venda de dados pessoais</li>
        <li>Conformidade legal</li>
      </ul>

      <h2>4. Uso de Dados</h2>
      <p>Seus dados são usados apenas para:</p>
      <ul>
        <li>Fornecer os serviços de IA</li>
        <li>
          Melhoria operacional limitada a segurança, estabilidade, correção de erros e prevenção
          de abuso
        </li>
        <li>Segurança, estabilidade, prevenção de abuso e suporte ao usuário</li>
        <li>Cumprir obrigações legais</li>
      </ul>

      <h2>5. Processamento por Provedores de IA Terceiros</h2>
      <p>
        A RKMMAX utiliza provedores terceiros de IA para gerar respostas e processar solicitações,
        conforme a configuração técnica do ambiente. Atualmente, o fluxo pode usar Google Gemini e
        Groq, sempre sob orquestração do Serginho como gateway único.
      </p>
      <p>
        Dados enviados aos provedores podem incluir prompt, contexto necessário, histórico
        relevante da conversa e conteúdo fornecido pelo usuário (incluindo materiais enviados ao
        Construtor, Híbrido ou Especialistas), estritamente para inferência e resposta ao pedido do
        usuário.
      </p>
      <p>
        O fato de o usuário final pagar pela RKMMAX não equivale automaticamente ao uso de um tier
        pago, enterprise ou com controles específicos no provider. Regras e recursos técnicos
        (incluindo billing ativo, data controls ou Zero Data Retention) podem variar por ambiente e
        devem ser verificados operacionalmente antes de uso em produção com usuários reais ou dados
        sensíveis.
      </p>

      <h2>6. Uso para Treinamento de Modelos</h2>
      <p>
        A RKMMAX não treina modelos próprios com dados, prompts ou conteúdo dos usuários.
      </p>
      <p>
        O uso, retenção ou eventual aproveitamento dos dados por provedores terceiros é regido
        pelos termos e políticas oficiais desses provedores, conforme a configuração real aplicada
        no ambiente. Enquanto os termos específicos do tier técnico em uso não forem formalmente
        verificados, a RKMMAX não promete garantia absoluta de não-treinamento por terceiros.
      </p>
      <p>
        Referências oficiais: Google Gemini ({" "}
        <a href="https://ai.google.dev/terms" target="_blank" rel="noreferrer">
          ai.google.dev/terms
        </a>
        ) e Groq ({" "}
        <a href="https://groq.com/terms-of-use/" target="_blank" rel="noreferrer">
          groq.com/terms-of-use
        </a>
        ).
      </p>
      <p>
        Recomendamos que você não insira dados sensíveis, sigilosos ou pessoais desnecessários nos
        prompts.
      </p>

      <h2>7. Retenção, Logs e Telemetria</h2>
      <p>
        O sistema pode usar logs técnicos, telemetria e ferramentas de monitoramento para
        segurança, estabilidade e melhoria operacional.
      </p>
      <p>
        Quando possível, dados sensíveis são minimizados, mascarados ou limitados. Logs técnicos
        não devem ser interpretados como autorização ampla para treinamento de modelos. A política
        técnica de retenção pode evoluir em melhorias futuras.
      </p>

      <h2>8. Exclusão e Solicitações do Usuário</h2>
      <p>
        Você pode solicitar acesso, correção ou exclusão de dados conforme LGPD/GDPR pelo canal{" "}
        <strong>suporte@kizirianmax.site</strong>.
      </p>
      <p>
        Solicitações envolvendo dados já processados por provedores terceiros podem depender também
        das políticas desses provedores.
      </p>

      <h2>9. Direitos do Usuário</h2>
      <p>Você tem direito a:</p>
      <ul>
        <li>Acessar seus dados pessoais</li>
        <li>Corrigir dados incorretos</li>
        <li>Solicitar exclusão de dados</li>
        <li>Portabilidade de dados</li>
      </ul>

      <h2>10. Contato</h2>
      <p>
        Para dúvidas sobre privacidade, entre em contato: <strong>suporte@kizirianmax.site</strong>
      </p>

      <p style={{ marginTop: "40px", fontSize: "12px", color: "#999" }}>
        Última atualização: 12 de junho de 2026
      </p>
    </div>
  );
}
