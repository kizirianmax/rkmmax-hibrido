import React from "react";

export default function Terms() {
  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", padding: "20px" }}>
      <h1>Termos de Uso</h1>

      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao usar RKMMAX, você concorda com estes Termos de Uso. Se não concordar, não use o serviço.
      </p>

      <h2>2. Descrição do Serviço</h2>
      <p>RKMMAX é uma plataforma de inteligência artificial com 47 especialistas para ajudar em:</p>
      <ul>
        <li>Produtividade e automação</li>
        <li>Criatividade e brainstorming</li>
        <li>Análise e resolução de problemas</li>
        <li>Educação e aprendizado</li>
      </ul>
      <p>
        RKMMAX é um serviço SaaS pago por assinatura/recorrência, destinado a usuários finais
        pagantes, sem plano gratuito previsto para usuários finais.
      </p>

      <h2>3. Planos e Limites</h2>
      <p>Cada plano tem limites diários de tokens:</p>
      <ul>
        <li>
          <strong>Básico:</strong> 3.500 tokens/dia
        </li>
        <li>
          <strong>Intermediário:</strong> 4.700 tokens/dia
        </li>
        <li>
          <strong>Premium:</strong> 7.200 tokens/dia
        </li>
        <li>
          <strong>Ultra:</strong> 9.000 tokens/dia
        </li>
      </ul>

      <h2>4. Proibições</h2>
      <p>Você não pode usar RKMMAX para:</p>
      <ul>
        <li>Atividades ilegais</li>
        <li>Conteúdo ofensivo ou discriminatório</li>
        <li>Spam ou abuso</li>
        <li>Violação de direitos autorais</li>
      </ul>

      <h2>5. Responsabilidade</h2>
      <p>RKMMAX fornece o serviço "como está". Não somos responsáveis por:</p>
      <ul>
        <li>Erros ou imprecisões nas respostas de IA</li>
        <li>Perda de dados</li>
        <li>Interrupções de serviço</li>
      </ul>

      <h2>6. Provedores de IA e Conteúdo do Usuário</h2>
      <ul>
        <li>
          Você entende que suas solicitações podem ser processadas por provedores terceiros de IA,
          incluindo Google Gemini e Groq, sempre sob orquestração do Serginho como gateway único.
        </li>
        <li>
          Para gerar respostas, os dados enviados a provedores podem incluir prompt, contexto
          necessário, histórico relevante da conversa e conteúdo fornecido por você.
        </li>
        <li>
          Você é responsável por não inserir informações altamente sensíveis, sigilosas ou de
          terceiros sem autorização.
        </li>
        <li>A RKMMAX não treina modelos próprios com conteúdo do usuário.</li>
        <li>
          O uso de dados por provedores terceiros segue os termos e políticas oficiais desses
          provedores.
        </li>
        <li>
          O fato de você pagar pela assinatura SaaS do RKMMAX não implica automaticamente que o
          processamento ocorra em tier pago/enterprise do provider nem com controles específicos
          ativos.
        </li>
        <li>
          Regras por tier e configurações como billing ativo, data controls e opções como Zero Data
          Retention variam por provider e ambiente, devendo ser verificadas antes de uso em
          produção com usuários reais ou dados sensíveis.
        </li>
        <li>
          Referências oficiais:{" "}
          <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">
            Gemini API Terms
          </a>{" "}
          |{" "}
          <a href="https://ai.google.dev/terms" target="_blank" rel="noreferrer">
            Google AI / Gemini Terms
          </a>{" "}
          |{" "}
          <a href="https://groq.com/terms-of-use/" target="_blank" rel="noreferrer">
            Groq Terms
          </a>{" "}
          |{" "}
          <a href="https://console.groq.com/docs/your-data" target="_blank" rel="noreferrer">
            Groq Your Data
          </a>
          .
        </li>
        <li>
          As respostas são probabilísticas e devem ser revisadas antes de uso profissional,
          jurídico, financeiro, médico ou sensível.
        </li>
      </ul>

      <h2>7. Contato</h2>
      <p>
        Para dúvidas sobre termos, entre em contato: <strong>suporte@kizirianmax.site</strong>
      </p>

      <p style={{ marginTop: "40px", fontSize: "12px", color: "#999" }}>
        Última atualização: 12 de junho de 2026
      </p>
    </div>
  );
}
