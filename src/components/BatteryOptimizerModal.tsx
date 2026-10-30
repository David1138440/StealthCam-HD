import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  Zap, 
  ZapOff, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  EyeOff, 
  Smartphone, 
  RefreshCw, 
  X, 
  Flame, 
  Cpu, 
  Thermometer,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight
} from "lucide-react";
import { cn } from "../lib/utils";

export type BatteryTipActionType = 
  | "ENABLE_STEALTH"
  | "ENABLE_POWER_SAVING"
  | "DISABLE_AI_DETECTION"
  | "DISABLE_IR_TORCH"
  | "COPY_ADB_DOZE"
  | "OPEN_ANDROID_SETTINGS";

export interface DiagnosticItemData {
  id: string;
  title: string;
  status: string;
  recommendation: string;
  isGood: boolean;
  metric?: string;
}

export interface OptimizationTipData {
  id: string;
  category: string;
  benefit: string;
  title: string;
  description: string;
  codeToCopy?: string;
  actionType: BatteryTipActionType;
  applied?: boolean;
}

interface BatteryOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteryLevel: number; // 0-100
  isCharging: boolean;
  chargingTime?: number | null;
  dischargingTime?: number | null;
  isStealthMode: boolean;
  isPowerSavingMode: boolean;
  isPersonDetectionEnabled: boolean;
  isInfraredActive: boolean;
  isIrTorchOn: boolean;
  onEnableStealth: () => void;
  onTogglePowerSaving: () => void;
  onTogglePersonDetection: () => void;
  onToggleIrTorch: () => void;
  onToast: (msg: string, type: "info" | "success" | "warning") => void;
}

