// src/pages/Cronograma.jsx
import React, { useState } from "react";

const TIPOS_OBJETIVO = [
  { value: "concurso", label: "Concurso Público" },
  { value: "vestibular", label: "Vestibular/ENEM" },
  { value: "prova", label: "Prova/Exame" },
  { value: "certificacao", label: "Certificação" },
  { value: "outro", label: "Outro" }
];

const MATERIAS_POR_CATEGORIA = {
  "Exatas": ["Matemática", "Física", "Química", "Estatística", "Raciocínio Lógico"],
  "Humanas": ["Português", "História", "Geografia", "Filosofia", "Sociologia", "Atualidades"],
  "Línguas": ["Inglês", "Espanhol", "Redação"],
  "Específicas": ["Direito Constitucional", "Direito Administrativo", "Informática", "Contabilidade", "Economia"]
};

export default function Cronograma() {
  const [etapa, setEtapa] = useState(1);
  const [tipoObjetivo, setTipoObjetivo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [materias, setMaterias] = useState([]);
  const [prioridades, setPrioridades] = useState({});
  const [diasDisponiveis, setDiasDisponiveis] = useState(["seg", "ter", "qua", "qui", "sex"]);
  const [horasPorDia, setHorasPorDia] = useState(3);
  const [observacoes, setObservacoes] = useState("");
  const [cronogramaGerado, setCronogramaGerado] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [materiaCustom, setMateriaCustom] = useState("");

  const calcularSemanasAteData = () => {
    if (!dataLimite) return 0;
    const partes = dataLimite.split("/");
    if (partes.length !== 3) return 0;
    const dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoje = new Date();
    const diffTime = dataObj.getTime() - hoje.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, diffWeeks);
  };

  const toggleMateria = (materia) => {
    if (materias.includes(materia)) {
      setMaterias(materias.filter(m => m !== materia));
      const newPrioridades = { ...prioridades };
      delete newPrioridades[materia];
      setPrioridades(newPrioridades);
    } else {
      setMaterias([...materias, materia]);
      setPrioridades({ ...prioridades, [materia]: "media" });
    }
  };

  const adicionarMateriaCustom = () => {
    if (materiaCustom.trim() && !materias.includes(materiaCustom.trim())) {
      const novaMateria = materiaCustom.trim();
      setMaterias([...materias, novaMateria]);
      setPrioridades({ ...prioridades, [novaMateria]: "media" });
      setMateriaCustom("");
    }
  };

  const toggleDia = (dia) => {
    if (diasDisponiveis.includes(dia)) {
      setDiasDisponiveis(diasDisponiveis.filter(d => d !== dia));
    } else {
      setDiasDisponiveis([...diasDisponiveis, dia]);
    }
  };

  const gerarCronograma = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const semanas = calcularSemanasAteData();
    const horasSemanais = diasDisponiveis.length * horasPorDia;
    
    // Distribuir matérias por prioridade
    const materiasAlta = materias.filter(m => prioridades[m] === "alta");
    const materiasMedia = materias.filter(m => prioridades[m] === "media");
    const materiasBaixa = materias.filter(m => prioridades[m] === "baixa");
    
    // Calcular tempo por matéria
    const totalPesos = materiasAlta.length * 3 + materiasMedia.length * 2 + materiasBaixa.length * 1;
    const minutosSemanais = horasSemanais * 60;
    
    const temposPorMateria = {};
    materias.forEach(m => {
      const peso = prioridades[m] === "alta" ? 3 : prioridades[m] === "media" ? 2 : 1;
      temposPorMateria[m] = Math.round((peso / totalPesos) * minutosSemanais);
    });

    // Gerar cronograma semanal
    const diasNomes = {
      "seg": "Segunda",
      "ter": "Terça",
      "qua": "Quarta",
      "qui": "Quinta",
      "sex": "Sexta",
      "sab": "Sábado",
      "dom": "Domingo"
    };

    const cronogramaSemanal = [];
    const minutosPorDia = horasPorDia * 60;
    
    diasDisponiveis.forEach(dia => {
      const blocos = [];
      let minutosRestantes = minutosPorDia;
      let materiaIndex = 0;
      
      while (minutosRestantes > 0 && materiaIndex < materias.length) {
        const materia = materias[materiaIndex % materias.length];
        const tempoBloco = Math.min(90, minutosRestantes, temposPorMateria[materia] || 60);
        
        if (tempoBloco >= 30) {
          blocos.push({
            materia,
            duracao: tempoBloco,
            tipo: materiaIndex % 3 === 0 ? "teoria" : materiaIndex % 3 === 1 ? "exercicios" : "revisao"
          });
          minutosRestantes -= tempoBloco;
        }
        materiaIndex++;
      }
      
      cronogramaSemanal.push({
        dia: diasNomes[dia],
        blocos
      });
    });

    setCronogramaGerado({
      objetivo,
      dataLimite,
      semanas,
      horasSemanais,
      materias,
      prioridades,
      cronogramaSemanal
    });
    
    setIsGenerating(false);
    setEtapa(4);
  };

  const formatarDuracao = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas > 0 && mins > 0) return `${horas}h${mins}min`;
    if (horas > 0) return `${horas}h`;
    return `${mins}min`;
  };

  const renderEtapa1 = () => (
    <div style={styles.etapaContent}>
      <h2 style={styles.etapaTitle}>📎 Qual é seu objetivo?</h2>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>Tipo de Objetivo</label>
        <select
          value={tipoObjetivo}
          onChange={(e) => setTipoObjetivo(e.target.value)}
          style={styles.select}
        >
          <option value="">Selecione...</option>
          {TIPOS_OBJETIVO.map(tipo => (
            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
          ))}
        </select>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Descreva seu objetivo</label>
        <input
          type="text"
          placeholder="Ex: Passar no concurso do Banco do Brasil"
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          style={styles.input}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Data da prova/limite (DD/MM/AAAA)</label>
        <input
          type="text"
          placeholder="Ex: 15/03/2025"
          value={dataLimite}
          onChange={(e) => setDataLimite(e.target.value)}
          style={styles.input}
        />
        {dataLimite && calcularSemanasAteData() > 0 && (
          <p style={styles.weeksInfo}>
            📅 {calcularSemanasAteData()} semanas até a data limite
          </p>
        )}
      </div>

      <button
        style={{
          ...styles.button,
          ...((!tipoObjetivo || !objetivo || !dataLimite) ? styles.buttonDisabled : {})
        }}
        onClick={() => setEtapa(2)}
        disabled={!tipoObjetivo || !objetivo || !dataLimite}
      >
        Continuar →
      </button>
    </div>
  );

  const renderEtapa2 = () => (
    <div style={styles.etapaContent}>
      <h2 style={styles.etapaTitle}>📚 Quais matérias você precisa estudar?</h2>
      
      {Object.entries(MATERIAS_POR_CATEGORIA).map(([categoria, materiasList]) => (
        <div key={categoria} style={styles.categoriaSection}>
          <h3 style={styles.categoriaTitle}>{categoria}</h3>
          <div style={styles.materiasGrid}>
            {materiasList.map(materia => (
              <button
                key={materia}
                style={{
                  ...styles.materiaButton,
                  ...(materias.includes(materia) ? styles.materiaButtonActive : {})
                }}
                onClick={() => toggleMateria(materia)}
              >
                {materia}
                {materias.includes(materia) && " ✓"}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Adicionar matéria customizada */}
      <div style={styles.customMateriaSection}>
        <input
          type="text"
          placeholder="Adicionar outra matéria..."
          value={materiaCustom}
          onChange={(e) => setMateriaCustom(e.target.value)}
          style={styles.inputSmall}
          onKeyPress={(e) => e.key === "Enter" && adicionarMateriaCustom()}
        />
        <button style={styles.addButton} onClick={adicionarMateriaCustom}>
          + Adicionar
        </button>
      </div>

      {/* Prioridades */}
      {materias.length > 0 && (
        <div style={styles.prioridadesSection}>
          <h3 style={styles.prioridadesTitle}>Defina a prioridade de cada matéria</h3>
          {materias.map(materia => (
            <div key={materia} style={styles.prioridadeRow}>
              <span style={styles.prioridadeMateria}>{materia}</span>
              <div style={styles.prioridadeBtns}>
                {["alta", "media", "baixa"].map(p => (
                  <button
                    key={p}
                    style={{
                      ...styles.prioridadeBtn,
                      ...(prioridades[materia] === p ? styles[`prioridade${p.charAt(0).toUpperCase() + p.slice(1)}Active`] : {})
                    }}
                    onClick={() => setPrioridades({ ...prioridades, [materia]: p })}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.buttonGroup}>
        <button style={styles.buttonSecondary} onClick={() => setEtapa(1)}>
          ← Voltar
        </button>
        <button
          style={{
            ...styles.button,
            ...(materias.length === 0 ? styles.buttonDisabled : {})
          }}
          onClick={() => setEtapa(3)}
          disabled={materias.length === 0}
        >
          Continuar →
        </button>
      </div>
    </div>
  );

  const renderEtapa3 = () => (
    <div style={styles.etapaContent}>
      <h2 style={styles.etapaTitle}>⏰ Qual sua disponibilidade?</h2>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>Dias disponíveis para estudar</label>
        <div style={styles.diasGrid}>
          {[
            { id: "seg", label: "Seg" },
            { id: "ter", label: "Ter" },
            { id: "qua", label: "Qua" },
            { id: "qui", label: "Qui" },
            { id: "sex", label: "Sex" },
            { id: "sab", label: "Sáb" },
            { id: "dom", label: "Dom" }
          ].map(dia => (
            <button
              key={dia.id}
              style={{
                ...styles.diaButton,
                ...(diasDisponiveis.includes(dia.id) ? styles.diaButtonActive : {})
              }}
              onClick={() => toggleDia(dia.id)}
            >
              {dia.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Horas por dia</label>
        <select
          value={horasPorDia}
          onChange={(e) => setHorasPorDia(Number(e.target.value))}
          style={styles.select}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
            <option key={h} value={h}>{h} {h === 1 ? "hora" : "horas"} por dia</option>
          ))}
        </select>
      </div>

      <div style={styles.resumoHoras}>
        <p style={styles.resumoText}>
          {diasDisponiveis.length} dias por semana × {horasPorDia}h = <strong>{diasDisponiveis.length * horasPorDia}h semanais</strong> de estudo
        </p>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>Observações (opcional)</label>
        <textarea
          placeholder="Ex: Tenho mais dificuldade em matemática..."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          style={styles.textarea}
        />
      </div>

      <div style={styles.buttonGroup}>
        <button style={styles.buttonSecondary} onClick={() => setEtapa(2)}>
          ← Voltar
        </button>
        <button
          style={{
            ...styles.button,
            ...(diasDisponiveis.length === 0 ? styles.buttonDisabled : {})
          }}
          onClick={gerarCronograma}
          disabled={diasDisponiveis.length === 0 || isGenerating}
        >
          {isGenerating ? "⏳ Gerando..." : "✨ Gerar Cronograma"}
        </button>
      </div>
    </div>
  );

  const renderEtapa4 = () => (
    <div style={styles.etapaContent}>
      <div style={styles.successHeader}>
        <div style={styles.successIcon}>✅</div>
        <h2 style={styles.successTitle}>Cronograma gerado com sucesso!</h2>
        <p style={styles.successSubtitle}>{cronogramaGerado?.objetivo}</p>
        <p style={styles.successInfo}>
          {cronogramaGerado?.horasSemanais}h de estudo planejadas até {cronogramaGerado?.dataLimite}
        </p>
      </div>

      <div style={styles.buttonGroup}>
        <button style={styles.buttonSecondary} onClick={() => {
          setEtapa(1);
          setCronogramaGerado(null);
        }}>
          🔄 Novo Cronograma
        </button>
        <button style={styles.button} onClick={() => alert("Exportação em PDF em breve!")}>
          📄 Exportar PDF
        </button>
      </div>

      {/* Legenda */}
      <div style={styles.legenda}>
        <span style={styles.legendaItem}><span style={{...styles.legendaDot, background: "#3b82f6"}}></span> Teoria</span>
        <span style={styles.legendaItem}><span style={{...styles.legendaDot, background: "#8b5cf6"}}></span> Exercícios</span>
        <span style={styles.legendaItem}><span style={{...styles.legendaDot, background: "#10b981"}}></span> Revisão</span>
      </div>

      {/* Cronograma Semanal */}
      <div style={styles.cronogramaSection}>
        <h3 style={styles.cronogramaTitle}>📅 Semana 1</h3>
        
        {cronogramaGerado?.cronogramaSemanal.map((dia, index) => (
          <div key={index} style={styles.diaCard}>
            <div style={styles.diaHeader}>
              <span style={styles.diaNome}>{dia.dia}</span>
            </div>
            <div style={styles.blocosContainer}>
              {dia.blocos.map((bloco, i) => (
                <div 
                  key={i} 
                  style={{
                    ...styles.blocoEstudo,
                    background: bloco.tipo === "teoria" ? "#dbeafe" : 
                               bloco.tipo === "exercicios" ? "#ede9fe" : "#d1fae5",
                    borderLeftColor: bloco.tipo === "teoria" ? "#3b82f6" : 
                                    bloco.tipo === "exercicios" ? "#8b5cf6" : "#10b981"
                  }}
                >
                  <span style={styles.blocoMateria}>{bloco.materia}</span>
                  <span style={styles.blocoDuracao}>{formatarDuracao(bloco.duracao)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dicas */}
      <div style={styles.dicasSection}>
        <h3 style={styles.dicasTitle}>💡 Dicas para seu estudo</h3>
        <ul style={styles.dicasList}>
          <li>Comece sempre pelas matérias de maior dificuldade quando estiver mais descansado</li>
          <li>Faça pausas de 10-15 minutos a cada 50 minutos de estudo</li>
          <li>Revise o conteúdo do dia anterior antes de começar novos tópicos</li>
          <li>Reserve pelo menos 30% do tempo para exercícios práticos</li>
          <li>Mantenha um caderno de erros para revisar antes da prova</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <a href="/study" style={styles.backButton}>
          ← Voltar
        </a>
        <div style={styles.headerContent}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>📅</span>
          </div>
          <div>
            <h1 style={styles.title}>Gerador de Cronogramas</h1>
            <p style={styles.subtitle}>Crie seu plano de estudos personalizado</p>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Indicador de Etapas */}
        <div style={styles.etapasIndicator}>
          {[1, 2, 3, 4].map(num => (
            <div 
              key={num} 
              style={{
                ...styles.etapaCircle,
                ...(etapa >= num ? styles.etapaCircleActive : {}),
                ...(etapa === num ? styles.etapaCircleCurrent : {})
              }}
            >
              {num}
            </div>
          ))}
        </div>

        {/* Card Principal */}
        <div style={styles.card}>
          {etapa === 1 && renderEtapa1()}
          {etapa === 2 && renderEtapa2()}
          {etapa === 3 && renderEtapa3()}
          {etapa === 4 && renderEtapa4()}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    padding: "16px 20px",
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  backButton: {
    color: "white",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    display: "inline-block",
    marginBottom: 12
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
  },
  icon: {
    fontSize: 24
  },
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: "white",
    margin: 0
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    margin: 0
  },
  main: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 16px 48px"
  },
  etapasIndicator: {
    display: "flex",
    justifyContent: "center",
    gap: 16,
    marginBottom: 24
  },
  etapaCircle: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    transition: "all 0.3s"
  },
  etapaCircleActive: {
    background: "white",
    color: "#7c3aed"
  },
  etapaCircleCurrent: {
    boxShadow: "0 0 0 4px rgba(255,255,255,0.3)"
  },
  card: {
    background: "white",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)"
  },
  etapaContent: {},
  etapaTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e293b",
    marginBottom: 24,
    textAlign: "center"
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 8
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box"
  },
  inputSmall: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
    fontSize: 14,
    outline: "none"
  },
  select: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    background: "white",
    cursor: "pointer"
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    fontSize: 16,
    outline: "none",
    minHeight: 100,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit"
  },
  weeksInfo: {
    fontSize: 14,
    color: "#7c3aed",
    marginTop: 8,
    fontWeight: 600
  },
  button: {
    width: "100%",
    padding: "16px 24px",
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
    color: "white",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124,58,237,0.3)"
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed"
  },
  buttonSecondary: {
    padding: "16px 24px",
    borderRadius: 14,
    border: "2px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer"
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
    marginTop: 24
  },
  categoriaSection: {
    marginBottom: 20
  },
  categoriaTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 10,
    textTransform: "uppercase"
  },
  materiasGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8
  },
  materiaButton: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "2px solid #e2e8f0",
    background: "white",
    color: "#475569",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s"
  },
  materiaButtonActive: {
    background: "#7c3aed",
    borderColor: "#7c3aed",
    color: "white"
  },
  customMateriaSection: {
    display: "flex",
    gap: 12,
    marginTop: 16,
    marginBottom: 24
  },
  addButton: {
    padding: "12px 20px",
    borderRadius: 10,
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  prioridadesSection: {
    background: "#f8fafc",
    borderRadius: 16,
    padding: 20,
    marginTop: 20
  },
  prioridadesTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 16
  },
  prioridadeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #e2e8f0"
  },
  prioridadeMateria: {
    fontSize: 15,
    fontWeight: 600,
    color: "#374151"
  },
  prioridadeBtns: {
    display: "flex",
    gap: 8
  },
  prioridadeBtn: {
    padding: "6px 14px",
    borderRadius: 8,
    border: "2px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  prioridadeAltaActive: {
    background: "#fee2e2",
    borderColor: "#fca5a5",
    color: "#dc2626"
  },
  prioridadeMediaActive: {
    background: "#fef9c3",
    borderColor: "#fde047",
    color: "#ca8a04"
  },
  prioridadeBaixaActive: {
    background: "#dcfce7",
    borderColor: "#86efac",
    color: "#16a34a"
  },
  diasGrid: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  diaButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: "2px solid #e2e8f0",
    background: "white",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer"
  },
  diaButtonActive: {
    background: "#7c3aed",
    borderColor: "#7c3aed",
    color: "white"
  },
  resumoHoras: {
    background: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  resumoText: {
    fontSize: 15,
    color: "#166534",
    margin: 0,
    textAlign: "center"
  },
  successHeader: {
    textAlign: "center",
    marginBottom: 24
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: "#1e293b",
    margin: "0 0 8px"
  },
  successSubtitle: {
    fontSize: 16,
    color: "#64748b",
    margin: "0 0 8px"
  },
  successInfo: {
    fontSize: 14,
    color: "#7c3aed",
    fontWeight: 600,
    margin: 0
  },
  legenda: {
    display: "flex",
    justifyContent: "center",
    gap: 20,
    marginTop: 24,
    marginBottom: 24
  },
  legendaItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: "#64748b"
  },
  legendaDot: {
    width: 12,
    height: 12,
    borderRadius: 4
  },
  cronogramaSection: {
    marginTop: 24
  },
  cronogramaTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 16
  },
  diaCard: {
    background: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12
  },
  diaHeader: {
    marginBottom: 12
  },
  diaNome: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b"
  },
  blocosContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  blocoEstudo: {
    padding: "12px 16px",
    borderRadius: 10,
    borderLeft: "4px solid",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  blocoMateria: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b"
  },
  blocoDuracao: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: 600
  },
  dicasSection: {
    background: "#faf5ff",
    borderRadius: 16,
    padding: 20,
    marginTop: 24
  },
  dicasTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#7c3aed",
    marginBottom: 12
  },
  dicasList: {
    margin: 0,
    paddingLeft: 20,
    color: "#475569",
    fontSize: 14,
    lineHeight: 1.8
  }
};
