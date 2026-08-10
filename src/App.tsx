import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Trash2, Plus, Info, RefreshCw, Eye, EyeOff, Check, ChevronDown, ChevronUp, Filter, AlertCircle, ChevronLeft, ChevronRight, SlidersHorizontal, Download, HelpCircle, Pencil } from 'lucide-react';
import { exportToXlsb } from './utils/exportXlsb';
import { exportToPdf } from './utils/exportPdf';
import { COD_ORDEM_MAP, getCodOrdemNumeric } from './utils/codOrdem';
import { RichTextEditor } from './components/RichTextEditor';

// Feriados padrão nacionais e regionais (CAEd) - Adaptados para 2025/2026
const FERIADOS_PADRAO = [
  // 2025
  { date: "2025-01-01", label: "Confraternização Universal" },
  { date: "2025-03-03", label: "Carnaval" },
  { date: "2025-03-04", label: "Carnaval" },
  { date: "2025-03-05", label: "Recesso de Carnaval" },
  { date: "2025-04-18", label: "Paixão de Cristo" },
  { date: "2025-04-21", label: "Tiradentes" },
  { date: "2025-05-01", label: "Dia do Trabalho" },
  { date: "2025-06-13", label: "Dia de Santo Antônio (Padroeiro de JF)" },
  { date: "2025-06-19", label: "Corpus Christi" },
  { date: "2025-06-20", label: "Recesso CAEd" },
  { date: "2025-09-07", label: "Independência do Brasil" },
  { date: "2025-10-12", label: "Nossa Senhora Aparecida" },
  { date: "2025-11-02", label: "Finados" },
  { date: "2025-11-15", label: "Proclamação da República" },
  { date: "2025-11-20", label: "Dia da Consciência Negra" },
  { date: "2025-12-24", label: "Recesso de Natal" },
  { date: "2025-12-25", label: "Natal" },
  { date: "2025-12-26", label: "Recesso CAEd" },
  { date: "2025-12-31", label: "Recesso de Ano Novo" },

  // 2026
  { date: "2026-01-01", label: "Confraternização Universal" },
  { date: "2026-02-16", label: "Carnaval" },
  { date: "2026-02-17", label: "Carnaval" },
  { date: "2026-02-18", label: "Recesso de Carnaval" },
  { date: "2026-04-03", label: "Paixão de Cristo" },
  { date: "2026-04-21", label: "Tiradentes" },
  { date: "2026-05-01", label: "Dia do Trabalho" },
  { date: "2026-06-13", label: "Dia de Santo Antônio (Padroeiro de JF)" },
  { date: "2026-06-04", label: "Corpus Christi" },
  { date: "2026-06-05", label: "Recesso CAEd" },
  { date: "2026-09-07", label: "Independência do Brasil" },
  { date: "2026-10-12", label: "Nossa Senhora Aparecida" },
  { date: "2026-11-02", label: "Finados" },
  { date: "2026-11-15", label: "Proclamação da República" },
  { date: "2026-11-20", label: "Dia da Consciência Negra" },
  { date: "2026-12-24", label: "Recesso de Natal" },
  { date: "2026-12-25", label: "Natal" },
  { date: "2026-12-26", label: "Recesso CAEd" },
  { date: "2026-12-31", label: "Recesso de Ano Novo" },

  // 2027
  { date: "2027-01-01", label: "Confraternização Universal" }
];

export const FeriadosContext = React.createContext<Array<{ date: string; label?: string; ativo?: boolean }>>([]);

interface CampoDataProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  listaFeriados?: Array<{ date: string; label?: string; ativo?: boolean }>;
}

function CampoData({ value, onChange, disabled, required, className, placeholder = "dd/mm/yyyy", listaFeriados }: CampoDataProps) {
  const [textValue, setTextValue] = useState('');
  const contextFeriados = React.useContext(FeriadosContext);
  const feriadosParaUsar = listaFeriados || contextFeriados;

  let currDateStr = '';
  if (value && value !== '1889-01-01' && value !== '1900-01-01') {
    currDateStr = value;
  } else if (textValue) {
    const match = textValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      currDateStr = `${match[3]}-${match[2]}-${match[1]}`;
    }
  }

  const feriadoEncontrado = feriadosParaUsar.find(f => f.date === currDateStr && f.ativo !== false);
  const isFeriado = Boolean(currDateStr && feriadoEncontrado);

  let isFimDeSemana = false;
  if (currDateStr && /^\d{4}-\d{2}-\d{2}$/.test(currDateStr)) {
    const [y, m, d] = currDateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayOfWeek = dt.getDay(); // 0 = Domingo, 6 = Sábado
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      isFimDeSemana = true;
    }
  }

  const isDataVermelha = isFeriado || isFimDeSemana;

  // Keep textValue in sync with value prop (YYYY-MM-DD)
  useEffect(() => {
    if (value && value !== '1889-01-01' && value !== '1900-01-01') {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];
        setTextValue(`${d}/${m}/${y}`);
        return;
      }
    }
    setTextValue('');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value;
    let digits = raw.replace(/\D/g, ''); // Keep only digits
    if (digits.length > 8) digits = digits.slice(0, 8); // Limit to DDMMYYYY
    
    // Format as DD/MM/YYYY
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }
    
    setTextValue(formatted);

    // If we have a complete 8-digit string, parse and validate it
    if (digits.length === 8) {
      const d = digits.slice(0, 2);
      const m = digits.slice(2, 4);
      const y = digits.slice(4, 8);
      
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1800 && year <= 2150) {
        const testDate = new Date(year, month - 1, day);
        if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
          const yyyymmdd = `${y}-${m}-${d}`;
          onChange(yyyymmdd);
        }
      }
    } else if (digits.length === 0) {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (textValue === '') {
      onChange('');
      return;
    }
    
    const match = textValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = parseInt(match[3], 10);
      
      const testDate = new Date(y, m - 1, d);
      if (testDate.getFullYear() === y && testDate.getMonth() === m - 1 && testDate.getDate() === d) {
        const padD = match[1];
        const padM = match[2];
        const yyyymmdd = `${y}-${padM}-${padD}`;
        onChange(yyyymmdd);
        return;
      }
    }
    
    if (value && value !== '1889-01-01' && value !== '1900-01-01') {
      const parts = value.split('-');
      if (parts.length === 3) {
        setTextValue(`${parts[2]}/${parts[1]}/${parts[0]}`);
      }
    } else {
      setTextValue('');
    }
  };

  const classesList = className ? className.split(' ') : [];
  const widthClass = classesList.find(c => c.startsWith('w-')) || 'w-full';
  const shrinkClass = classesList.find(c => c.startsWith('shrink-')) || '';
  
  const outerClasses = `${widthClass} ${shrinkClass}`;
  const inputClasses = classesList.filter(c => !c.startsWith('w-') && !c.startsWith('shrink-')).join(' ');

  const baseClass = className || "w-full border border-slate-200 rounded p-2 text-xs font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] transition shadow-xs";
  let combinedClass = className ? `${inputClasses} w-full pr-8` : `${baseClass} pr-8`;
  if (isDataVermelha) {
    combinedClass += " !border-[#FF0000] !text-[#FF0000] focus:!border-[#FF0000] focus:!ring-1 focus:!ring-[#FF0000]";
  }

  const tooltipTitle = feriadoEncontrado 
    ? `Feriado / Recesso: ${feriadoEncontrado.label}` 
    : (isFimDeSemana ? "Final de semana (Sábado/Domingo)" : undefined);

  return (
    <div 
      className={`relative inline-flex items-center ${outerClasses} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      title={tooltipTitle}
    >
      <input
        type="text"
        placeholder={placeholder}
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        className={combinedClass}
        style={isDataVermelha ? { borderColor: '#FF0000', color: '#FF0000' } : undefined}
      />
      <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center ${disabled ? 'pointer-events-none' : 'cursor-pointer'}`}>
        <input
          type="date"
          value={value || ""}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val);
          }}
          disabled={disabled}
          tabIndex={-1}
          className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5 z-10"
        />
        <Calendar 
          className={`w-4 h-4 pointer-events-none ${isDataVermelha ? 'text-[#FF0000]' : 'text-[#3F48CC]'}`} 
          style={isDataVermelha ? { color: '#FF0000' } : undefined} 
        />
      </div>
    </div>
  );
}