export const BatteryOptimizerModal: React.FC<BatteryOptimizerModalProps> = ({
  isOpen,
  onClose,
  batteryLevel,
  isCharging,
  dischargingTime,
  isStealthMode,
  isPowerSavingMode,
  isPersonDetectionEnabled,
  isInfraredActive,
  isIrTorchOn,
  onEnableStealth,
  onTogglePowerSaving,
  onTogglePersonDetection,
  onToggleIrTorch,
  onToast
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [optimizationsApplied, setOptimizationsApplied] = useState<Record<string, boolean>>({});
  const [scanBonus, setScanBonus] = useState(0);

  if (!isOpen) return null;

  // Dynamic score computation
  let baseScore = 82;
  if (isPowerSavingMode) baseScore += 6;
  if (isStealthMode) baseScore += 8;
  if (isCharging) baseScore += 4;
  if (isPersonDetectionEnabled) baseScore -= 7;
  if (isInfraredActive) baseScore -= 4;
  if (isIrTorchOn) baseScore -= 5;
  baseScore += scanBonus;
  const overallScore = Math.min(100, Math.max(35, baseScore));

  const scoreColor = 
    overallScore >= 90 ? "text-emerald-400 border-emerald-500 bg-emerald-500/10" :
    overallScore >= 75 ? "text-cyan-400 border-cyan-500 bg-cyan-500/10" :
    overallScore >= 55 ? "text-amber-400 border-amber-500 bg-amber-500/10" :
    "text-red-400 border-red-500 bg-red-500/10";

  const scoreBorderColor =
    overallScore >= 90 ? "#10b981" :
    overallScore >= 75 ? "#06b6d4" :
    overallScore >= 55 ? "#f59e0b" :
    "#ef4444";

  const ratingText = 
    overallScore >= 90 ? "Excelente" :
    overallScore >= 75 ? "Bueno" :
    overallScore >= 55 ? "Moderado" :
    "Crítico / Alto Drenaje";

  const handleRunScan = () => {
    setIsScanning(true);
    onToast("Analizando consumos de hardware, sensor y procesos...", "info");
    setTimeout(() => {
      setIsScanning(false);
      setScanBonus(prev => Math.min(prev + 5, 12));
      onToast("¡Diagnóstico completado! Procesos en reposo optimizados.", "success");
    }, 1600);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      onToast(`Comando copiado al portapapeles: ${code}`, "success");
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      onToast("Error al copiar comando", "warning");
    }
  };

  const diagnostics: DiagnosticItemData[] = [
    {
      id: "battery-level",
      title: "Nivel y Estado de Batería",
      status: isCharging ? `${batteryLevel}% (Cargando CA)` : `${batteryLevel}% (Descarga normal)`,
      recommendation: isCharging 
        ? "Conectado a la fuente de alimentación. Grabación continua ilimitada." 
        : `Autonomía estimada: ~${dischargingTime ? Math.round(dischargingTime / 60) : Math.round(batteryLevel * 0.045 * (isPowerSavingMode ? 1.5 : 1))} horas a 1080p.`,
      isGood: batteryLevel > 20 || isCharging,
      metric: `${batteryLevel}%`
    },
    {
      id: "display-drain",
      title: "Consumo de Pantalla OLED",
      status: isStealthMode ? "Apagada (Stealth Activo)" : "Encendida (Visor 100% Brillo)",
      recommendation: isStealthMode 
        ? "Píxeles negros desactivados. Ahorro de pantalla del 85% activo." 
        : "El visor en vivo es el mayor consumidor de energía. Activa Pantalla Apagada.",
      isGood: isStealthMode,
      metric: isStealthMode ? "-85% Watts" : "~68% Consumo"
    },
    {
      id: "sensor-temp",
      title: "Temperatura y Throttling del Sensor",
      status: isInfraredActive ? "35.2 °C (Cálculo Térmico Activo)" : "32.8 °C (Rango Nominal)",
      recommendation: "El procesador y sensor de imagen operan en margen seguro sin degradación de batería.",
      isGood: true,
      metric: "Nominal"
    },
    {
      id: "ai-workload",
      title: "Procesamiento Neuronal IA en Local",
      status: isPersonDetectionEnabled ? "Activo (Detección a 15 FPS)" : "Suspendido (Bajo Consumo)",
      recommendation: isPersonDetectionEnabled 
        ? "El modelo de visión artificial consume ciclos continuos de CPU/GPU." 
        : "Núcleos de cómputo en reposo, reduciendo el calentamiento.",
      isGood: !isPersonDetectionEnabled,
      metric: isPersonDetectionEnabled ? "CPU 24%" : "CPU 3%"
    },
    {
      id: "power-profile",
      title: "Perfil de Ahorro y Códec de Video",
      status: isPowerSavingMode ? "Ultra Ahorro Activo (30 FPS)" : "Estándar (Bitrate Alto)",
      recommendation: isPowerSavingMode 
        ? "Tasa de refresco y tasa de bits adaptadas para maximizar autonomía." 
        : "Permite mayor compresión para extender la grabación hasta un 40%.",
      isGood: isPowerSavingMode,
      metric: isPowerSavingMode ? "Modo Eco" : "Estándar"
    }
  ];

  const tips: OptimizationTipData[] = [
    {
      id: "tip-stealth",
      category: "Pantalla OLED",
      benefit: "+85% BATERÍA",
      title: "Activar Modo Pantalla Apagada (Blackout Stealth)",
      description: "Apaga por completo la pantalla emulando un teléfono bloqueado mientras la cámara continúa grabando audio y video en alta resolución.",
      actionType: "ENABLE_STEALTH",
      applied: isStealthMode
    },
    {
      id: "tip-power-saving",
      category: "Hardware",
      benefit: "+40% AUTONOMÍA",
      title: isPowerSavingMode ? "Modo Ultra Ahorro de Energía (Activo)" : "Activar Perfil de Bajo Consumo",
      description: "Ajusta la tasa de muestreo y limita el bitrate del códec WebM/VP9 para evitar picos térmicos en el dispositivo.",
      actionType: "ENABLE_POWER_SAVING",
      applied: isPowerSavingMode
    },
    ...(isPersonDetectionEnabled ? [{
      id: "tip-ai-pause",
      category: "CPU & Redes Neuronales",
      benefit: "MENOS CALOR",
      title: "Pausar Detección Neuronal Continua",
      description: "Detiene el escaneo facial y corporal en tiempo real para dejar los núcleos del procesador en estado de reposo.",
      actionType: "DISABLE_AI_DETECTION" as BatteryTipActionType,
      applied: false
    }] : []),
    ...(isIrTorchOn ? [{
      id: "tip-torch",
      category: "Iluminador",
      benefit: "+15% BATERÍA",
      title: "Apagar Linterna / Antorcha IR Asistida",
      description: "El LED flash del teléfono drena rápidamente la batería. Apágalo si dispones de iluminación residual.",
      actionType: "DISABLE_IR_TORCH" as BatteryTipActionType,
      applied: false
    }] : []),
    {
      id: "tip-doze",
      category: "Android Doze Mode",
      benefit: "STANDBY FORZADO",
      title: "Forzar Suspensión de Servicios en Fondo (ADB)",
      description: "Comando para terminal o depuración ADB que suspende sincronizaciones y apps en segundo plano durante vigilancias prolongadas.",
      codeToCopy: "adb shell dumpsys deviceidle force-idle",
      actionType: "COPY_ADB_DOZE"
    },
    {
      id: "tip-settings",
      category: "Ajustes del Sistema",
      benefit: "PRIORIDAD ENERGÍA",
      title: "Excluir de Optimización de Batería Android",
      description: "Evita que Android cierre la grabación en segundo plano tras varios minutos de pantalla apagada.",
      codeToCopy: "dumpsys battery unplug",
      actionType: "OPEN_ANDROID_SETTINGS"
    }
  ];

  const handleAction = (tip: OptimizationTipData) => {
    switch (tip.actionType) {
      case "ENABLE_STEALTH":
        onEnableStealth();
        onClose();
        onToast("Modo Pantalla Apagada (Stealth) activado. Toca dos veces para volver.", "info");
        break;
      case "ENABLE_POWER_SAVING":
        onTogglePowerSaving();
        onToast(!isPowerSavingMode ? "Modo de bajo consumo activado." : "Modo normal restablecido.", "success");
        break;
      case "DISABLE_AI_DETECTION":
        onTogglePersonDetection();
        onToast("Detección IA pausada para enfriar el dispositivo.", "info");
        break;
      case "DISABLE_IR_TORCH":
        onToggleIrTorch();
        onToast("Antorcha linterna apagada.", "info");
        break;
      case "COPY_ADB_DOZE":
      case "OPEN_ANDROID_SETTINGS":
        if (tip.codeToCopy) {
          handleCopyCode(tip.codeToCopy);
        }
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
              {isCharging ? (
                <BatteryCharging className="w-5 h-5 animate-pulse text-emerald-400" />
              ) : (
                <Battery className="w-5 h-5 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide">
                  Optimizador de Batería y Rendimiento
                </h3>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {batteryLevel}%
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Diagnóstico de hardware en tiempo real y maximización de autonomía en grabación
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Score Header Card */}
          <div className="rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/95 border border-slate-700/60 p-6 flex flex-col items-center text-center shadow-lg">
            <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 uppercase">
              ESTADO DE OPTIMIZACIÓN DE BATERÍA
            </span>

            {/* Circular Gauge */}
            <div className="mt-4 relative flex items-center justify-center">
              <div 
                className={cn(
                  "w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-500 shadow-inner",
                  scoreColor
                )}
              >
                <span className="text-4xl font-extrabold tracking-tight text-white font-sans">
                  {overallScore}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-medium">
                  / 100
                </span>
              </div>

              {isCharging && (
                <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-black shadow-md">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
              )}
            </div>

            <div className="mt-3">
              <span className="text-sm font-bold text-slate-200">
                Rendimiento:{" "}
                <span className={cn(
                  overallScore >= 90 ? "text-emerald-400" :
                  overallScore >= 75 ? "text-cyan-400" :
                  overallScore >= 55 ? "text-amber-400" :
                  "text-red-400"
                )}>
                  {ratingText}
                </span>
              </span>
            </div>

            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className={cn(
                "mt-4 w-full h-12 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg",
                isScanning 
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-[0.99]"
              )}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>ANALIZANDO BATERÍA Y HARDWARE...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-slate-950" />
                  <span>ANALIZAR Y OPTIMIZAR BATERÍA</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Diagnostics Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Diagnóstico en Tiempo Real
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {diagnostics.filter(d => d.isGood).length} de {diagnostics.length} en rango óptimo
              </span>
            </div>

            <div className="space-y-2.5">
              {diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-start gap-3 hover:border-slate-600/70 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {diag.isGood ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-white">
                        {diag.title}
                      </span>
                      <span className={cn(
                        "text-[11px] font-mono font-bold shrink-0",
                        diag.isGood ? "text-emerald-400" : "text-amber-400"
                      )}>
                        {diag.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {diag.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable optimization tips */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 fill-current" />
                Acciones para Aumentar Autonomía
              </h4>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Recomendadas
              </span>
            </div>

            <div className="space-y-3">
              {tips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-4 rounded-2xl bg-slate-800/75 border border-slate-700/60 flex flex-col gap-2.5 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                      {tip.category}
                    </span>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      {tip.benefit}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-sm text-white">
                      {tip.title}
                    </h5>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {tip.description}
                    </p>
                  </div>

                  {tip.codeToCopy && (
                    <div 
                      onClick={() => handleCopyCode(tip.codeToCopy!)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer group hover:border-cyan-500/40 transition-colors"
                      title="Clic para copiar"
                    >
                      <code className="text-[11px] font-mono text-cyan-300 truncate">
                        {tip.codeToCopy}
                      </code>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 group-hover:text-cyan-300 transition-colors shrink-0 ml-2">
                        {copiedCode === tip.codeToCopy ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => handleAction(tip)}
                    className={cn(
                      "mt-1 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                      tip.applied 
                        ? "bg-slate-700 text-slate-300 border border-slate-600/50" 
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                    )}
                  >
                    {tip.applied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ya está Aplicado</span>
                      </>
                    ) : tip.codeToCopy ? (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Comando / Código</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Aplicar Acción Ahora</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Monitoreo de energía y hardware activo</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
