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
      <p>
        A RKMMAX é oferecida como SaaS pago por assinatura/recorrência, destinado a usuários
        pagantes, sem plano gratuito previsto para usuários finais.
      </p>
      <ul>
        <li>Produtividade e automação</li>
        <li>Criatividade e brainstorming</li>
        <li>Análise e resolução de problemas</li>
        <li>Educação e aprendizado</li>
      </ul>

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
          Os dados enviados para inferência podem incluir prompt, contexto necessário, histórico
          relevante da conversa e conteúdo fornecido por você para gerar a resposta.
        </li>
        <li>
          Você é responsável por não inserir informações altamente sensíveis, sigilosas ou de
          terceiros sem autorização.
        </li>
        <li>A RKMMAX não treina modelos próprios com conteúdo do usuário.</li>
        <li>
          O uso de dados por provedores terceiros segue os termos e políticas oficiais desses
          provedores e a configuração técnica real do ambiente.
        </li>
        <li>
          O fato de você pagar pela RKMMAX não implica automaticamente que o provider esteja em tier
          pago, enterprise ou com proteções específicas habilitadas.
        </li>
        <li>
          Recursos como billing ativo, data controls e Zero Data Retention dependem do tier técnico
          e da configuração operacional de cada provider, e devem ser verificados antes de uso em
          produção com usuários reais ou dados sensíveis.
        </li>
        <li>
          Referências oficiais: Google Gemini (ai.google.dev/terms) e Groq
          (groq.com/terms-of-use).
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