export default function App() {
  const [codSubprograma, setCodSubprograma] = useState('');
  const [nomeSubprograma, setNomeSubprograma] = useState('');
  const [activeTab, setActiveTab] = useState('programacao_inicial');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [evaluationType, setEvaluationType] = useState('somativa');
  const [activeScenario, setActiveScenario] = useState('grafica');
  const [ocultarFormulas, setOcultarFormulas] = useState(true);
  const [ocultarFormulasExtras, setOcultarFormulasExtras] = useState(true);
  const [tabelaGraficaOpen, setTabelaGraficaOpen] = useState(true);
  const [tabelaCaedOpen, setTabelaCaedOpen] = useState(true);
  const [detalhamentoEtapasOpen, setDetalhamentoEtapasOpen] = useState(true);

  const [modoEdicaoPrincipal, setModoEdicaoPrincipal] = useState(false);
  const [datasManuaisPrincipal, setDatasManuaisPrincipal] = useState<Record<string, string>>({});
  const [ocultarCalculosPrincipal, setOcultarCalculosPrincipal] = useState(false);
  
  const [modoEdicaoExtras, setModoEdicaoExtras] = useState(false);
  const [datasManuaisExtras, setDatasManuaisExtras] = useState<Record<string, { inicio?: string, fim?: string }>>({});
  const [ocultarCalculosExtras, setOcultarCalculosExtras] = useState(false);

  // Parâmetros Globais do Formulário
  const [dataEntrega, setDataEntrega] = useState('');
  const [prazoContratual, setPrazoContratual] = useState<string | number>('');
  const [prazoComFator, setPrazoComFator] = useState<string | number>('');
  const [prazoContratualOriginal, setPrazoContratualOriginal] = useState<string | number>('');
  const [prazoComFatorOriginal, setPrazoComFatorOriginal] = useState<string | number>('');
  const [prazoContratualEditado, setPrazoContratualEditado] = useState<string | number>('');
  const [prazoComFatorEditado, setPrazoComFatorEditado] = useState<string | number>('');

  // Verificações de critérios de ativação
  const [constaCaedAplicacao, setConstaCaedAplicacao] = useState(false);
  const [possuiEscrita, setPossuiEscrita] = useState(false);
  const [possuiMaterialImpresso, setPossuiMaterialImpresso] = useState(false);

  // Controle de ativação/inativação de campos manuais opcionais
  const [desativadosOpcionais, setDesativadosOpcionais] = useState({
    B10: true,
    B11: false,
    B12: false,
    B18: false,
    B20: false,
    B21: true,
    B24: false,
    B26: false, // Controle B26 para torná-lo opcional/desativável
    B28: true,
    B29: true,
    H8: false,
    G5: false
  });

  // Valores manuais inseridos para Somativa/Formativa
  const [b5ManualInicio, setB5ManualInicio] = useState('');
  const [b5ManualFim, setB5ManualFim] = useState('');
  const [b9ManualInicio, setB9ManualInicio] = useState('');
  const [b9ManualFim, setB9ManualFim] = useState('');
  const [b10ManualInicio, setB10ManualInicio] = useState('');
  const [b15ManualInicio, setB15ManualInicio] = useState('');
  const [b18ManualInicio, setB18ManualInicio] = useState('');
  const [b20ManualInicio, setB20ManualInicio] = useState('');
  const [b21ManualInicio, setB21ManualInicio] = useState('');
  const [b23ManualInicio, setB23ManualInicio] = useState('');
  const [b23ManualFim, setB23ManualFim] = useState('');
  const [b24ManualInicio, setB24ManualInicio] = useState('');
  const [b26ManualInicio, setB26ManualInicio] = useState('');
  const [b26ManualFim, setB26ManualFim] = useState('');
  const [b28ManualInicio, setB28ManualInicio] = useState('');
  const [b29ManualInicio, setB29ManualInicio] = useState('');

  // Valores manuais inseridos para Fluência
  const [h5ManualInicio, setH5ManualInicio] = useState('');
  const [h8ManualInicio, setH8ManualInicio] = useState('');
  const [h8ManualFim, setH8ManualFim] = useState('');
  const [h11ManualInicio, setH11ManualInicio] = useState('');
  const [h11ManualFim, setH11ManualFim] = useState('');
  const [h12ManualInicio, setH12ManualInicio] = useState('');

  // Texto de Observações e Considerações
  const [observacoes, setObservacoes] = useState('');

  // Limpar preenchimentos manuais das tabelas
  const limparPreenchimentosManuaisTabela = () => {
    setDatasManuaisPrincipal({});
    setDatasManuaisExtras({});
  };

  // Limpar preenchimentos manuais dos campos do painel (abaixo de "CAMPOS DE PREENCHIMENTO")
  const limparPreenchimentosCamposPreenchimento = () => {
    setB23ManualInicio('');
    setB23ManualFim('');
    setB26ManualInicio('');
    setB26ManualFim('');
    setB5ManualInicio('');
    setB5ManualFim('');
    setB9ManualInicio('');
    setB9ManualFim('');
    setB10ManualInicio('');
    setB15ManualInicio('');
    setB18ManualInicio('');
    setB20ManualInicio('');
    setB21ManualInicio('');
    setB24ManualInicio('');
    setB28ManualInicio('');
    setB29ManualInicio('');
    setH5ManualInicio('');
    setH8ManualInicio('');
    setH8ManualFim('');
    setH11ManualInicio('');
    setH11ManualFim('');
    setH12ManualInicio('');
  };

  // Limpar preenchimentos manuais dos campos do sidebar (todos os campos)
  const limparPreenchimentosManuaisSidebar = () => {
    setCodSubprograma('');
    setNomeSubprograma('');
    setDataEntrega('');
    setPrazoContratual('');
    setPrazoComFator('');
    setPrazoContratualOriginal('');
    setPrazoComFatorOriginal('');
    setPrazoContratualEditado('');
    setPrazoComFatorEditado('');
    setConstaCaedAplicacao(false);
    setPossuiEscrita(false);
    setPossuiMaterialImpresso(false);
    setB5ManualInicio('');
    setB5ManualFim('');
    setB9ManualInicio('');
    setB9ManualFim('');
    setB10ManualInicio('');
    setB15ManualInicio('');
    setB18ManualInicio('');
    setB20ManualInicio('');
    setB21ManualInicio('');
    setB23ManualInicio('');
    setB23ManualFim('');
    setB24ManualInicio('');
    setB26ManualInicio('');
    setB26ManualFim('');
    setB28ManualInicio('');
    setB29ManualInicio('');
    setH5ManualInicio('');
    setH8ManualInicio('');
    setH8ManualFim('');
    setH11ManualInicio('');
    setH11ManualFim('');
    setH12ManualInicio('');
    setObservacoes('');
  };

  const [feriados, setFeriados] = useState(() => {
    return FERIADOS_PADRAO.map(f => ({ ...f, ativo: true }));
  });
  
  const [novoFeriadoData, setNovoFeriadoData] = useState('');
  const [novoFeriadoNome, setNovoFeriadoNome] = useState('');

  const [calculosCaed, setCalculosCaed] = useState({});
  const [calculosGrafica, setCalculosGrafica] = useState({});

  // Função Central de Formatação Padronizada de Máscara (DD/MM/YYYY)
  const formatarDataBR = (dataStr) => {
    if (!dataStr || dataStr === "-" || dataStr === "1889-01-01" || dataStr === "01/01/1889" || dataStr.startsWith("1889") || dataStr.startsWith("1900") || dataStr === "1900-01-01") {
      return "-";
    }
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    const d = partes[2].padStart(2, '0');
    const m = partes[1].padStart(2, '0');
    const y = partes[0];
    return `${d}/${m}/${y}`;
  };

  const obterDiaSemana = (dataStr) => {
    if (!dataStr || dataStr === "-" || dataStr.startsWith("1889") || dataStr.startsWith("1900")) return "";
    const data = new Date(dataStr + 'T00:00:00');
    if (isNaN(data.getTime())) return "";
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return dias[data.getDay()];
  };

  const ehDiaUtil = (dataStr) => {
    if (!dataStr) return false;
    const data = new Date(dataStr + 'T00:00:00');
    if (isNaN(data.getTime())) return false;
    const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaSemana === 0 || diaSemana === 6) return false;
    return !feriados.some(f => f.date === dataStr && f.ativo);
  };

  const obterProximoDiaUtil = (dataStr) => {
    if (!dataStr || dataStr === "1889-01-01" || dataStr === "" || dataStr.startsWith("1889")) return dataStr;
    let dataAtual = new Date(dataStr + 'T00:00:00');
    if (isNaN(dataAtual.getTime())) return dataStr;
    
    let seguranca = 0;
    while (seguranca < 1000) {
      const dataAtualStr = dataAtual.toISOString().split('T')[0];
      if (ehDiaUtil(dataAtualStr)) {
        return dataAtualStr;
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
      seguranca++;
    }
    return dataStr;
  };

  const calcularDiaTrabalho = (dataInicial, dias) => {
    if (!dataInicial || dataInicial === "" || dataInicial.startsWith("1889") || isNaN(dias)) {
      return "1889-01-01";
    }
    
    const dataInicialAjustada = obterProximoDiaUtil(dataInicial);
    let dataAtual = new Date(dataInicialAjustada + 'T00:00:00');
    if (isNaN(dataAtual.getTime())) return "1889-01-01";

    let diasRestantes = Math.abs(dias);
    const direcao = dias < 0 ? -1 : 1;

    let seguranca = 0;
    while (diasRestantes > 0 && seguranca < 1000) {
      seguranca++;
      dataAtual.setDate(dataAtual.getDate() + direcao);
      
      if (isNaN(dataAtual.getTime())) return "1889-01-01";
      
      const dataAtualStr = dataAtual.toISOString().split('T')[0];
      if (ehDiaUtil(dataAtualStr)) {
        diasRestantes--;
      }
    }
    
    if (isNaN(dataAtual.getTime())) return "1889-01-01";
    return obterProximoDiaUtil(dataAtual.toISOString().split('T')[0]);
  };

  const adicionarDiasCalendario = (dataStr: string, dias: number) => {
    return calcularDiaTrabalho(dataStr, dias);
  };

  useEffect(() => {
    const refEntrega = obterProximoDiaUtil(dataEntrega || "1889-01-01");
    const numericPrazo = parseInt(prazoContratual, 10) || 0;
    const numericPrazoComFator = parseInt(String(prazoComFator), 10);
    const prazoAjustado = !isNaN(numericPrazoComFator) ? numericPrazoComFator : Math.ceil(numericPrazo * 1.25);

    const valPrincipal = (cel: string, computed: string) => {
      return obterProximoDiaUtil(computed);
    };

    const valPrincipalInicio = (cel: string, computed: string) => {
      return obterProximoDiaUtil(computed);
    };

    const valPrincipalFim = (cel: string, computed: string) => {
      return obterProximoDiaUtil(computed);
    };

    // 2) Gráfica gera DVs
    const E12_fim = valPrincipalFim("E12", refEntrega);
    const e11 = calcularDiaTrabalho(E12_fim, -prazoAjustado + 4);
    const E11_fim = valPrincipalFim("E11", e11);
    const e10 = calcularDiaTrabalho(E11_fim, -2);
    const E10_fim = valPrincipalFim("E10", e10);
    const e9 = calcularDiaTrabalho(E10_fim, -2);
    const E9_fim = valPrincipalFim("E9", e9);
    const e7 = calcularDiaTrabalho(E9_fim, -2);
    const E7_fim = valPrincipalFim("E7", e7);
    const e6 = calcularDiaTrabalho(E9_fim, -4);
    const E6_fim = valPrincipalFim("E6", e6);
    const e4 = calcularDiaTrabalho(E6_fim, -10);
    const E4_fim = valPrincipalFim("E4", e4);
    const e5 = calcularDiaTrabalho(E4_fim, 3);
    const E5_fim = valPrincipalFim("E5", e5);

    const e1_limiteBaseDestaque = calcularDiaTrabalho(E4_fim, -10);
    const e2_dispEscritaDestaque = calcularDiaTrabalho(e1_limiteBaseDestaque, 3);

    const E4_inicio = valPrincipalInicio("E4", E4_fim);
    const E5_inicio = valPrincipalInicio("E5", E5_fim);
    const E6_inicio = valPrincipalInicio("E6", E6_fim);
    const E7_inicio = valPrincipalInicio("E7", E7_fim);
    const E9_inicio = valPrincipalInicio("E9", calcularDiaTrabalho(E6_fim, 1));
    const E10_inicio = valPrincipalInicio("E10", calcularDiaTrabalho(E9_fim, 1));
    const E11_inicio = valPrincipalInicio("E11", calcularDiaTrabalho(E10_fim, 1));
    const E12_inicio = valPrincipalInicio("E12", E12_fim);

    // 1) CAEd gera DVs
    const b21_val = valPrincipal("B21", b21ManualInicio || refEntrega);
    const b15_val = valPrincipal("B15", b15ManualInicio || (datasManuaisExtras["B15"] && datasManuaisExtras["B15"].inicio) || calcularDiaTrabalho(b21_val, -prazoAjustado));
    const c8 = calcularDiaTrabalho(b15_val, -1);
    const C8_val = valPrincipal("C8", c8);
    const c8_inicio = calcularDiaTrabalho(C8_val, -1);
    const c7 = calcularDiaTrabalho(b15_val, -2);
    const C7_val = valPrincipal("C7", c7);
    const c6 = calcularDiaTrabalho(C8_val, -2);
    const C6_val = valPrincipal("C6", c6);
    const c4 = calcularDiaTrabalho(C6_val, -10);
    const C4_val = valPrincipal("C4", c4);
    const c5 = calcularDiaTrabalho(C4_val, 3);

    const c1_limiteBaseDestaque = calcularDiaTrabalho(C4_val, -10);
    const c2_dispEscritaDestaque = calcularDiaTrabalho(c1_limiteBaseDestaque, 3);

    setCalculosCaed({
      c4, c5, c6, c7, c8, c8_inicio, b15: b15_val,
      c4_inicio: c4,
      c5_inicio: c5,
      c6_inicio: c6,
      c7_inicio: c7,
      c1_limiteBaseDestaque,
      c2_dispEscritaDestaque,
      prazoOriginal: numericPrazo,
      prazoAjustado,
      entregaPolos: refEntrega
    });

    setCalculosGrafica({
      e4: E4_fim,
      e5: E5_fim,
      e6: E6_fim,
      e7: E7_fim,
      e9: E9_fim,
      e10: E10_fim,
      e11: E11_fim,
      e12: E12_fim,
      e4_inicio: E4_inicio,
      e5_inicio: E5_inicio,
      e6_inicio: E6_inicio,
      e7_inicio: E7_inicio,
      e9_inicio: E9_inicio,
      e10_inicio: E10_inicio,
      e11_inicio: E11_inicio,
      e12_inicio: E12_inicio,
      e1_limiteBaseDestaque,
      e2_dispEscritaDestaque,
      prazoOriginal: numericPrazo,
      prazoAjustado,
      entregaPolos: refEntrega
    });

  }, [dataEntrega, prazoContratual, prazoComFator, feriados, b21ManualInicio, b15ManualInicio]);
  

  const obterDatasManuaisCaed = () => {
    const b21_anchor = b21ManualInicio || (datasManuaisExtras["B21"] && datasManuaisExtras["B21"].inicio) || calculosCaed.entregaPolos;
    const b15_calc = b21_anchor ? calcularDiaTrabalho(b21_anchor, -calculosCaed.prazoAjustado) : "";
    const b15_manual = (b15ManualInicio || (datasManuaisExtras["B15"] && datasManuaisExtras["B15"].inicio)) ? (b15ManualInicio || (datasManuaisExtras["B15"] && datasManuaisExtras["B15"].inicio)) : b15_calc;

    const c8_calc = b15_manual ? calcularDiaTrabalho(b15_manual, -1) : "";
    const c8_manual = (datasManuaisPrincipal["C8"] && datasManuaisPrincipal["C8"] !== "1889-01-01") ? datasManuaisPrincipal["C8"] : c8_calc;
    const c8_inicio_calc = c8_manual ? calcularDiaTrabalho(c8_manual, -1) : "";
    const c8_inicio_manual = (datasManuaisPrincipal["C8_inicio"] && datasManuaisPrincipal["C8_inicio"] !== "1889-01-01") ? datasManuaisPrincipal["C8_inicio"] : c8_inicio_calc;

    const c7_calc = b15_manual ? calcularDiaTrabalho(b15_manual, -2) : "";
    const c7_manual = (datasManuaisPrincipal["C7"] && datasManuaisPrincipal["C7"] !== "1889-01-01") ? datasManuaisPrincipal["C7"] : c7_calc;

    const c6_calc = c8_manual ? calcularDiaTrabalho(c8_manual, -2) : "";
    const c6_manual = (datasManuaisPrincipal["C6"] && datasManuaisPrincipal["C6"] !== "1889-01-01") ? datasManuaisPrincipal["C6"] : c6_calc;

    const c4_calc = c6_manual ? calcularDiaTrabalho(c6_manual, -10) : "";
    const c4_manual = (datasManuaisPrincipal["C4"] && datasManuaisPrincipal["C4"] !== "1889-01-01") ? datasManuaisPrincipal["C4"] : c4_calc;

    const c5_calc = c4_manual ? calcularDiaTrabalho(c4_manual, 3) : "";
    const c5_manual = (datasManuaisPrincipal["C5"] && datasManuaisPrincipal["C5"] !== "1889-01-01") ? datasManuaisPrincipal["C5"] : c5_calc;

    return {
      C8: c8_manual,
      C8_inicio: c8_inicio_manual,
      C7: c7_manual,
      C6: c6_manual,
      C4: c4_manual,
      C5: c5_manual,
    };
  };

  const obterDatasManuaisGrafica = () => {
    const e12_manual = (datasManuaisPrincipal["E12"] && datasManuaisPrincipal["E12"] !== "1889-01-01") ? datasManuaisPrincipal["E12"] : calculosGrafica.entregaPolos;

    const e11_fim_calc = e12_manual ? calcularDiaTrabalho(e12_manual, -calculosGrafica.prazoAjustado + 4) : "";
    const e11_fim_manual = (datasManuaisPrincipal["E11"] && datasManuaisPrincipal["E11"] !== "1889-01-01") ? datasManuaisPrincipal["E11"] : e11_fim_calc;

    const e10_fim_calc = e11_fim_manual ? calcularDiaTrabalho(e11_fim_manual, -2) : "";
    const e10_fim_manual = (datasManuaisPrincipal["E10"] && datasManuaisPrincipal["E10"] !== "1889-01-01") ? datasManuaisPrincipal["E10"] : e10_fim_calc;

    const e9_fim_calc = e10_fim_manual ? calcularDiaTrabalho(e10_fim_manual, -2) : "";
    const e9_fim_manual = (datasManuaisPrincipal["E9"] && datasManuaisPrincipal["E9"] !== "1889-01-01") ? datasManuaisPrincipal["E9"] : e9_fim_calc;

    const e7_fim_calc = e9_fim_manual ? calcularDiaTrabalho(e9_fim_manual, -2) : "";
    const e7_fim_manual = (datasManuaisPrincipal["E7"] && datasManuaisPrincipal["E7"] !== "1889-01-01") ? datasManuaisPrincipal["E7"] : e7_fim_calc;

    const e6_fim_calc = e9_fim_manual ? calcularDiaTrabalho(e9_fim_manual, -4) : "";
    const e6_fim_manual = (datasManuaisPrincipal["E6"] && datasManuaisPrincipal["E6"] !== "1889-01-01") ? datasManuaisPrincipal["E6"] : e6_fim_calc;

    const e4_fim_calc = e6_fim_manual ? calcularDiaTrabalho(e6_fim_manual, -10) : "";
    const e4_fim_manual = (datasManuaisPrincipal["E4"] && datasManuaisPrincipal["E4"] !== "1889-01-01") ? datasManuaisPrincipal["E4"] : e4_fim_calc;

    const e5_fim_calc = e4_fim_manual ? calcularDiaTrabalho(e4_fim_manual, 3) : "";
    const e5_fim_manual = (datasManuaisPrincipal["E5"] && datasManuaisPrincipal["E5"] !== "1889-01-01") ? datasManuaisPrincipal["E5"] : e5_fim_calc;

    const e4_inicio_manual = datasManuaisPrincipal["E4_inicio"] || e4_fim_manual;
    const e5_inicio_manual = datasManuaisPrincipal["E5_inicio"] || e5_fim_manual;
    const e6_inicio_manual = datasManuaisPrincipal["E6_inicio"] || e6_fim_manual;
    const e7_inicio_manual = datasManuaisPrincipal["E7_inicio"] || e7_fim_manual;
    const e9_inicio_manual = datasManuaisPrincipal["E9_inicio"] || (e6_fim_manual ? calcularDiaTrabalho(e6_fim_manual, 1) : "");
    const e10_inicio_manual = datasManuaisPrincipal["E10_inicio"] || (e9_fim_manual ? calcularDiaTrabalho(e9_fim_manual, 1) : "");
    const e11_inicio_manual = datasManuaisPrincipal["E11_inicio"] || (e10_fim_manual ? calcularDiaTrabalho(e10_fim_manual, 1) : "");
    const e12_inicio_manual = datasManuaisPrincipal["E12_inicio"] || e12_manual;

    return {
      E12: e12_manual,
      E12_inicio: e12_inicio_manual,
      E11: e11_fim_manual,
      E11_inicio: e11_inicio_manual,
      E10: e10_fim_manual,
      E10_inicio: e10_inicio_manual,
      E9: e9_fim_manual,
      E9_inicio: e9_inicio_manual,
      E7: e7_fim_manual,
      E7_inicio: e7_inicio_manual,
      E6: e6_fim_manual,
      E6_inicio: e6_inicio_manual,
      E4: e4_fim_manual,
      E4_inicio: e4_inicio_manual,
      E5: e5_fim_manual,
      E5_inicio: e5_inicio_manual,
    };
  };

  const obterDatasManuaisExtras = () => {
    const manuaisGrafica = obterDatasManuaisGrafica();
    const t_entrega = datasManuaisPrincipal["E12"] || b21ManualInicio || (datasManuaisExtras["B21"] && datasManuaisExtras["B21"].inicio) || calculosGrafica.entregaPolos || calculosCaed.entregaPolos;

    const getM = (cel: string, field: "inicio" | "fim", fallback: string) => {
      if (datasManuaisExtras[cel] && datasManuaisExtras[cel][field] && datasManuaisExtras[cel][field] !== "1889-01-01") {
        return datasManuaisExtras[cel][field];
      }
      return fallback;
    };

    const b15_m = getM("B15", "inicio", b15ManualInicio || "");
    const b5_m = getM("B5", "inicio", b5ManualInicio || (b15_m ? calcularDiaTrabalho(b15_m, -4) : ""));
    const b6_m = getM("B6", "inicio", b5_m);
    const b7_m = getM("B7", "inicio", b6_m ? adicionarDiasCalendario(b6_m, 7) : "");
    const b26_m = getM("B26", "inicio", b26ManualInicio || "");
    const b8_m = getM("B8", "inicio", b26_m ? calcularDiaTrabalho(b26_m, -33) : "");
    const b10_m = getM("B10", "inicio", b10ManualInicio || "");
    const b20_m = getM("B20", "inicio", b20ManualInicio || "");
    const b14_m_calc = b20_m ? calcularDiaTrabalho(b20_m, -12) : "";
    let b14_m = getM("B14", "inicio", b14_m_calc);
    let b14_excedeuE8_m = false;
    if (b14_m && b15_m && b14_m >= b15_m) {
      b14_m = "";
      b14_excedeuE8_m = true;
    }
    const b13_m = getM("B13", "inicio", b20_m ? (b14_m ? calcularDiaTrabalho(b14_m, -1) : "") : (b15_m ? calcularDiaTrabalho(b15_m, -1) : ""));
    const b21_m = getM("B21", "inicio", b21ManualInicio || t_entrega || "");
    const b9_m = getM("B9", "inicio", b5_m ? calcularDiaTrabalho(b5_m, 11) : "");
    const b9_plus_m = getM("B9+", "fim", b9_m ? calcularDiaTrabalho(b9_m, 4) : "");
    const b19_m = getM("B19", "inicio", t_entrega ? calcularDiaTrabalho(t_entrega, -20) : "");
    const b17_m = getM("B17", "inicio", b19_m ? calcularDiaTrabalho(b19_m, -15) : "");
    const b22_m = getM("B22", "inicio", b5_m ? adicionarDiasCalendario(b5_m, 7) : "");
    const b23_m = getM("B23", "inicio", b23ManualInicio || "");
    const b25_m = getM("B25", "inicio", b26_m ? calcularDiaTrabalho(b26_m, -33) : "");
    const b27_m = getM("B27", "inicio", b25_m ? calcularDiaTrabalho(b25_m, 5) : "");
    const b30_m = getM("B30", "inicio", b23_m ? calcularDiaTrabalho(b23_m, 10) : "");
    const b31_m = getM("B31", "inicio", b30_m ? calcularDiaTrabalho(b30_m, 15) : "");

    return {
      B5: { inicio: b5_m, fim: b5_m },
      B6: { inicio: b6_m, fim: b6_m },
      B7: { inicio: b7_m, fim: b7_m },
      B8: { inicio: b8_m, fim: b8_m },
      B10: { inicio: b10_m, fim: b10_m },
      B13: { inicio: b13_m, fim: b13_m },
      B14: { inicio: b14_m, fim: b14_m, excedeuE8: b14_excedeuE8_m },
      B15: { inicio: b15_m, fim: b15_m },
      B17: { inicio: b17_m, fim: b17_m },
      B18: { inicio: getM("B18", "inicio", b18ManualInicio || ""), fim: getM("B18", "fim", b18ManualInicio || "") },
      B19: { inicio: b19_m, fim: b19_m },
      B20: { inicio: b20_m, fim: b20_m },
      B21: { inicio: b21_m, fim: t_entrega },
      B22: { inicio: b22_m, fim: getM("B22", "fim", b22_m ? adicionarDiasCalendario(b22_m, 1) : "") },
      B23: { inicio: b23_m, fim: getM("B23", "fim", b23ManualFim || "") },
      B24: { inicio: getM("B24", "inicio", b24ManualInicio || ""), fim: "-" },
      B25: { inicio: b25_m, fim: b25_m },
      B26: { inicio: b26_m, fim: getM("B26", "fim", b26ManualFim || "") },
      B27: { inicio: b27_m, fim: b27_m },
      B28: { inicio: getM("B28", "inicio", b28ManualInicio || ""), fim: getM("B28", "fim", b28ManualInicio || "") },
      B29: { inicio: getM("B29", "inicio", b29ManualInicio || ""), fim: getM("B29", "fim", b29ManualInicio || "") },
      B30: { inicio: b30_m, fim: b30_m },
      B31: { inicio: b31_m, fim: b31_m },
      "B9": { inicio: b9_m, fim: b9_m },
      "B9+": { inicio: b9_m, fim: b9_plus_m },
    };
  };

  const adicionarFeriado = (e) => {
    e.preventDefault();
    if (!novoFeriadoData || !novoFeriadoNome.trim()) return;
    
    if (feriados.some(f => f.date === novoFeriadoData)) {
      return;
    }

    const novosFeriados = [...feriados, { date: novoFeriadoData, label: novoFeriadoNome.trim(), ativo: true }];
    novosFeriados.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setFeriados(novosFeriados);
    setNovoFeriadoData('');
    setNovoFeriadoNome('');
  };

  const removerFeriado = (dataRemover) => {
    setFeriados(feriados.filter(f => f.date !== dataRemover));
  };

  const alternarFeriadoAtivo = (dataStr) => {
    setFeriados(feriados.map(f => f.date === dataStr ? { ...f, ativo: !f.ativo } : f));
  };

  const restaurarFeriadosPadrao = () => {
    setFeriados(FERIADOS_PADRAO.map(f => ({ ...f, ativo: true })));
  };

  const possuiParametrosPreenchidos = () => {
    return !!dataEntrega && !!prazoContratual;
  };

  const obterDatasExtrasCalculadas = () => {
    const isCaed = activeScenario === 'caed';
    const manuaisCaed = obterDatasManuaisCaed();
    const manuaisGrafica = obterDatasManuaisGrafica();

    const t_entrega = isCaed
      ? (b21ManualInicio || (datasManuaisExtras["B21"] && datasManuaisExtras["B21"].inicio) || calculosCaed.entregaPolos || "1889-01-01")
      : (datasManuaisPrincipal["E12"] || manuaisGrafica.E12 || calculosGrafica.entregaPolos || "1889-01-01");

    const e8_or_c8 = isCaed
      ? (datasManuaisPrincipal["C8"] || manuaisCaed.C8 || calculosCaed.c8 || "1889-01-01")
      : (datasManuaisExtras["B15"]?.inicio || b15ManualInicio || calculosCaed.b15 || "1889-01-01");

    const c6_or_e6 = isCaed
      ? (datasManuaisPrincipal["C6"] || manuaisCaed.C6 || calculosCaed.c6 || "1889-01-01")
      : (datasManuaisPrincipal["E6"] || manuaisGrafica.E6 || calculosGrafica.e6 || "1889-01-01");

    const c5_or_e5 = isCaed
      ? (datasManuaisPrincipal["C5"] || manuaisCaed.C5 || calculosCaed.c5 || "1889-01-01")
      : (datasManuaisPrincipal["E5"] || manuaisGrafica.E5 || calculosGrafica.e5 || "1889-01-01");

    const numericPrazo = parseInt(prazoContratual, 10) || 0;

    const isBlank = (dateVal: string) => {
      return !dateVal || dateVal === "1889-01-01" || dateVal === "" || dateVal.startsWith("1889");
    };

    // Resoluções de inativação de valores de cálculo
    const activeB10 = desativadosOpcionais.B10 ? "1889-01-01" : obterProximoDiaUtil(b10ManualInicio);
    const activeB18 = desativadosOpcionais.B18 ? "1889-01-01" : obterProximoDiaUtil(b18ManualInicio);
    const activeB20 = (!possuiMaterialImpresso || desativadosOpcionais.B20) ? "1889-01-01" : obterProximoDiaUtil(b20ManualInicio);
    const activeB24 = desativadosOpcionais.B24 ? "1889-01-01" : obterProximoDiaUtil(b24ManualInicio);
    const activeB26 = desativadosOpcionais.B26 ? "1889-01-01" : b26ManualInicio; // B26 opcional ativo
    const activeB26Fim = desativadosOpcionais.B26 ? "1889-01-01" : b26ManualFim;
    const activeB28 = desativadosOpcionais.B28 ? "1889-01-01" : obterProximoDiaUtil(b28ManualInicio);
    const activeB29 = desativadosOpcionais.B29 ? "1889-01-01" : obterProximoDiaUtil(b29ManualInicio);
    const activeH8 = desativadosOpcionais.H8 ? "1889-01-01" : obterProximoDiaUtil(h8ManualInicio);

    if (evaluationType === 'somativa' || evaluationType === 'formativa') {
      const b15_base_calc = b15ManualInicio ? obterProximoDiaUtil(b15ManualInicio) : (e8_or_c8 || "1889-01-01");
      const b15_inicio_calc = b15_base_calc;

      const finalB5Inicio = isBlank(b15_inicio_calc) ? "1889-01-01" : calcularDiaTrabalho(b15_inicio_calc, -4);
      const finalB5Fim = finalB5Inicio;
      const b6_inicio = isBlank(b5ManualInicio) ? "1889-01-01" : obterProximoDiaUtil(b5ManualInicio);
      const b6_fim = b6_inicio;
      const b7_inicio = isBlank(b6_inicio) ? (isBlank(c6_or_e6) ? "1889-01-01" : adicionarDiasCalendario(c6_or_e6, 7)) : adicionarDiasCalendario(b6_inicio, 7);
      const b7_fim = b7_inicio;
      const b26_inicio_calc = activeB26; // Usar o valor ativo / inativo do controle opcional
      const b26_fim_calc = activeB26Fim;
      const b8_inicio = isBlank(b26_inicio_calc) ? "1889-01-01" : calcularDiaTrabalho(b26_inicio_calc, -33);
      const b8_fim = b8_inicio;

      // Cálculo de B21
      const b21_inicio = desativadosOpcionais.B21 ? "1889-01-01" : obterProximoDiaUtil(b21ManualInicio);
      const b21_fim = t_entrega;

      // Cálculo de B9: B5 + 11 dias úteis
      const b9_inicio_calc = isBlank(finalB5Inicio) ? "1889-01-01" : calcularDiaTrabalho(finalB5Inicio, 11);
      const b9_fim_calc = b9_inicio_calc;

      const b10_inicio = activeB10;
      const b10_fim = b10_inicio;

      // Regra de inativação para os questionários contextuais calculados (B11 e B12)
      const b11_inicio_raw = isBlank(b15_inicio_calc) ? "1889-01-01" : calcularDiaTrabalho(b15_inicio_calc, -25);
      const b11_fim_raw = isBlank(b15_inicio_calc) ? "1889-01-01" : calcularDiaTrabalho(b15_inicio_calc, -15);
      const b11_inicio = desativadosOpcionais.B11 ? "1889-01-01" : b11_inicio_raw;
      const b11_fim = desativadosOpcionais.B11 ? "1889-01-01" : b11_fim_raw;

      const b12_inicio_raw = isBlank(activeB24) ? "1889-01-01" : calcularDiaTrabalho(activeB24, -40);
      const b12_fim_raw = isBlank(activeB24) ? "1889-01-01" : calcularDiaTrabalho(activeB24, -30);
      const b12_inicio = desativadosOpcionais.B12 ? "1889-01-01" : b12_inicio_raw;
      const b12_fim = desativadosOpcionais.B12 ? "1889-01-01" : b12_fim_raw;
      
      const b14_inicio_raw = isBlank(activeB20) ? "1889-01-01" : calcularDiaTrabalho(activeB20, -12);
      const dataE8 = !isBlank(b15_inicio_calc) ? b15_inicio_calc : (!isBlank(e8_or_c8) ? e8_or_c8 : "1889-01-01");
      let b14_inicio = b14_inicio_raw;
      let b14_excedeuE8 = false;
      if (!isBlank(b14_inicio_raw) && !isBlank(dataE8) && b14_inicio_raw >= dataE8) {
        b14_inicio = "1889-01-01";
        b14_excedeuE8 = true;
      }
      const b14_fim = b14_inicio;

      let b13_inicio = "1889-01-01";
      if (!isBlank(activeB20)) {
        b13_inicio = isBlank(b14_inicio_raw) ? "1889-01-01" : calcularDiaTrabalho(b14_inicio_raw, -1);
      } else {
        b13_inicio = isBlank(b15_inicio_calc) ? "1889-01-01" : calcularDiaTrabalho(b15_inicio_calc, -1);
      }
      const b13_fim = b13_inicio;

      let b16_sem_margem = "1889-01-01";
      if (t_entrega !== "1889-01-01" && numericPrazo > 0) {
        const e11_sem = calcularDiaTrabalho(t_entrega, -numericPrazo + 4);
        const e10_sem = calcularDiaTrabalho(e11_sem, -2);
        b16_sem_margem = calcularDiaTrabalho(e10_sem, -2);
      }

      // Cálculo de B19 utilizando diretamente a âncora de entrega nos polos (t_entrega) no lugar de B21
      const b19_inicio = isBlank(t_entrega) ? "1889-01-01" : calcularDiaTrabalho(t_entrega, -20);
      const b19_fim = b19_inicio;
      const b17_inicio = isBlank(b19_inicio) ? "1889-01-01" : calcularDiaTrabalho(b19_inicio, -15);
      const b17_fim = b17_inicio;
      
      const b22_inicio = isBlank(finalB5Inicio) ? (isBlank(c5_or_e5) ? "1889-01-01" : adicionarDiasCalendario(c5_or_e5, 7)) : adicionarDiasCalendario(finalB5Inicio, 7);
      const b22_fim = isBlank(b22_inicio) || b22_inicio === "1889-01-01" ? "1889-01-01" : adicionarDiasCalendario(b22_inicio, 1);
      
      // B25 e B27 herdam o estado de ativação do B26 para evitar propagação de datas nulas
      const b25_inicio_raw = isBlank(b26_inicio_calc) ? "1889-01-01" : calcularDiaTrabalho(b26_inicio_calc, -33);
      const b25_fim_raw = b25_inicio_raw;
      const b25_inicio = desativadosOpcionais.B26 ? "1889-01-01" : b25_inicio_raw;
      const b25_fim = desativadosOpcionais.B26 ? "1889-01-01" : b25_fim_raw;

      const b27_inicio_raw = isBlank(b25_inicio) ? "1889-01-01" : calcularDiaTrabalho(b25_inicio, 5);
      const b27_fim_raw = b27_inicio_raw;
      const b27_inicio = desativadosOpcionais.B26 ? "1889-01-01" : b27_inicio_raw;
      const b27_fim = desativadosOpcionais.B26 ? "1889-01-01" : b27_fim_raw;

      const b30_inicio = isBlank(b23ManualInicio) ? "1889-01-01" : calcularDiaTrabalho(b23ManualInicio, 10);
      const b30_fim = b30_inicio;
      const b31_inicio = isBlank(b30_inicio) ? "1889-01-01" : calcularDiaTrabalho(b30_inicio, 15);
      const b31_fim = b31_inicio;

      const finalB9Inicio = b9_inicio_calc;
      const finalB9Fim = finalB9Inicio;
      const b9_plus_fim = isBlank(finalB9Fim) ? "1889-01-01" : (constaCaedAplicacao ? calcularDiaTrabalho(finalB9Fim, 4) : "1889-01-01");

      return [
        { celula: "B6", nome: "Envio do leiaute para coleta/atualização de usuários", formula_inicio: "=Sidebar", formula_fim: "=C6", inicio: b6_inicio, fim: b6_fim, isFromGrafica: false },
        { celula: "B7", nome: "Envio da planilha de usuários", formula_inicio: "=C6+7", formula_fim: "-", inicio: b7_inicio, fim: b7_fim, isFromGrafica: false },
        { celula: "B8", nome: "Recebimento do checklist de pessoa física", formula_inicio: "=DIATRABALHO(C26;-33;Feriados!$B:$B)", formula_fim: "=C8", inicio: b8_inicio, fim: b8_fim, isB8: true, isFromGrafica: false, dependenteB26: true },
        { celula: "B10", nome: "Análise das inconsistências da base institutional", formula_inicio: "Preenchimento Opcional", formula_fim: "=B21", inicio: b10_inicio, fim: b10_fim, manualB10: true, isFromGrafica: false },
        { celula: "B13", nome: "Disponibilização dos materiais de capacitação", formula_inicio: "=SE(C20=\"\";DIATRABALHO(C15;-1;Feriados!$B$2:$B$103);DIATRABALHO(C14;-1;Feriados!$B$2:$B$103))", formula_fim: "=C13", inicio: b13_inicio, fim: b13_fim, isFromGrafica: true },
        { celula: "B14", nome: "Envio dos materiais de capacitação antecipados para impressão", formula_inicio: "=DIATRABALHO(C20;-12;Feriados!$B2:$B103)", formula_fim: "=C14", inicio: b14_inicio, fim: b14_fim, isMaterialImpresso: true, isFromGrafica: false, excedeuE8: b14_excedeuE8 },
        { celula: "B15", nome: "Envio dos arquivos para impressão", formula_inicio: "Cópia de E9", formula_fim: "-", inicio: b15_inicio_calc, fim: b15_inicio_calc, isFromGrafica: true },
        { celula: "B16", nome: "Envio dos arquivos para impressão (contratual)", formula_inicio: "=B15 (sem margem)", formula_fim: "=C16", inicio: b16_sem_margem, fim: b16_sem_margem, isFromGrafica: true },
        { celula: "B5", nome: "Solicitação de leiaute de base de agentes de Campo (CAEd Aplicação)", formula_inicio: "=DIATRABALHO(B15;-4;Feriados!$B:$B)", formula_fim: "=C5", inicio: finalB5Inicio, fim: finalB5Fim, isB5B9: true, isFromGrafica: true },
        { celula: "B9", nome: "Envio da base de agentes de Campo (CAEd Aplicação)", formula_inicio: "=DIATRABALHO(B5;11;Feriados!$B:$B)", formula_fim: "=C9", inicio: finalB9Inicio, fim: finalB9Fim, isB5B9: true, isFromGrafica: true },
        { celula: "B9+", nome: "Publicação do Card Acompanhamento da Inscrição e Curso no CAEd Aplicação", formula_inicio: "=D9", formula_fim: "=DIATRABALHO(D9;4;Feriados!$B:$B)", inicio: b9_plus_fim, fim: b9_plus_fim, isB5B9: true, isFromGrafica: true },
        { celula: "B17", nome: "Envio dos cadernos para produção em braile", formula_inicio: "=DIATRABALHO(C19;-15;Feriados!$B$2:$B$103)", formula_fim: "=C17", inicio: b17_inicio, fim: b17_fim, isFromGrafica: true },
        { celula: "B18", nome: "Envio dos arquivos de testes adaptados (AD e/ou libras) para Consórcio", formula_inicio: "Preenchimento Opcional", formula_fim: "-", inicio: activeB18, fim: activeB18, manualB18: true, isFromGrafica: false },
        { celula: "B19", nome: "Entrega dos testes adaptados na gráfica (braile, AD e/ou libras)", formula_inicio: "=DIATRABALHO(E12;-20)", formula_fim: "=C19", inicio: b19_inicio, fim: b19_fim, isFromGrafica: true },
        { celula: "B20", nome: "Entrega dos materiais de capacitação antecipados nos polos", formula_inicio: "Preenchimento Opcional", formula_fim: "-", inicio: activeB20, fim: activeB20, manualB20: true, isMaterialImpresso: true, isFromGrafica: false },
        { celula: "B21", nome: "Entrega dos materiais nos polos", formula_inicio: "=E12", formula_fim: "-", inicio: b21_inicio, fim: b21_fim, manualB21: true, isFromGrafica: true },
        { celula: "B22", nome: "Envio de tutorial - Cadastro de profissionais", formula_inicio: "=C5+7", formula_fim: "=C22+1", inicio: b22_inicio, fim: b22_fim, isFromGrafica: false },
        { celula: "B23", nome: "Aplicação dos cadernos de testes impressos", formula_inicio: "Preenchimento no menu lateral", formula_fim: "Preenchimento no menu lateral", inicio: b23ManualInicio, fim: b23ManualFim, isFromGrafica: false, isSincronizadoTopo: true },
        { celula: "B24", nome: "Aplicação dos questionários digitais", formula_inicio: "Preenchimento Opcional", formula_fim: "-", inicio: activeB24, fim: "-", manualB24: true, isFromGrafica: false },
        { celula: "B25", nome: "Cadastramento das rotas", formula_inicio: "=DIATRABALHO(C26;-33;Feriados!$B$2:$B$103)", formula_fim: "=C25", inicio: b25_inicio, fim: b25_fim, isFromGrafica: false, dependenteB26: true },
        { celula: "B26", nome: "Recolhimento dos materiais nos polos", formula_inicio: "Preenchimento Opcional", formula_fim: "Preenchimento Opcional", inicio: b26_inicio_calc, fim: b26_fim_calc, isFromGrafica: false, manualB26: true, opcionalB26: true },
        { celula: "B27", nome: "Disponibilização da Ordem de Produção", formula_inicio: "=DIATRABALHO(C25;5;Feriados!$B$2:$B$103)", formula_fim: "=C27", inicio: b27_inicio, fim: b27_fim, isFromGrafica: false, dependenteB26: true },
        { celula: "B28", nome: "Envio de tutorial - Publicação dos resultados preliminares", formula_inicio: "Preenchimento Opcional", formula_fim: "-", inicio: activeB28, fim: activeB28, manualB28: true, isFromGrafica: false },
        { celula: "B29", nome: "Disponibilização do Relatório de Entrega - Publicação de Resultados Preliminares", formula_inicio: "Preenchimento Opcional", formula_fim: "-", inicio: activeB29, fim: activeB29, manualB29: true, isFromGrafica: false },
        { celula: "B30", nome: "Disponibilização do Protocolo de Interposição de Recursos", formula_inicio: "=DIATRABALHO(C23;10;Feriados!$B$2:$B$103)", formula_fim: "=C30", inicio: b30_inicio, fim: b30_fim, isFromGrafica: false },
        { celula: "B31", nome: "Disponibilização do P06 - Recursos", formula_inicio: "=DIATRABALHO(C30;15;Feriados!$B$2:$B$103)", formula_fim: "=C31", inicio: b31_inicio, fim: b31_fim, isFromGrafica: false }
      ];
    } else {
      const h5_inicio = h5ManualInicio ? obterProximoDiaUtil(h5ManualInicio) : "1889-01-01";
      const h5_fim = h5_inicio;
      const h6_inicio = isBlank(h5_inicio) ? "1889-01-01" : adicionarDiasCalendario(h5_inicio, 7);
      const h6_fim = h6_inicio;
      const h11_inicio = h11ManualInicio ? obterProximoDiaUtil(h11ManualInicio) : "1889-01-01";
      const h11_fim = h11ManualFim ? obterProximoDiaUtil(h11ManualFim) : "1889-01-01";
      const h9_inicio = isBlank(h11_inicio) ? "1889-01-01" : calcularDiaTrabalho(h11_inicio, -24);
      const h9_fim = h9_inicio;
      const h7_inicio = isBlank(h9_inicio) ? "1889-01-01" : calcularDiaTrabalho(h9_inicio, -6);
      const h7_fim = h7_inicio;
      const h8_inicio = activeH8;
      const h8_fim = h8ManualFim ? obterProximoDiaUtil(h8ManualFim) : "1889-01-01";
      const h10_inicio = isBlank(h5_inicio) ? "1889-01-01" : adicionarDiasCalendario(h5_inicio, 7);
      const h10_fim = h10_inicio;
      const h12_inicio = h12ManualInicio ? obterProximoDiaUtil(h12ManualInicio) : "1889-01-01";
      const h12_fim = h12_inicio;
      const h13_inicio = isBlank(h12_inicio) ? "1889-01-01" : calcularDiaTrabalho(h12_inicio, 2);
      const h13_fim = h13_inicio;
      const h14_inicio = isBlank(h11_inicio) ? "1889-01-01" : calcularDiaTrabalho(h11_inicio, 5);
      const h14_fim = h14_inicio;
      const h15_inicio = isBlank(h14_inicio) ? "1889-01-01" : calcularDiaTrabalho(h14_inicio, 5);
      const h15_fim = h15_inicio;

      return [
        { celula: "H5", nome: "Envio do leiaute para coleta/atualização de usuários", formula_inicio: "Preenchimento no menu lateral", formula_fim: "=I5", inicio: h5_inicio, fim: h5_fim, isFromGrafica: false, isSincronizadoTopo: true },
        { celula: "H6", nome: "Envio da planilha de usuários", formula_inicio: "=I5+7", formula_fim: "-", inicio: h6_inicio, fim: h6_fim, isFromGrafica: false },
        { celula: "H7", nome: "Recebimento do checklist de pessoa física", formula_inicio: "=DIATRABALHO(I9;-6;Feriados!$B$2:$B$103)", formula_fim: "=I7", inicio: h7_inicio, fim: h7_fim, isFromGrafica: false },
        { celula: "H8", nome: "Análise das inconsistências da base institucional", formula_inicio: "Preenchimento Opcional", formula_fim: "Preenchimento Opcional", inicio: h8_inicio, fim: h8_fim, isFromGrafica: false, manualH8: true },
        { celula: "H9", nome: "Elaboração de cronograma de correção", formula_inicio: "=DIATRABALHO(I11;-24;Feriados!$B$2:$B$103)", formula_fim: "=I9", inicio: h9_inicio, fim: h9_fim, isFromGrafica: false },
        { celula: "H10", nome: "Envio de tutorial - Cadastro de profissionais", formula_inicio: "=I5+7", formula_fim: "=I10", inicio: h10_inicio, fontStyle: "font-sans", fim: h10_fim, isFromGrafica: false },
        { celula: "H11", nome: "Gravação / sincronização (INÍCIO - FIM)", formula_inicio: "Preenchimento no menu lateral", formula_fim: "Preenchimento no menu lateral", inicio: h11_inicio, fim: h11_fim, isFromGrafica: false, isSincronizadoTopo: true },
        { celula: "H12", nome: "Envio de tutorial - Publicação dos resultados preliminares", formula_inicio: "Preenchimento no menu lateral", formula_fim: "-", inicio: h12_inicio, fim: h12_fim, isFromGrafica: false, isSincronizadoTopo: true },
        { celula: "H13", nome: "Disponibilização do Relatório de Entrega - Publicação de Resultados Preliminares", formula_inicio: "=DIATRABALHO(I12; 2; Feriados!$B:$B)", formula_fim: "-", inicio: h13_inicio, fim: h13_fim, isFromGrafica: false },
        { celula: "H14", nome: "Disponibilização do Protocolo de Interposição de Recursos", formula_inicio: "=DIATRABALHO(I11;5;Feriados!$B$2:$B$103)", formula_fim: "=I14", inicio: h14_inicio, fontStyle: "font-sans", fim: h14_fim, isFromGrafica: false },
        { celula: "H15", nome: "Disponibilização do P06 - Recursos", formula_inicio: "=DIATRABALHO(I14;5;Feriados!$B$2:$B$103)", formula_fim: "=I15", inicio: h15_inicio, fontStyle: "font-sans", fim: h15_fim, isFromGrafica: false }
      ];
    }
  };

  const renderInicioCell = (row, isRowDisabled, applyBlueHighlight) => {
    if (row.celula === "B14" && row.excedeuE8) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="text-right w-[110px] shrink-0">
            <span className="text-slate-400 font-medium select-none font-sans"></span>
          </div>
        </div>
      );
    }

    // Se o elemento B26 ou dependente do B26 estiver inativado na tabela, renderize cinza/esmaecido
    const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
    const isRowEffectivelyDisabled = isRowDisabled || dependenteInativoB26;

    if (isRowEffectivelyDisabled) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="text-right w-[110px] shrink-0">
            <span className="text-slate-400 font-medium select-none font-sans">-</span>
          </div>
        </div>
      );
    }

    // Identificação de campos opcionais calculados (B11 e B12) para adicionar o checkbox Ativo/Inativo
    if (row.manualCheckCalculado) {
      const isDeactivated = desativadosOpcionais[row.celula];
      return (
        <div className="flex items-center justify-end gap-2.5">
          <label className="inline-flex items-center gap-1 cursor-pointer w-[60px] shrink-0 opacity-100 select-none" title="Marque para habilitar ou inativar a etapa">
            <input
              type="checkbox"
              checked={!isDeactivated}
              onChange={(e) => {
                setDesativadosOpcionais(prev => ({
                  ...prev,
                  [row.celula]: !e.target.checked
                }));
              }}
              className="rounded text-[#3F48CC] focus:ring-[#3F48CC] h-3 w-3 cursor-pointer opacity-100"
            />
            <span className={`text-[7.5px] uppercase tracking-wide font-bold select-none font-sans opacity-100 ${isDeactivated ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
              {!isDeactivated ? "Ativo" : "Inativo"}
            </span>
          </label>
          <div className={`text-right w-[110px] shrink-0 ${isDeactivated ? 'opacity-35' : ''}`}>
            <span className="text-slate-800 font-normal font-sans">
              {isDeactivated ? "-" : formatarDataBR(row.inicio)}
            </span>
          </div>
        </div>
      );
    }

    // Identificação de campos opcionais que possuem preenchimento manual diretamente na tabela
    const isOptionalManual = row.manualB10 || row.manualB18 || row.manualB20 || row.manualB21 || row.manualB24 || row.opcionalB26 || row.manualB28 || row.manualB29 || row.manualH8;

    if (isOptionalManual) {
      let val = "";
      let setVal = null;
      if (row.manualB10) { val = b10ManualInicio; setVal = setB10ManualInicio; }
      else if (row.manualB18) { val = b18ManualInicio; setVal = setB18ManualInicio; }
      else if (row.manualB20) { val = b20ManualInicio; setVal = setB20ManualInicio; }
      else if (row.manualB21) { val = b21ManualInicio; setVal = setB21ManualInicio; }
      else if (row.manualB24) { val = b24ManualInicio; setVal = setB24ManualInicio; }
      else if (row.opcionalB26) { val = b26ManualInicio; setVal = setB26ManualInicio; }
      else if (row.manualB28) { val = b28ManualInicio; setVal = setB28ManualInicio; }
      else if (row.manualB29) { val = b29ManualInicio; setVal = setB29ManualInicio; }
      else if (row.manualH8) { val = h8ManualInicio; setVal = setH8ManualInicio; }

      const isDeactivated = desativadosOpcionais[row.celula];

      return (
        <div className="flex items-center justify-end gap-2.5">
          <label className="inline-flex items-center gap-1 cursor-pointer w-[60px] shrink-0 opacity-100 select-none" title="Marque para habilitar ou inativar o campo">
            <input
              type="checkbox"
              checked={!isDeactivated}
              onChange={(e) => {
                setDesativadosOpcionais(prev => ({
                  ...prev,
                  [row.celula]: !e.target.checked
                }));
              }}
              className="rounded text-[#3F48CC] focus:ring-[#3F48CC] h-3 w-3 cursor-pointer opacity-100"
            />
            <span className={`text-[7.5px] uppercase tracking-wide font-bold select-none font-sans opacity-100 ${isDeactivated ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
              {!isDeactivated ? "Ativo" : "Inativo"}
            </span>
          </label>
          <div className="w-[110px] shrink-0 text-right">
            {isDeactivated ? (
               <span className="text-slate-400 font-medium select-none font-sans">-</span>
            ) : (
              <CampoData
                disabled={isDeactivated}
                value={val || ""}
                onChange={(newVal) => setVal && setVal(newVal)}
                className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] shrink-0 hover:border-slate-300 transition-colors shadow-xs"
              />
            )}
          </div>
        </div>
      );
    }

    if (row.isSincronizadoTopo) {
      let value = "";
      let onChangeFn = null;
      if (row.celula === 'B15') { 
        value = b15ManualInicio || ""; 
        onChangeFn = setB15ManualInicio; 
      }
      else if (row.celula === 'B5') { value = b5ManualInicio || ""; onChangeFn = setB5ManualInicio; }
      else if (row.celula === 'B23') { value = b23ManualInicio || ""; onChangeFn = null; }
      else if (row.celula === 'H5') { value = h5ManualInicio || ""; onChangeFn = setH5ManualInicio; }
      else if (row.celula === 'H11') { value = h11ManualInicio || ""; onChangeFn = setH11ManualInicio; }
      else if (row.celula === 'H12') { value = h12ManualInicio || ""; onChangeFn = setH12ManualInicio; }

      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="w-[110px] shrink-0 text-right">
            {onChangeFn ? (
              <CampoData
                value={value || ""}
                onChange={(newVal) => onChangeFn(newVal)}
                className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-[#3F48CC] bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] hover:border-slate-300 transition-colors shadow-xs"
              />
            ) : (
              <span className="text-slate-800 font-normal font-sans">
                {formatarDataBR(row.inicio)}
              </span>
            )}
          </div>
        </div>
      );
    }
    
    if (row.manual) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="w-[110px] shrink-0 text-right">
            <CampoData
              disabled={isRowDisabled}
              value={row.keyManual === 'B5' ? b5ManualInicio : b9ManualInicio}
              onChange={(newVal) => {
                if (row.keyManual === 'B5') setB5ManualInicio(newVal);
                if (row.keyManual === 'B9') setB9ManualInicio(newVal);
              }}
              className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] hover:border-slate-300 transition-colors shadow-xs"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-2.5">
        <div className="w-[60px] shrink-0" />
        <div className="text-right w-[110px] shrink-0">
          <span className="text-slate-800 font-normal font-sans">
            {formatarDataBR(row.inicio)}
          </span>
        </div>
      </div>
    );
  };

  const renderFimCell = (row, isRowDisabled, applyBlueHighlight) => {
    if (row.celula === "B14" && row.excedeuE8) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="text-right w-[110px] shrink-0">
            <span className="text-slate-400 font-medium select-none font-sans"></span>
          </div>
        </div>
      );
    }

    // Se o elemento B26 ou dependente do B26 estiver inativado na tabela, renderize cinza/esmaecido
    const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
    const isRowEffectivelyDisabled = isRowDisabled || dependenteInativoB26;

    if (isRowEffectivelyDisabled) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="text-right w-[110px] shrink-0">
            <span className="text-slate-400 font-medium select-none font-sans">-</span>
          </div>
        </div>
      );
    }

    // Identificação de campos opcionais calculados (B11 e B12) para sincronizar o estilo esmaecido de "Inativo"
    if (row.manualCheckCalculado) {
      const isDeactivated = desativadosOpcionais[row.celula];
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className={`text-right w-[110px] shrink-0 ${isDeactivated ? 'opacity-35' : ''}`}>
            <span className="text-slate-800 font-normal font-sans">
              {isDeactivated ? "-" : formatarDataBR(row.fim)}
            </span>
          </div>
        </div>
      );
    }

    const isDeactivated = desativadosOpcionais[row.celula];

    if (row.isSincronizadoTopo) {
      let value = "";
      let onChangeFn = null;
      if (row.celula === 'H11') { value = h11ManualFim || ""; onChangeFn = setH11ManualFim; }

      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="w-[110px] shrink-0 text-right">
            {onChangeFn ? (
              <CampoData
                value={value || ""}
                onChange={(newVal) => onChangeFn(newVal)}
                className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-[#3F48CC] bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] hover:border-slate-300 transition-colors shadow-xs"
              />
            ) : (
              <span className="text-slate-800 font-normal font-sans">
                {formatarDataBR(row.fim)}
              </span>
            )}
          </div>
        </div>
      );
    }

    if (row.manual) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="w-[110px] shrink-0 text-right">
            <CampoData
              disabled={isRowDisabled}
              value={row.keyManual === 'B5' ? b5ManualFim : b9ManualFim}
              onChange={(newVal) => {
                if (row.keyManual === 'B5') setB5ManualFim(newVal);
                if (row.keyManual === 'B9') setB9ManualFim(newVal);
              }}
              className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] hover:border-slate-300 transition-colors shadow-xs"
            />
          </div>
        </div>
      );
    }

    if (row.opcionalB26) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="w-[110px] shrink-0 text-right">
            {isDeactivated ? (
              <span className="text-slate-400 font-medium select-none font-sans">-</span>
            ) : (
              <CampoData
                disabled={isDeactivated}
                value={b26ManualFim || ""}
                onChange={(newVal) => setB26ManualFim(newVal)}
                className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] hover:border-slate-300 transition-colors shadow-xs"
              />
            )}
          </div>
        </div>
      );
    }

    if (row.manualH8) {
      return (
        <div className="flex items-center justify-end gap-2.5">
          <div className="w-[60px] shrink-0" />
          <div className="w-[110px] shrink-0 text-right">
            {isDeactivated ? (
              <span className="text-slate-400 font-medium select-none font-sans">-</span>
            ) : (
              <CampoData
                disabled={isDeactivated}
                value={h8ManualFim || ""}
                onChange={(newVal) => setH8ManualFim(newVal)}
                className="border border-slate-200 rounded px-1.5 h-7 text-[11px] font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] w-[110px] hover:border-slate-300 transition-colors shadow-xs"
              />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-end gap-2.5">
        <div className="w-[60px] shrink-0" />
        <div className="text-right w-[110px] shrink-0">
          <span className="text-slate-800 font-normal font-sans">
            {formatarDataBR(row.fim)}
          </span>
        </div>
      </div>
    );
  };

  const isFluencia = evaluationType === 'fluencia';

  // --- MOTOR DE CÁLCULO GERAL (PULA FIM DE SEMANA E FERIADOS ATIVOS) ---
  const obterFeriadosAtivosArray = useMemo(() => {
    return feriados.filter(f => f.ativo).map(f => f.date);
  }, [feriados]);

  const isSidebarEnabled = codSubprograma.length === 4;

  return (
    <FeriadosContext.Provider value={feriados}>
      <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col md:flex-row" lang="pt-BR">
      
      {/* SIDEBAR RECOLHÍVEL (PAINEL DE CONTROLE DOS PARÂMETROS) */}
      <aside 
        className={`bg-white border-r border-[#C9CACC] flex flex-col shrink-0 transition-all duration-300 z-30 h-screen sticky top-0 ${
          sidebarOpen ? 'w-full md:w-[317px] lg:w-[352px]' : 'w-0 overflow-hidden md:w-16'
        }`}
      >
        {sidebarOpen ? (
          <>
            {/* Cabeçalho do Sidebar */}
            <div className="p-4 border-b border-[#C9CACC] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <span className="inline-block w-1.5 h-4 bg-[#FFF200] rounded-full"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">
                  Parâmetros
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={limparPreenchimentosManuaisSidebar}
                  className="p-1.5 rounded border border-[#C9CACC] bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition text-slate-500 focus:outline-none"
                  title="Limpar preenchimentos manuais do painel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded border border-[#C9CACC] bg-white hover:bg-slate-200 transition text-slate-500 hover:text-slate-800 focus:outline-none"
                  title="Recolher painel"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo com scroll do Sidebar */}
            <div className="flex-1 overflow-y-auto scrollbar-none p-3 space-y-2 bg-white">
              {/* Campo CÓD. SUBPROGRAMA e NOME DO SUBPROGRAMA */}
              <div className="space-y-1.5 pb-2 border-b border-slate-100">
                {/* CÓD. SUBPROGRAMA */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <label className="block text-[10px] font-bold uppercase text-slate-700 font-sans">
                      Cód. Subprograma <span className="text-red-500 font-bold">*</span>:
                    </label>
                    <div className="relative group inline-flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-[#3F48CC]/70 hover:text-[#3F48CC] cursor-help transition-colors" />
                      <div className="absolute left-1/2 -translate-x-1/2 top-5 hidden group-hover:block w-56 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg shadow-xl text-[10px] font-semibold leading-normal font-sans z-50">
                        ⚠️ Insira o Cód. Subprograma com 4 dígitos para liberar as demais opções.
                      </div>
                    </div>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Ex: 1234"
                    value={codSubprograma}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCodSubprograma(val);
                    }}
                    className={`w-full border rounded px-2.5 h-7.5 text-xs font-bold font-sans transition focus:outline-none focus:ring-1 focus:ring-[#3F48CC] ${
                      isSidebarEnabled 
                        ? 'border-[#C9CACC] text-slate-800 bg-white focus:border-[#3F48CC]' 
                        : 'border-red-300 text-red-600 bg-red-50/10 placeholder-red-300 focus:border-red-500'
                    }`}
                  />
                </div>

                {/* NOME DO SUBPROGRAMA */}
                <div className="space-y-0.5">
                  <label className="block text-[10px] font-bold uppercase text-slate-700 font-sans">
                    Nome do Subprograma:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Minas Gerais 2026"
                    value={nomeSubprograma}
                    onChange={(e) => setNomeSubprograma(e.target.value)}
                    disabled={!isSidebarEnabled}
                    className={`w-full border rounded px-2.5 h-7.5 text-xs font-medium font-sans transition focus:outline-none focus:border-[#3F48CC] focus:ring-1 focus:ring-[#3F48CC] ${
                      isSidebarEnabled 
                        ? 'border-[#C9CACC] text-slate-800 bg-white' 
                        : 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>



              {/* Wrapper conditional class based on isSidebarEnabled */}
              <div className={`space-y-2.5 transition-all duration-300 ${!isSidebarEnabled ? 'opacity-35 pointer-events-none select-none' : ''}`}>
                {/* 1. Tipo de Avaliação */}
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#3F48CC] font-sans">TIPO DE AVALIAÇÃO</span>
              <div className="inline-flex w-full rounded-lg border border-[#C9CACC] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setEvaluationType('somativa')}
                  className={`flex-1 py-1 text-[11px] font-bold uppercase rounded transition-all focus:outline-none font-sans ${
                    evaluationType === 'somativa'
                      ? 'bg-[#3F48CC] text-white'
                      : 'text-slate-500 hover:text-[#3F48CC]'
                  }`}
                >
                  Somativa
                </button>
                <button
                  type="button"
                  onClick={() => setEvaluationType('formativa')}
                  className={`flex-1 py-1 text-[11px] font-bold uppercase rounded transition-all focus:outline-none font-sans ${
                    evaluationType === 'formativa'
                      ? 'bg-[#3F48CC] text-white'
                      : 'text-slate-500 hover:text-[#3F48CC]'
                  }`}
                >
                  Formativa
                </button>
              </div>
            </div>

            {/* 2. Cenário de DVs */}
            <div className={`space-y-1 transition-all duration-300 ${isFluencia ? 'opacity-40 select-none pointer-events-none' : ''}`}>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#3F48CC] font-sans">GERAÇÃO DE DADOS VARIÁVEIS</span>
              <div className="inline-flex w-full rounded-lg border border-[#C9CACC] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => !isFluencia && setActiveScenario('caed')}
                  disabled={isFluencia}
                  className={`flex-1 py-1 text-[11px] font-bold uppercase rounded transition-all focus:outline-none font-sans ${
                    activeScenario === 'caed' && !isFluencia
                      ? 'bg-[#3F48CC] text-white'
                      : 'text-slate-500 hover:text-[#3F48CC]'
                  }`}
                >
                  CAEd
                </button>
                <button
                  type="button"
                  onClick={() => !isFluencia && setActiveScenario('grafica')}
                  disabled={isFluencia}
                  className={`flex-1 py-1 text-[11px] font-bold uppercase rounded transition-all focus:outline-none font-sans ${
                    activeScenario === 'grafica' && !isFluencia
                      ? 'bg-[#3F48CC] text-white'
                      : 'text-slate-500 hover:text-[#3F48CC]'
                  }`}
                >
                  GRÁFICA
                </button>
              </div>
            </div>

            {/* 3. Parâmetros Iniciais */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3F48CC] font-sans">PARÂMETROS INICIAIS</span>
                <span className="text-red-500 font-bold text-[8px]">* Obrigatórios</span>
              </div>

              {/* Entrega nos Polos */}
              <div className="space-y-0.5">
                <label className="block text-[10px] font-bold uppercase text-slate-700 font-sans">
                  ENTREGA NOS POLOS ATÉ:<span className="text-red-500 font-bold">*</span>
                </label>
                <CampoData
                  value={dataEntrega}
                  onChange={(val) => setDataEntrega(val)}
                  required
                  className="w-full border border-slate-200 rounded px-2 h-7.5 text-xs font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] hover:border-slate-300 transition shadow-xs"
                />
              </div>

              {/* Prazo Gráfico */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 font-sans">
                  <label className="block text-[10px] font-bold uppercase text-slate-700 font-sans">
                    Prazo Gráfico (Dias) <span className="text-red-500 font-bold">*</span>:
                  </label>
                  <Info className="w-3 h-3 text-[#3F48CC]" />
                </div>
                <div className="flex gap-2">
                  <div className="w-24 border border-[#C9CACC] rounded px-2 py-0.5 flex flex-col justify-center bg-white text-[9px] shrink-0">
                    <span className="font-semibold text-slate-400 truncate">Contratual:</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 28"
                      value={prazoContratual}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0;
                        setPrazoContratual(val);
                        if (val !== '') {
                          const comFator = Math.ceil(Number(val) * 1.25);
                          setPrazoComFator(comFator);
                          setPrazoContratualOriginal(val);
                          setPrazoComFatorOriginal(comFator);
                        } else {
                          setPrazoComFator('');
                          setPrazoContratualOriginal('');
                          setPrazoComFatorOriginal('');
                        }
                        setPrazoContratualEditado('');
                        setPrazoComFatorEditado('');
                      }}
                      className="w-full text-xs font-bold text-slate-800 focus:outline-none bg-transparent font-sans"
                    />
                  </div>
                  <div className="flex-1 border border-[#C9CACC] rounded px-2 py-0.5 flex flex-col justify-center bg-white text-[9px] min-w-0">
                    <span className="font-semibold text-slate-400 truncate">Prazo Protocolos (Fator 1,25):</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 35"
                      value={prazoComFator}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0;
                        setPrazoComFator(val);
                        if (val !== '') {
                          if (prazoComFatorOriginal !== '' && prazoComFatorOriginal !== null) {
                            setPrazoComFatorEditado(val);
                          } else {
                            setPrazoComFatorOriginal(val);
                            setPrazoComFatorEditado('');
                          }
                        } else {
                          setPrazoComFatorEditado('');
                        }
                      }}
                      className="w-full text-xs font-bold text-[#3F48CC] focus:outline-none bg-transparent font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Critérios de Habilitação do Subprograma */}
            {(evaluationType === 'somativa' || evaluationType === 'formativa') && (
              <div className="space-y-1 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3F48CC] block">
                  CRITÉRIOS DE HABILITAÇÃO
                </span>
                
                <div className="grid grid-cols-2 gap-1">
                  <label className="flex items-center gap-1.5 p-1 bg-slate-50 border border-[#C9CACC] rounded-md cursor-pointer hover:bg-slate-100 transition min-h-[36px]">
                    <input
                      type="checkbox"
                      checked={constaCaedAplicacao}
                      onChange={(e) => setConstaCaedAplicacao(e.target.checked)}
                      className="rounded text-[#3F48CC] focus:ring-[#3F48CC] h-3.5 w-3.5 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex flex-col justify-center">
                      <span className="block text-[10px] font-bold text-slate-800 leading-tight">CAEd APLICAÇÃO (EP05)</span>
                      <span className="block text-[8px] text-slate-500 mt-0.5 leading-none">
                        Ativa B5 e B9
                      </span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-1.5 p-1 bg-slate-50 border border-[#C9CACC] rounded-md transition min-h-[36px] ${
                    desativadosOpcionais.B26
                      ? "opacity-60 cursor-not-allowed select-none"
                      : "cursor-pointer hover:bg-slate-100"
                  }`}>
                    <input
                      type="checkbox"
                      checked={possuiEscrita}
                      disabled={desativadosOpcionais.B26}
                      onChange={(e) => setPossuiEscrita(e.target.checked)}
                      className={`rounded text-[#3F48CC] focus:ring-[#3F48CC] h-3.5 w-3.5 shrink-0 ${
                        desativadosOpcionais.B26 ? "cursor-not-allowed text-slate-400" : "cursor-pointer"
                      }`}
                    />
                    <div className="min-w-0 flex flex-col justify-center">
                      <span className="block text-[10px] font-bold leading-tight text-slate-800">ESCRITA IRC</span>
                      <span className="block text-[8px] text-slate-500 mt-0.5 leading-none">
                        Ativa B8
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-1.5 p-1 bg-slate-50 border border-[#C9CACC] rounded-md cursor-pointer hover:bg-slate-100 transition min-h-[36px] col-span-2">
                    <input
                      type="checkbox"
                      checked={possuiMaterialImpresso}
                      onChange={(e) => setPossuiMaterialImpresso(e.target.checked)}
                      className="rounded text-[#3F48CC] focus:ring-[#3F48CC] h-3.5 w-3.5 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex flex-col justify-center">
                      <span className="block text-[10px] font-bold text-slate-800 leading-tight">MANUAIS IMPRESSOS</span>
                      <span className="block text-[8px] text-slate-500 mt-0.5 leading-none">
                        Ativa B14 e B20
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* 4. Campos de Preenchimento da Avaliação Selecionada */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#3F48CC] block">
                  CAMPOS DE PREENCHIMENTO
                </span>
                <button
                  onClick={limparPreenchimentosCamposPreenchimento}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 px-1.5 py-0.5 rounded border border-transparent hover:border-red-200 transition font-sans"
                  title="Limpar preenchimentos manuais dos campos de preenchimento"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Limpar</span>
                </button>
              </div>

              {/* B23: Aplicação dos cadernos de testes impressos */}
              <div className="space-y-0.5">
                <label className="block text-[10px] font-bold text-slate-700">
                  APLICAÇÃO CADERNOS: <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-semibold text-slate-500 block uppercase">Início</span>
                    <CampoData
                      value={b23ManualInicio}
                      onChange={(val) => setB23ManualInicio(val)}
                      required
                      className="w-full border border-slate-200 rounded px-2 h-7.5 text-xs font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] hover:border-slate-300 transition shadow-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-semibold text-slate-500 block uppercase">Fim</span>
                    <CampoData
                      value={b23ManualFim}
                      onChange={(val) => setB23ManualFim(val)}
                      required
                      className="w-full border border-slate-200 rounded px-2 h-7.5 text-xs font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] hover:border-slate-300 transition shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* B26: Recolhimento dos materiais nos polos [INÍCIO] */}
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-slate-700">
                    INÍCIO RECOLHIMENTO POLOS:
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer opacity-100 select-none">
                    <input
                      type="checkbox"
                      checked={!desativadosOpcionais.B26}
                      onChange={(e) => {
                        setDesativadosOpcionais(prev => ({
                          ...prev,
                          B26: !e.target.checked
                        }));
                      }}
                      className="rounded text-[#3F48CC] focus:ring-[#3F48CC] h-3 w-3 cursor-pointer opacity-100"
                    />
                    <span className={`text-[7.5px] uppercase tracking-wide font-bold select-none opacity-100 ${desativadosOpcionais.B26 ? 'text-slate-900 font-black' : 'text-slate-700'}`}>
                      {!desativadosOpcionais.B26 ? "Ativo" : "Inativo"}
                    </span>
                  </label>
                </div>
                <CampoData
                  disabled={desativadosOpcionais.B26}
                  value={desativadosOpcionais.B26 ? "" : b26ManualInicio}
                  onChange={(val) => setB26ManualInicio(val)}
                  className="w-full border border-slate-200 rounded px-2 h-7.5 text-xs font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] hover:border-slate-300 transition shadow-xs"
                />
              </div>

              {/* SOLICITAÇÃO DE LEIAUTE DA BASE INSTITUCIONAL */}
              <div className="space-y-0.5">
                <label className="block text-[10px] font-bold text-slate-700 uppercase font-sans">
                  SOLICITAÇÃO DE LEIAUTE DA BASE INSTITUCIONAL <span className="text-red-500 font-bold">*</span>:
                </label>
                <CampoData
                  value={b5ManualInicio}
                  onChange={(val) => setB5ManualInicio(val)}
                  required
                  className="w-full border border-slate-200 rounded px-2 h-8 text-xs font-medium text-slate-600 bg-white focus:outline-none focus:border-[#3F48CC] hover:border-slate-300 transition shadow-xs"
                />
              </div>
              {/* Closing the isSidebarEnabled conditional wrapper */}
              </div>
            </div>
          </div>
        </>
        ) : (
          /* Visual de Sidebar recolhido conforme imagem anexa */
          <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            {/* Top section: button and indicator */}
            <div className="h-16 flex items-center justify-center border-b border-[#C9CACC] bg-slate-50 px-2 shrink-0">
              <div className="flex items-center justify-center gap-1.5 w-full">
                <span className="w-2.5 h-7 bg-[#FFF200] rounded-full shrink-0"></span>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="w-9 h-9 rounded-lg border border-[#C9CACC] bg-white flex items-center justify-center hover:bg-slate-100 transition text-slate-500 hover:text-slate-800 focus:outline-none"
                  title="Expandir painel"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>
            {/* Vertical rotated text */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#3F48CC]/70 font-sans -rotate-90 whitespace-nowrap select-none">
                PREENCHIMENTOS PRELIMINARES
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* PAINEL DE CONTEÚDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] overflow-y-auto">
        
        {/* HEADER - DESIGN SÓBRIO COM IDENTIFICAÇÃO DO PROJETO */}
        <header className="bg-white border-t-4 border-[#FFF200] border-b border-[#C9CACC] py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-light uppercase tracking-wide text-slate-950 font-sans">
                Planejamento e Protocolos <span className="font-semibold text-slate-700">| Programação de Cronograma</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1.5 max-w-2xl font-sans">
                Cálculos auxiliares na programação inicial de cronograma.
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                <div className="inline-flex items-center gap-2 border border-[#FFF200] px-2.5 py-0.5 text-[11px] font-black tracking-wider text-slate-950 rounded bg-[#FFF200] font-sans">
                  Fundação CAEd
                </div>
                <div className="inline-flex items-center gap-2 border border-[#13612A] px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white rounded bg-[#13612A] font-sans">
                  Última atualização: 10/08/2026
                </div>
              </div>
            </div>
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#3F48CC] hover:bg-[#3F48CC]/90 text-white rounded-lg text-xs font-bold transition shadow-md focus:outline-none shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                PARÂMETROS
              </button>
            )}
          </div>
        </header>

        {/* SISTEMA DE NAVEGAÇÃO ENTRE ABAS */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 border-b border-[#C9CACC] shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('programacao_inicial')}
                className={`py-4 px-6 text-xs sm:text-sm font-light tracking-wide uppercase border-b-4 transition-all focus:outline-none font-sans ${
                  activeTab === 'programacao_inicial'
                    ? 'border-[#FFF200] text-slate-950 bg-slate-50/50 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
                }`}
              >
                PROGRAMAÇÃO INICIAL
              </button>
              <button
                onClick={() => setActiveTab('feriados_recessos')}
                className={`py-4 px-6 text-xs sm:text-sm font-light tracking-wide uppercase border-b-4 transition-all focus:outline-none font-sans ${
                  activeTab === 'feriados_recessos'
                    ? 'border-[#FFF200] text-slate-950 bg-slate-50/50 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/30'
                }`}
              >
                FERIADOS E RECESSOS
              </button>
            </div>
          </div>
        </div>

        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-16">
          
          {/* ABA 1: PROGRAMAÇÃO INICIAL */}
          {activeTab === 'programacao_inicial' && (
            <div className="space-y-8">

            {(evaluationType === 'somativa' || evaluationType === 'formativa') && (
              <section className="space-y-6">
                
                <div className="space-y-4">
                  <h2 className="text-xl font-light uppercase tracking-wide text-slate-500 flex items-center font-sans">
                    <span className="inline-block w-1.5 h-6 bg-[#FFF200] mr-2 rounded-full font-sans"></span>
                    {activeScenario === 'caed' ? 'FLUXO PRINCIPAL DE PRAZOS CAEd' : 'FLUXO PRINCIPAL DE PRAZOS GRÁFICOS'}
                  </h2>

                  {!possuiParametrosPreenchidos() ? (
                    <div className="border border-[#C9CACC] p-6 text-center text-slate-400 italic text-xs rounded-lg bg-slate-50 font-sans">
                      Insira a "Entrega nos Polos" e "Prazo Contratual" no painel lateral de configurações para calcular e exibir o fluxo principal de prazos operacionais.
                    </div>
                  ) : (
                    <>
                      {activeScenario === 'caed' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="border border-[#C9CACC] border-l-[5px] border-l-[#FFF200] p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col h-full min-h-[112px]">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans leading-tight">
                                Recebimento de base com gordura
                              </div>
                              <div className="flex-1 flex items-center text-left">
                                <div className="text-2xl font-bold text-[#3F48CC] font-sans">{formatarDataBR(calculosCaed.c1_limiteBaseDestaque)}</div>
                              </div>
                            </div>
                            <div className={`border border-[#C9CACC] border-l-[5px] border-l-[#FFF200] p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col h-full min-h-[112px] transition-opacity duration-200 ${!possuiEscrita ? 'opacity-40 bg-slate-50 border-slate-200 select-none' : ''}`}>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans leading-tight">
                                Disponibilização dos itens de escrita antecipados
                              </div>
                              <div className="flex-1 flex items-center text-left">
                                <div className={`text-2xl font-bold font-sans ${!possuiEscrita ? 'text-slate-400' : 'text-[#3F48CC]'}`}>{formatarDataBR(calculosCaed.c2_dispEscritaDestaque)}</div>
                              </div>
                            </div>
                            <div className="border border-[#C9CACC] border-l-[5px] border-l-[#3F48CC] p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-start h-full min-h-[112px]">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1.5 leading-tight">
                                Observação
                              </div>
                              <div className="text-xs text-slate-700 font-sans space-y-1 leading-snug">
                                <p><span className="font-bold text-slate-800">Disponibilização:</span> <span className="font-normal text-slate-600">Interno.</span></p>
                                <p><span className="font-bold text-slate-800">Publicação:</span> <span className="font-normal text-slate-600">Plataforma.</span></p>
                                <p><span className="font-bold text-slate-800">Envio:</span> <span className="font-normal text-slate-600">E-mail, FTP ou outros meios.</span></p>
                              </div>
                            </div>
                          </div>

                          <div className="border border-[#C9CACC] rounded-lg bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                            <div className="bg-slate-50 border-b border-[#C9CACC] px-5 py-3 flex justify-between items-center font-semibold text-xs text-slate-700 uppercase tracking-wider font-sans">
                              <div 
                                className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity" 
                                onClick={() => setTabelaCaedOpen(!tabelaCaedOpen)}
                              >
                                {tabelaCaedOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-[#3F48CC]" />}
                                <span>Tabela CAEd e Datas Extras</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {tabelaCaedOpen && (
                                  <>
                                    <button
                                      onClick={() => setOcultarFormulas(!ocultarFormulas)}
                                      className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded transition shrink-0 focus:outline-none font-sans ${
                                        ocultarFormulas
                                          ? 'bg-[#3F48CC]/10 text-[#3F48CC] border-[#3F48CC]'
                                          : 'bg-white text-slate-600 border-[#C9CACC] hover:bg-slate-50'
                                      }`}
                                    >
                                      {ocultarFormulas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      Fórmulas
                                    </button>
                                    <button
                                      onClick={limparPreenchimentosManuaisTabela}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-[#C9CACC] px-3 py-1.5 rounded transition shrink-0 focus:outline-none font-sans bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                      title="Limpar preenchimentos manuais das tabelas"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                                      Limpar
                                    </button>
                                    <button
                                      onClick={() => setModoEdicaoPrincipal(!modoEdicaoPrincipal)}
                                      className={`inline-flex items-center justify-center border p-1.5 rounded transition shrink-0 focus:outline-none ${
                                        modoEdicaoPrincipal
                                          ? 'bg-[#3F48CC]/10 text-[#3F48CC] border-[#3F48CC]'
                                          : 'bg-white text-slate-600 border-[#C9CACC] hover:bg-slate-50'
                                      }`}
                                      title="Modo de Edição Manual"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {modoEdicaoPrincipal && (
                                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold select-none cursor-pointer border border-[#C9CACC] px-3 py-1.5 rounded bg-white hover:bg-slate-50 transition font-sans">
                                        <input
                                          type="checkbox"
                                          checked={ocultarCalculosPrincipal}
                                          onChange={(e) => setOcultarCalculosPrincipal(e.target.checked)}
                                          className="rounded border-[#C9CACC] text-[#3F48CC] focus:ring-[#3F48CC] h-3.5 w-3.5 cursor-pointer font-sans"
                                        />
                                        {ocultarCalculosPrincipal ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-[#3F48CC]" />}
                                        Cálculo por métricas
                                      </label>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {tabelaCaedOpen && (
                              <div className="p-4 overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[13px] sm:text-sm">
                                  <thead>
                                    <tr className="border-b border-[#C9CACC] font-semibold uppercase tracking-wider text-slate-400 text-xs">
                                      <th className="pb-2 w-9 text-center"></th>
                                      <th className="pb-2 w-12 text-center font-semibold text-slate-400 text-xs">CÓD.</th>
                                      <th className="pb-2 text-left">ETAPA</th>
                                      {!ocultarCalculosPrincipal && (
                                        <>
                                          <th className="pb-2 text-right">DATA INÍCIO</th>
                                          <th className="pb-2 text-right">DATA FIM</th>
                                        </>
                                      )}
                                      {modoEdicaoPrincipal && (
                                        <>
                                          <th className="pb-2 text-right">DATA INÍCIO (MANUAL)</th>
                                          <th className="pb-2 text-right">DATA FIM (MANUAL)</th>
                                        </>
                                      )}
                                      {!ocultarFormulas && <th className="pb-2 text-right font-sans">FÓRMULA</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#C9CACC] text-slate-600 font-medium">
                                     {(() => {
                                       const mainCells = ["C4", "C5", "C6", "C7", "C8"];
                                       const extras = obterDatasExtrasCalculadas();
                                       const allCaedRows = [
                                         ...mainCells.map((cel) => ({ isMain: true as const, celula: cel, extraRow: null as any })),
                                         ...extras.map((row: any) => ({ isMain: false as const, celula: row.celula, extraRow: row }))
                                       ].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));

                                       return allCaedRows.map((item) => {
                                         if (item.isMain) {
                                           const cel = item.celula;
                                           const isRowDisabled = cel === "C5" && !possuiEscrita;
                                           const dataValFim = calculosCaed[cel.toLowerCase()];
                                           const dataValInicio = cel === "C8" ? (calculosCaed.c8_inicio || dataValFim) : dataValFim;
                                           return (
                                             <tr key={cel} className={`hover:bg-slate-50 transition-colors ${isRowDisabled ? 'opacity-40 bg-slate-50 select-none' : ''}`}>
                                               <td className="py-2 text-center text-[10px] font-bold text-[#2E6F40] font-sans w-9">{cel}</td>
                                               <td className={`py-2 text-center text-xs font-medium font-sans w-12 ${isRowDisabled ? 'text-slate-400' : 'text-[#2E6F40]'}`}>{COD_ORDEM_MAP[cel] || ""}</td>
                                               <td className={`py-1.5 font-sans font-medium ${isRowDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                                                 {cel === "C4" && "Recebimento de base institucional (inegociável, sem gordura)"}
                                                 {cel === "C5" && "Disponibilização dos itens de escrita antecipados"}
                                                 {cel === "C6" && "Geração e validação dos arquivos de dados variáveis (DVs)"}
                                                 {cel === "C7" && "Disponibilização dos cadernos de testes"}
                                                 {cel === "C8" && "Homologação dos arquivos de DVs"}
                                               </td>
                                               {!ocultarCalculosPrincipal && (
                                                 <>
                                                   <td className="py-1.5 text-right font-sans">
                                                     <span className={`block font-sans ${isRowDisabled ? 'text-slate-400 font-normal' : 'font-normal text-slate-900 text-xs sm:text-sm'}`}>
                                                       {isRowDisabled ? "-" : formatarDataBR(dataValInicio)}
                                                     </span>
                                                   </td>
                                                   <td className="py-1.5 text-right font-sans">
                                                     <span className={`block font-sans ${isRowDisabled ? 'text-slate-400 font-normal' : 'font-normal text-slate-900 text-xs sm:text-sm'}`}>
                                                       {isRowDisabled ? "-" : formatarDataBR(dataValFim)}
                                                     </span>
                                                   </td>
                                                 </>
                                               )}
                                               {modoEdicaoPrincipal && (
                                                 <>
                                                   <td className="py-1 text-right font-sans">
                                                     {isRowDisabled || cel !== "C8" ? (
                                                       <span className="text-slate-400 mr-8">-</span>
                                                     ) : (
                                                       <CampoData
                                                         value={datasManuaisPrincipal["C8_inicio"] || ""}
                                                         onChange={(val) => setDatasManuaisPrincipal({ ...datasManuaisPrincipal, "C8_inicio": val })}
                                                         className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto font-sans"
                                                       />
                                                     )}
                                                   </td>
                                                   <td className="py-1 text-right font-sans">
                                                     {isRowDisabled ? (
                                                       <span className="text-slate-400 mr-8">-</span>
                                                     ) : (
                                                       <CampoData
                                                         value={datasManuaisPrincipal[cel] || ""}
                                                         onChange={(val) => setDatasManuaisPrincipal({ ...datasManuaisPrincipal, [cel]: val })}
                                                         className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto font-sans"
                                                       />
                                                     )}
                                                   </td>
                                                 </>
                                               )}
                                               {!ocultarFormulas && (
                                                 <td className="py-1.5 font-mono text-xs text-slate-400 text-right">
                                                   {cel === "C4" && "DIATRABALHO(C6;-10;Feriados!$B:$B)"}
                                                   {cel === "C5" && "DIATRABALHO(C4;3;Feriados!$B:$B)"}
                                                   {cel === "C6" && "DIATRABALHO(C8;-2;Feriados!$B:$B)"}
                                                   {cel === "C7" && "DIATRABALHO(B15;-2;Feriados!$B:$B)"}
                                                   {cel === "C8" && "DIATRABALHO(B15;-1;Feriados!$B:$B)"}
                                                 </td>
                                               )}
                                             </tr>
                                           );
                                         } else {
                                           const row: any = item.extraRow;
                                           let isRowDisabled = false;
                                           if (evaluationType === 'somativa' || evaluationType === 'formativa') {
                                               if (row.isB5B9 && !constaCaedAplicacao) {
                                                 isRowDisabled = true;
                                               }
                                               if (row.isB8 && !possuiEscrita) {
                                                 isRowDisabled = true;
                                               }
                                               if (row.isMaterialImpresso && !possuiMaterialImpresso) {
                                                 isRowDisabled = true;
                                               }
                                           }

                                           const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
                                           const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
                                           const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;
                                           
                                           const applyBlueHighlight = row.isFromGrafica && !isRowDisabled;

                                           return (
                                             <tr 
                                               key={row.celula} 
                                               className={`transition hover:bg-slate-50 ${isRowDisabled || isFieldDeactivated ? 'opacity-40 bg-slate-50 select-none text-slate-400' : ''}`}
                                             >
                                               <td className={`py-1.5 text-center text-[10px] font-bold font-sans w-9 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-[#3F48CC]'}`}>
                                                 {row.celula}
                                               </td>
                                               <td className={`py-1.5 text-center text-xs font-medium font-sans w-12 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-[#3F48CC]'}`}>
                                                 {COD_ORDEM_MAP[row.celula] || ""}
                                               </td>
                                               
                                               <td className={`py-1.5 font-sans font-medium leading-relaxed pr-4 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-slate-500'}`}>
                                                 <div>{row.nome}</div>
                                                 {row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8) && (
                                                   <div className="text-red-500 text-[11px] font-semibold mt-1">
                                                     Data igual ou posterior ao envio de arquivos para impressão.
                                                   </div>
                                                 )}
                                               </td>

                                               {!ocultarCalculosPrincipal && (
                                                 <td className={`py-1.5 text-right w-36 min-w-[144px] max-w-[144px] ${modoEdicaoPrincipal ? 'font-normal text-sm text-slate-500' : 'font-bold'}`}>
                                                   {renderInicioCell(row, isRowDisabled, applyBlueHighlight)}
                                                 </td>
                                               )}

                                               {!ocultarCalculosPrincipal && (
                                                 <td className={`py-1.5 text-right w-36 min-w-[144px] max-w-[144px] ${modoEdicaoPrincipal ? 'font-normal text-sm text-slate-500' : 'font-bold'}`}>
                                                   {renderFimCell(row, isRowDisabled, applyBlueHighlight)}
                                                 </td>
                                               )}
                                               
                                               {modoEdicaoPrincipal && (
                                                 <td className="py-1 text-right font-sans w-36 min-w-[144px] max-w-[144px]">
                                                   <CampoData 
                                                     disabled={isRowDisabled || isFieldDeactivated} 
                                                     value={(row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8)) ? "" : (datasManuaisExtras[row.celula]?.inicio || "")} 
                                                     onChange={(val) => setDatasManuaisExtras({ ...datasManuaisExtras, [row.celula]: { ...datasManuaisExtras[row.celula], inicio: val } })} 
                                                     className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto disabled:opacity-50 font-sans" 
                                                   />
                                                 </td>
                                               )}
                                               
                                               {modoEdicaoPrincipal && (
                                                 <td className="py-1 text-right font-sans w-36 min-w-[144px] max-w-[144px]">
                                                   {row.formula_fim !== "-" ? (
                                                     <CampoData 
                                                       disabled={isRowDisabled || isFieldDeactivated} 
                                                       value={(row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8)) ? "" : (datasManuaisExtras[row.celula]?.fim || "")} 
                                                       onChange={(val) => setDatasManuaisExtras({ ...datasManuaisExtras, [row.celula]: { ...datasManuaisExtras[row.celula], fim: val } })} 
                                                       className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto disabled:opacity-50 font-sans" 
                                                     />
                                                   ) : (
                                                     <span className="text-slate-300">-</span>
                                                   )}
                                                 </td>
                                               )}

                                               {!ocultarFormulas && (
                                                 <td className={`py-1.5 font-mono text-xs max-w-xs break-words text-right ${isRowDisabled || isFieldDeactivated ? 'text-slate-300' : 'text-slate-400'}`}>
                                                   {row.formula_inicio}
                                                   {row.formula_fim !== "-" && row.formula_fim !== row.formula_inicio && (
                                                     <>
                                                       <br />
                                                       {row.formula_fim}
                                                     </>
                                                   )}
                                                 </td>
                                               )}
                                             </tr>
                                           );
                                         }
                                       });
                                     })()}
                                   </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeScenario === 'grafica' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                            <div className="border border-[#C9CACC] border-l-[5px] border-l-[#FFF200] p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col h-full min-h-[112px]">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans leading-tight">
                                Recebimento de base com gordura
                              </div>
                              <div className="flex-1 flex items-center text-left">
                                <div className="text-2xl font-bold text-[#3F48CC] font-sans">{formatarDataBR(calculosGrafica.e1_limiteBaseDestaque)}</div>
                              </div>
                            </div>
                            <div className={`border border-[#C9CACC] border-l-[5px] border-l-[#FFF200] p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col h-full min-h-[112px] transition-opacity duration-200 ${!possuiEscrita ? 'opacity-40 bg-slate-50 border-slate-200 select-none' : ''}`}>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans leading-tight">
                                Disponibilização dos itens de escrita antecipados
                              </div>
                              <div className="flex-1 flex items-center text-left">
                                <div className={`text-2xl font-bold font-sans ${!possuiEscrita ? 'text-slate-400' : 'text-[#3F48CC]'}`}>{formatarDataBR(calculosGrafica.e2_dispEscritaDestaque)}</div>
                              </div>
                            </div>
                            <div className="border border-[#C9CACC] border-l-[5px] border-l-[#3F48CC] p-4 bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-start h-full min-h-[112px]">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans mb-1.5 leading-tight">
                                Observação
                              </div>
                              <div className="text-xs text-slate-700 font-sans space-y-1 leading-snug">
                                <p><span className="font-bold text-slate-800">Disponibilização:</span> <span className="font-normal text-slate-600">Interno.</span></p>
                                <p><span className="font-bold text-slate-800">Publicação:</span> <span className="font-normal text-slate-600">Plataforma.</span></p>
                                <p><span className="font-bold text-slate-800">Envio:</span> <span className="font-normal text-slate-600">E-mail, FTP ou outros meios.</span></p>
                              </div>
                            </div>
                          </div>

                          <div className="border border-[#C9CACC] rounded-lg bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                            <div className="bg-slate-50 border-b border-[#C9CACC] px-4 py-3 font-semibold text-xs text-slate-700 uppercase tracking-wider flex justify-between items-center font-sans">
                              <div 
                                className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity" 
                                onClick={() => setTabelaGraficaOpen(!tabelaGraficaOpen)}
                              >
                                {tabelaGraficaOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-[#3F48CC]" />}
                                <span>Tabela Gráfica e Datas Extras</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {tabelaGraficaOpen && (
                                  <>
                                    <button
                                      onClick={() => setOcultarFormulas(!ocultarFormulas)}
                                      className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded transition shrink-0 focus:outline-none font-sans ${
                                        ocultarFormulas
                                          ? 'bg-[#3F48CC]/10 text-[#3F48CC] border-[#3F48CC]'
                                          : 'bg-white text-slate-600 border-[#C9CACC] hover:bg-slate-50'
                                      }`}
                                    >
                                      {ocultarFormulas ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      Fórmulas
                                    </button>
                                    <button
                                      onClick={limparPreenchimentosManuaisTabela}
                                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-[#C9CACC] px-3 py-1.5 rounded transition shrink-0 focus:outline-none font-sans bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                      title="Limpar preenchimentos manuais das tabelas"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                                      Limpar
                                    </button>
                                    <button
                                      onClick={() => setModoEdicaoPrincipal(!modoEdicaoPrincipal)}
                                      className={`inline-flex items-center justify-center border p-1.5 rounded transition shrink-0 focus:outline-none ${
                                        modoEdicaoPrincipal
                                          ? 'bg-[#3F48CC]/10 text-[#3F48CC] border-[#3F48CC]'
                                          : 'bg-white text-slate-600 border-[#C9CACC] hover:bg-slate-50'
                                      }`}
                                      title="Modo de Edição Manual"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    {modoEdicaoPrincipal && (
                                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold select-none cursor-pointer border border-[#C9CACC] px-3 py-1.5 rounded bg-white hover:bg-slate-50 transition font-sans">
                                        <input
                                          type="checkbox"
                                          checked={ocultarCalculosPrincipal}
                                          onChange={(e) => setOcultarCalculosPrincipal(e.target.checked)}
                                          className="rounded border-[#C9CACC] text-[#3F48CC] focus:ring-[#3F48CC] h-3.5 w-3.5 cursor-pointer font-sans"
                                        />
                                        {ocultarCalculosPrincipal ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-[#3F48CC]" />}
                                        Cálculo por métricas
                                      </label>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            {tabelaGraficaOpen && (
                              <div className="p-4 overflow-x-auto">
                                <table className="w-full text-left border-collapse text-[13px] sm:text-sm">
                                  <thead>
                                    <tr className="border-b border-[#C9CACC] font-semibold uppercase tracking-wider text-slate-400 text-xs">
                                      <th className="pb-2 w-9 text-center"></th>
                                      <th className="pb-2 w-12 text-center font-semibold text-slate-400 text-xs">CÓD.</th>
                                      <th className="pb-2 text-left">ETAPA</th>
                                      {!ocultarCalculosPrincipal && (
                                        <>
                                          <th className="pb-2 text-right">DATA INÍCIO</th>
                                          <th className="pb-2 text-right">DATA FIM</th>
                                        </>
                                      )}
                                      {modoEdicaoPrincipal && (
                                        <>
                                          <th className="pb-2 text-right">DATA INÍCIO (MANUAL)</th>
                                          <th className="pb-2 text-right">DATA FIM (MANUAL)</th>
                                        </>
                                      )}
                                      {!ocultarFormulas && <th className="pb-2 text-right font-sans">FÓRMULA</th>}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#C9CACC] text-slate-600 font-medium">
                                     {(() => {
                                       const mainCells = ["E4", "E5", "E6", "E7", "E9", "E10", "E11"];
                                       const extras = obterDatasExtrasCalculadas();
                                       const allGraficaRows = [
                                         ...mainCells.map((cel) => ({ isMain: true as const, celula: cel, extraRow: null as any })),
                                         ...extras.map((row: any) => ({ isMain: false as const, celula: row.celula, extraRow: row }))
                                       ].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula));

                                       return allGraficaRows.map((item) => {
                                         if (item.isMain) {
                                           const cel = item.celula;
                                           const isRowDisabled = cel === "E5" && !possuiEscrita;
                                           const isDifferent = cel === "E9" || cel === "E10" || cel === "E11";
                                           return (
                                             <tr key={cel} className={`hover:bg-slate-50 transition-colors ${isRowDisabled ? 'opacity-40 bg-slate-50 select-none' : ''}`}>
                                               <td className="py-2 text-center text-[10px] font-bold text-[#2E6F40] font-sans w-9">{cel}</td>
                                               <td className={`py-2 text-center text-xs font-medium font-sans w-12 ${isRowDisabled ? 'text-slate-400' : 'text-[#2E6F40]'}`}>{COD_ORDEM_MAP[cel] || ""}</td>
                                               <td className={`py-1.5 font-sans font-medium ${isRowDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                                                 {cel === "E4" && "Recebimento de base institucional (inegociável, sem gordura)"}
                                                 {cel === "E5" && "Disponibilização dos itens de escrita antecipados"}
                                                 {cel === "E6" && "Envio do arquivo de dados (.csv)"}
                                                 {cel === "E7" && "Disponibilização dos cadernos de testes"}
                                                 {cel === "E9" && "Envio dos arquivos de dados variáveis (DVs)"}
                                                 {cel === "E10" && "Validação dos arquivos de DVs"}
                                                 {cel === "E11" && "Homologação dos arquivos de DVs"}
                                               </td>
                                               {!ocultarCalculosPrincipal && (
                                                 <>
                                                   <td className="py-1.5 text-right font-sans">
                                                     <span className={`block font-sans ${isRowDisabled ? 'text-slate-400 font-normal' : 'font-normal text-slate-900 text-xs sm:text-sm'}`}>
                                                       {isRowDisabled ? "-" : formatarDataBR(calculosGrafica[`${cel.toLowerCase()}_inicio`])}
                                                     </span>
                                                   </td>
                                                   <td className="py-1.5 text-right font-sans">
                                                     <span className={`block font-sans ${isRowDisabled ? 'text-slate-400 font-normal' : 'font-normal text-slate-900 text-xs sm:text-sm'}`}>
                                                       {isRowDisabled ? "-" : formatarDataBR(calculosGrafica[cel.toLowerCase()])}
                                                     </span>
                                                   </td>
                                                 </>
                                               )}
                                               {modoEdicaoPrincipal && (
                                                 <>
                                                   <td className="py-1 text-right font-sans">
                                                     {isRowDisabled || !isDifferent ? (
                                                       <span className="text-slate-400 mr-8">-</span>
                                                     ) : (
                                                       <CampoData value={datasManuaisPrincipal[`${cel}_inicio`] || ""} onChange={(val) => setDatasManuaisPrincipal({ ...datasManuaisPrincipal, [`${cel}_inicio`]: val })} className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto font-sans" />
                                                     )}
                                                   </td>
                                                   <td className="py-1 text-right font-sans">
                                                     {isRowDisabled ? (
                                                       <span className="text-slate-400 mr-8">-</span>
                                                     ) : (
                                                       <CampoData value={datasManuaisPrincipal[cel] || ""} onChange={(val) => setDatasManuaisPrincipal({ ...datasManuaisPrincipal, [cel]: val })} className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto font-sans" />
                                                     )}
                                                   </td>
                                                 </>
                                               )}
                                               {!ocultarFormulas && (
                                                 <td className="py-1.5 font-mono text-xs text-slate-400 text-right">
                                                   <div className="text-[10px] text-slate-300 font-sans">
                                                     Início: {
                                                       cel === "E4" || cel === "E5" || cel === "E6" || cel === "E7" ? "=Fim" :
                                                       cel === "E9" ? "=E6+1" :
                                                       cel === "E10" ? "=E9+1" :
                                                       cel === "E11" ? "=E10+1" : ""
                                                     }
                                                   </div>
                                                   <div>
                                                     Fim: {
                                                       cel === "E4" && "DIATRABALHO(E6;-10;Feriados!$B:$B)"
                                                     }{
                                                       cel === "E5" && "DIATRABALHO(E4;3;Feriados!$B:$B)"
                                                     }{
                                                       cel === "E6" && "DIATRABALHO(E9;-4;Feriados!$B:$B)"
                                                     }{
                                                       cel === "E7" && "DIATRABALHO(E9;-2;Feriados!$B:$B)"
                                                     
                                                     }{
                                                       cel === "E9" && "DIATRABALHO(E10;-2;Feriados!$B:$B)"
                                                     }{
                                                       cel === "E10" && "DIATRABALHO(E11;-2;Feriados!$B:$B)"
                                                     }{
                                                       cel === "E11" && "DIATRABALHO(E12;-E14+4;Feriados!$B:$B)"
                                                     }
                                                   </div>
                                                 </td>
                                               )}
                                             </tr>
                                           );
                                         } else {
                                           const row: any = item.extraRow;
                                           let isRowDisabled = false;
                                           if (evaluationType === 'somativa' || evaluationType === 'formativa') {
                                               if (row.isB5B9 && !constaCaedAplicacao) {
                                                 isRowDisabled = true;
                                               }
                                               if (row.isB8 && !possuiEscrita) {
                                                 isRowDisabled = true;
                                               }
                                               if (row.isMaterialImpresso && !possuiMaterialImpresso) {
                                                 isRowDisabled = true;
                                               }
                                           }

                                           const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
                                           const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
                                           const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;
                                           
                                           const applyBlueHighlight = row.isFromGrafica && !isRowDisabled;

                                           return (
                                             <tr 
                                               key={row.celula} 
                                               className={`transition hover:bg-slate-50 ${isRowDisabled || isFieldDeactivated ? 'opacity-40 bg-slate-50 select-none text-slate-400' : ''}`}
                                             >
                                               <td className={`py-1.5 text-center text-[10px] font-bold font-sans w-9 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-[#3F48CC]'}`}>
                                                 {row.celula}
                                               </td>
                                               <td className={`py-1.5 text-center text-xs font-medium font-sans w-12 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-[#3F48CC]'}`}>
                                                 {COD_ORDEM_MAP[row.celula] || ""}
                                               </td>
                                               
                                               <td className={`py-1.5 font-sans font-medium leading-relaxed pr-4 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-slate-500'}`}>
                                                 <div>{row.nome}</div>
                                                 {row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8) && (
                                                   <div className="text-red-500 text-[11px] font-semibold mt-1">
                                                     Data igual ou posterior ao envio de arquivos para impressão.
                                                   </div>
                                                 )}
                                               </td>

                                               {!ocultarCalculosPrincipal && (
                                                 <td className={`py-1.5 text-right w-36 min-w-[144px] max-w-[144px] ${modoEdicaoPrincipal ? 'font-normal text-sm text-slate-500' : 'font-bold'}`}>
                                                   {renderInicioCell(row, isRowDisabled, applyBlueHighlight)}
                                                 </td>
                                               )}

                                               {!ocultarCalculosPrincipal && (
                                                 <td className={`py-1.5 text-right w-36 min-w-[144px] max-w-[144px] ${modoEdicaoPrincipal ? 'font-normal text-sm text-slate-500' : 'font-bold'}`}>
                                                   {renderFimCell(row, isRowDisabled, applyBlueHighlight)}
                                                 </td>
                                               )}
                                               
                                               {modoEdicaoPrincipal && (
                                                 <td className="py-1 text-right font-sans w-36 min-w-[144px] max-w-[144px]">
                                                   <CampoData 
                                                     disabled={isRowDisabled || isFieldDeactivated} 
                                                     value={(row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8)) ? "" : (datasManuaisExtras[row.celula]?.inicio || "")} 
                                                     onChange={(val) => setDatasManuaisExtras({ ...datasManuaisExtras, [row.celula]: { ...datasManuaisExtras[row.celula], inicio: val } })} 
                                                     className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto disabled:opacity-50 font-sans" 
                                                   />
                                                 </td>
                                               )}
                                               
                                               {modoEdicaoPrincipal && (
                                                 <td className="py-1 text-right font-sans w-36 min-w-[144px] max-w-[144px]">
                                                   {row.formula_fim !== "-" ? (
                                                     <CampoData 
                                                       disabled={isRowDisabled || isFieldDeactivated} 
                                                       value={(row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8)) ? "" : (datasManuaisExtras[row.celula]?.fim || "")} 
                                                       onChange={(val) => setDatasManuaisExtras({ ...datasManuaisExtras, [row.celula]: { ...datasManuaisExtras[row.celula], fim: val } })} 
                                                       className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto disabled:opacity-50 font-sans" 
                                                     />
                                                   ) : (
                                                     <span className="text-slate-300">-</span>
                                                   )}
                                                 </td>
                                               )}

                                               {!ocultarFormulas && (
                                                 <td className={`py-1.5 font-mono text-xs max-w-xs break-words text-right ${isRowDisabled || isFieldDeactivated ? 'text-slate-300' : 'text-slate-400'}`}>
                                                   {row.formula_inicio}
                                                   {row.formula_fim !== "-" && row.formula_fim !== row.formula_inicio && (
                                                     <>
                                                       <br />
                                                       {row.formula_fim}
                                                     </>
                                                   )}
                                                 </td>
                                               )}
                                             </tr>
                                           );
                                         }
                                       });
                                     })()}
                                   </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

              </section>
            )}

            <section className="space-y-6 pt-4 font-sans">
              
              {activeScenario !== "grafica" && activeScenario !== "caed" && (
                <div className="space-y-4">
                  <h2 className="text-xl font-light uppercase tracking-wide text-slate-500 flex items-center font-sans font-sans font-sans">
                    <span className="inline-block w-1.5 h-6 bg-[#FFF200] mr-2 rounded-full font-sans"></span>
                    DETALHAMENTO DE DATAS EXTRAS
                  </h2>

                {!possuiParametrosPreenchidos() ? (
                  <div className="border border-[#C9CACC] p-6 text-center text-slate-400 italic text-xs rounded-lg bg-slate-50 font-sans font-sans">
                    Insira os parâmetros iniciais no painel lateral de configurações para gerar as datas extras e marcos críticos detalhados do subprograma.
                  </div>
                ) : (
                  <div className="border border-[#C9CACC] rounded-lg bg-white overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                    <div className="bg-slate-50 border-b border-[#C9CACC] px-5 py-3 flex justify-between items-center font-sans font-sans">
                      <div 
                        className="flex items-center gap-2 cursor-pointer select-none hover:opacity-80 transition-opacity"
                        onClick={() => setDetalhamentoEtapasOpen(!detalhamentoEtapasOpen)}
                      >
                        {detalhamentoEtapasOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-[#3F48CC]" />}
                        <span className="font-semibold text-xs text-slate-700 uppercase tracking-wider font-sans">
                          Detalhamento Adicional de Etapas
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {detalhamentoEtapasOpen && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setOcultarFormulasExtras(!ocultarFormulasExtras)}
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded transition shrink-0 focus:outline-none font-sans ${
                                ocultarFormulasExtras
                                  ? 'bg-[#3F48CC]/10 text-[#3F48CC] border-[#3F48CC]'
                                  : 'bg-white text-slate-600 border-[#C9CACC] hover:bg-slate-50'
                              }`}
                            >
                              {ocultarFormulasExtras ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              Fórmulas
                            </button>
                            <button
                              onClick={() => setModoEdicaoExtras(!modoEdicaoExtras)}
                              className={`inline-flex items-center justify-center border p-1.5 rounded transition shrink-0 focus:outline-none ${
                                modoEdicaoExtras
                                  ? 'bg-[#3F48CC]/10 text-[#3F48CC] border-[#3F48CC]'
                                  : 'bg-white text-slate-600 border-[#C9CACC] hover:bg-slate-50'
                              }`}
                              title="Modo de Edição Manual"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {modoEdicaoExtras && (
                              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold select-none cursor-pointer border border-[#C9CACC] px-3 py-1.5 rounded bg-white hover:bg-slate-50 transition font-sans">
                                <input
                                  type="checkbox"
                                  checked={ocultarCalculosExtras}
                                  onChange={(e) => setOcultarCalculosExtras(e.target.checked)}
                                  className="rounded border-[#C9CACC] text-[#3F48CC] focus:ring-[#3F48CC] h-3.5 w-3.5 cursor-pointer font-sans"
                                />
                                {ocultarCalculosExtras ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-[#3F48CC]" />}
                                Cálculo por métricas
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {detalhamentoEtapasOpen && (
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[13px] sm:text-sm">
                          <thead>
                            <tr className="border-b border-[#C9CACC] font-semibold uppercase tracking-wider text-slate-400 text-xs">
                              <th className="pb-2 w-12 text-center"></th>
                              <th className="pb-2 text-left">ETAPA</th>
                              {!ocultarCalculosExtras && <th className="pb-2 text-right w-36 min-w-[144px] max-w-[144px]">DATA INÍCIO</th>}
                              {!ocultarCalculosExtras && <th className="pb-2 text-right w-36 min-w-[144px] max-w-[144px]">DATA FIM</th>}
                              {modoEdicaoExtras && <th className="pb-2 text-right w-36 min-w-[144px] max-w-[144px]">DATA INÍCIO (MANUAL)</th>}
                              {modoEdicaoExtras && <th className="pb-2 text-right w-36 min-w-[144px] max-w-[144px]">DATA FIM (MANUAL)</th>}
                              {!ocultarFormulasExtras && <th className="pb-2 text-right w-64">FÓRMULA</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#C9CACC] text-slate-600 font-medium">
                            {[...obterDatasExtrasCalculadas()].sort((a, b) => getCodOrdemNumeric(a.celula) - getCodOrdemNumeric(b.celula)).map((row: any) => {
                              let isRowDisabled = false;
                              if (evaluationType === 'somativa' || evaluationType === 'formativa') {
                                  if (row.isB5B9 && !constaCaedAplicacao) {
                                    isRowDisabled = true;
                                  }
                                  if (row.isB8 && !possuiEscrita) {
                                    isRowDisabled = true;
                                  }
                                  if (row.isMaterialImpresso && !possuiMaterialImpresso) {
                                    isRowDisabled = true;
                                  }
                              }

                              // Propagação lógica: se o B26 estiver inativado na tabela, inativa b25, b27 e b8 automaticamente. E se B20 estiver inativado na tabela, inativa B14 automaticamente.
                              const dependenteInativoB26 = row.dependenteB26 && desativadosOpcionais.B26;
                              const dependenteInativoB20 = row.celula === "B14" && (!possuiMaterialImpresso || desativadosOpcionais.B20);
                              const isFieldDeactivated = (row.celula !== 'B21' && desativadosOpcionais[row.celula]) || dependenteInativoB26 || dependenteInativoB20;
                              
                              const applyBlueHighlight = row.isFromGrafica && !isRowDisabled;

                              return (
                                <tr 
                                  key={row.celula} 
                                  className={`transition hover:bg-slate-50 ${isRowDisabled || isFieldDeactivated ? 'opacity-40 bg-slate-50 select-none text-slate-400' : ''}`}
                                >
                                  <td className={`py-1.5 text-center text-[10px] font-bold font-sans w-12 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-[#3F48CC]'}`}>
                                    {row.celula}
                                  </td>
                                  
                                  <td className={`py-1.5 font-sans font-medium leading-relaxed pr-4 ${isRowDisabled || isFieldDeactivated ? 'text-slate-400' : 'text-slate-500'}`}>
                                    <div>{row.nome}</div>
                                    {row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8) && (
                                      <div className="text-red-500 text-[11px] font-semibold mt-1">
                                        Data igual ou posterior ao envio de arquivos para impressão.
                                      </div>
                                    )}
                                  </td>

                                  {!ocultarCalculosExtras && (
                                    <td className={`py-1.5 text-right w-36 min-w-[144px] max-w-[144px] ${modoEdicaoExtras ? 'font-normal text-sm text-slate-500' : 'font-bold'}`}>
                                      {renderInicioCell(row, isRowDisabled, applyBlueHighlight)}
                                    </td>
                                  )}

                                  {!ocultarCalculosExtras && (
                                    <td className={`py-1.5 text-right w-36 min-w-[144px] max-w-[144px] ${modoEdicaoExtras ? 'font-normal text-sm text-slate-500' : 'font-bold'}`}>
                                      {renderFimCell(row, isRowDisabled, applyBlueHighlight)}
                                    </td>
                                  )}
                                  
                                  {modoEdicaoExtras && (
                                    <td className="py-1 text-right font-sans w-36 min-w-[144px] max-w-[144px]">
                                      <CampoData 
                                        disabled={isRowDisabled || isFieldDeactivated} 
                                        value={(row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8)) ? "" : (row.celula === "B26" ? (b26ManualInicio || datasManuaisExtras["B26"]?.inicio || "") : (datasManuaisExtras[row.celula]?.inicio || (row.celula === "B21" ? b21ManualInicio : "")))} 
                                        onChange={(val) => {
                                          setDatasManuaisExtras({ ...datasManuaisExtras, [row.celula]: { ...datasManuaisExtras[row.celula], inicio: val } });
                                          if (row.celula === "B21") setB21ManualInicio(val); if (row.celula === "B26") setB26ManualInicio(val);
                                        }} 
                                        className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto disabled:opacity-50 font-sans" 
                                      />
                                    </td>
                                  )}
                                  
                                  {modoEdicaoExtras && (
                                    <td className="py-1 text-right font-sans w-36 min-w-[144px] max-w-[144px]">
                                      {(row.formula_fim !== "-" || row.celula === "B21" || row.celula === "B26") ? (
                                        <CampoData 
                                          disabled={isRowDisabled || isFieldDeactivated} 
                                          value={(row.celula === "B14" && (row.excedeuE8 || obterDatasManuaisExtras().B14.excedeuE8)) ? "" : (row.celula === "B26" ? (b26ManualFim || datasManuaisExtras["B26"]?.fim || "") : (datasManuaisExtras[row.celula]?.fim || ""))} 
                                          onChange={(val) => {
                                            setDatasManuaisExtras({ ...datasManuaisExtras, [row.celula]: { ...datasManuaisExtras[row.celula], fim: val } });
                                            if (row.celula === "B26") setB26ManualFim(val);
                                          }} 
                                          className="border border-[#C9CACC] rounded px-1.5 py-0.5 text-xs w-[120px] h-7 text-slate-700 ml-auto disabled:opacity-50 font-sans" 
                                        />
                                      ) : (
                                        <span className="text-slate-300">-</span>
                                      )}
                                    </td>
                                  )}

                                  {!ocultarFormulasExtras && (
                                    <td className={`py-1.5 font-mono text-xs max-w-xs break-words text-right ${isRowDisabled || isFieldDeactivated ? 'text-slate-300' : 'text-slate-400'}`}>
                                      {row.formula_inicio}
                                      {row.formula_fim !== "-" && row.formula_fim !== row.formula_inicio && (
                                        <>
                                          <br />
                                          {row.formula_fim}
                                        </>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* Campo de Texto de Anotações com Barra de Edição (abaixo de todas as tabelas e acima dos botões de exportação) */}
              <div className={`space-y-2 pt-6 pb-2 border-t border-slate-200 transition-all duration-200 ${!(isSidebarEnabled && possuiParametrosPreenchidos()) ? 'opacity-35 pointer-events-none select-none' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-[#3F48CC] rounded-full inline-block"></span>
                    Anotações Complementares
                  </label>
                </div>
                <RichTextEditor
                  value={observacoes}
                  onChange={(val) => setObservacoes(val)}
                  disabled={!(isSidebarEnabled && possuiParametrosPreenchidos())}
                />
              </div>

              {/* Botões de Exportação (.xlsb e .pdf) */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!isSidebarEnabled) return;
                    exportToXlsb({
                      codSubprograma,
                      nomeSubprograma,
                      evaluationType,
                      activeScenario,
                      dataEntrega,
                      prazoContratual: prazoContratualOriginal !== '' ? prazoContratualOriginal : prazoContratual,
                      prazoComFator: prazoComFatorOriginal !== '' ? prazoComFatorOriginal : prazoComFator,
                      prazoContratualEditado,
                      prazoComFatorEditado,
                      constaCaedAplicacao,
                      possuiEscrita,
                      possuiMaterialImpresso,
                      b23ManualInicio,
                      b23ManualFim,
                      b26ManualInicio,
                      b26ManualFim,
                      b5ManualInicio,
                      desativadosOpcionais,
                      calculosGrafica,
                      calculosCaed,
                      datasExtras: obterDatasExtrasCalculadas(),
                      datasManuaisPrincipal,
                      datasManuaisExtras,
                      modoEdicaoPrincipal,
                      modoEdicaoExtras,
                      ocultarCalculosPrincipal,
                      ocultarCalculosExtras,
                      observacoes
                    });
                  }}
                  disabled={!isSidebarEnabled}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg focus:outline-none font-sans uppercase tracking-wider ${
                    isSidebarEnabled 
                      ? 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  title={isSidebarEnabled ? "Exportar dados e lógicas para planilha Excel (.xlsb)" : "Preencha o Cód. Subprograma de 4 dígitos para exportar"}
                >
                  <Download className="w-4 h-4" />
                  Exportar .xlsb
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isSidebarEnabled) return;
                    exportToPdf({
                      codSubprograma,
                      nomeSubprograma,
                      evaluationType,
                      activeScenario,
                      dataEntrega,
                      prazoContratual: prazoContratualOriginal !== '' ? prazoContratualOriginal : prazoContratual,
                      prazoComFator: prazoComFatorOriginal !== '' ? prazoComFatorOriginal : prazoComFator,
                      prazoContratualEditado,
                      prazoComFatorEditado,
                      constaCaedAplicacao,
                      possuiEscrita,
                      possuiMaterialImpresso,
                      b23ManualInicio,
                      b23ManualFim,
                      b26ManualInicio,
                      b26ManualFim,
                      b5ManualInicio,
                      desativadosOpcionais,
                      calculosGrafica,
                      calculosCaed,
                      datasExtras: obterDatasExtrasCalculadas(),
                      datasManuaisPrincipal,
                      datasManuaisExtras,
                      modoEdicaoPrincipal,
                      modoEdicaoExtras,
                      ocultarCalculosPrincipal,
                      ocultarCalculosExtras,
                      observacoes
                    });
                  }}
                  disabled={!isSidebarEnabled}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg focus:outline-none font-sans uppercase tracking-wider ${
                    isSidebarEnabled 
                      ? 'bg-red-800 hover:bg-red-900 text-white cursor-pointer' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                  title={isSidebarEnabled ? "Exportar cronograma para formato PDF (.pdf)" : "Preencha o Cód. Subprograma de 4 dígitos para exportar"}
                >
                  <Download className="w-4 h-4" />
                  EXPORTAR .PDF
                </button>
              </div>



            </section>

          </div>
        )}

        {/* ABA 3: FERIADOS E RECESSOS */}
        {activeTab === 'feriados_recessos' && (
          <div className="space-y-8 bg-white">
            
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-light uppercase tracking-wide text-slate-500 flex items-center font-sans">
                  <span className="inline-block w-1.5 h-6 bg-[#FFF200] mr-2 rounded-full font-sans"></span>
                  CONFIGURAÇÃO DE FERIADOS E RECESSOS
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl font-sans">
                Gerencie os dias que serão desconsiderados na contagem de dias úteis para todas as fórmulas de prazos automáticos da planilha.
              </p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Painel de Inclusão */}
              <div className="lg:col-span-1 border border-[#C9CACC] rounded-lg p-5 bg-white space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] h-fit font-sans">
                <div className="flex justify-between items-center border-b border-[#C9CACC] pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-sans">Incluir Novo Evento</h4>
                </div>
                
                <form onSubmit={adicionarFeriado} className="space-y-4 font-sans">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase text-slate-600 font-sans">Data do Evento <span className="text-red-500 font-bold">*</span>:</label>
                    <CampoData
                      required
                      value={novoFeriadoData}
                      onChange={(val) => setNovoFeriadoData(val)}
                      className="w-full border border-[#C9CACC] rounded p-2 text-xs font-medium bg-white focus:outline-none focus:border-[#3F48CC] transition font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase text-slate-600 font-sans">Descrição <span className="text-red-500 font-bold">*</span>:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Recesso Municipal ou Feriado Local"
                      value={novoFeriadoNome}
                      onChange={(e) => setNovoFeriadoNome(e.target.value)}
                      className="w-full border border-[#C9CACC] rounded p-2 text-xs font-medium bg-white focus:outline-none focus:border-[#3F48CC] transition font-sans"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full border border-[#3F48CC] text-[#3F48CC] hover:bg-[#3F48CC] hover:text-white transition-all rounded p-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 focus:outline-none font-sans"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Evento
                  </button>
                </form>
              </div>

              {/* Lista Principal de Feriados */}
              <div className="lg:col-span-2 border border-[#C9CACC] rounded-lg p-5 bg-white space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] font-sans">
                <div className="flex justify-between items-center border-b border-[#C9CACC] pb-3">
                  <div className="flex items-center gap-2 font-sans">
                    <Calendar className="w-4 h-4 text-[#3F48CC]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Eventos Cadastrados ({feriados.filter(f => f.ativo).length} ativos)
                    </h4>
                  </div>
                  <button
                    onClick={restaurarFeriadosPadrao}
                    className="text-[10px] font-bold text-[#3F48CC] border border-[#C9CACC]/20 px-2.5 py-1.5 rounded bg-white hover:bg-[#3F48CC]/5 transition flex items-center gap-1 focus:outline-none font-sans"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Restaurar Padrão CAEd
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                  {feriados.map((feriado, idx) => {
                    const dataFormatada = formatarDataBR(feriado.date);
                    const ano = feriado.date.split('-')[0];

                    return (
                      <div 
                        key={idx} 
                        className={`border rounded-lg p-3 flex items-center justify-between transition ${
                          feriado.ativo ? 'border-[#C9CACC] bg-white hover:bg-slate-50/50' : 'border-[#C9CACC] bg-slate-50/50'
                        }`}
                      >
                        <div className="min-w-0 pr-3 flex items-start gap-2.5">
                          <input 
                            type="checkbox"
                            checked={feriado.ativo}
                            onChange={() => alternarFeriadoAtivo(feriado.date)}
                            className="mt-0.5 rounded text-[#3F48CC] focus:ring-[#3F48CC] h-4.5 w-4.5 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                               <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 border border-[#C9CACC] px-1.5 py-0.5 rounded">
                                 {dataFormatada ? dataFormatada.substring(0, 5) : "--/--"}
                               </span>
                              <span className="text-xs font-bold truncate block text-slate-900">
                                {feriado.label}
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wide block mt-1 font-sans">
                              {obterDiaSemana(feriado.date)} • {ano}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removerFeriado(feriado.date)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-[#C9CACC] hover:border-red-200 transition shrink-0 focus:outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
      </div>
    </div>
    </FeriadosContext.Provider>
  );
}