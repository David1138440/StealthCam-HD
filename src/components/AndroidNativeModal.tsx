import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import QRCode from "qrcode";
import { 
  Smartphone, 
  Download, 
  Copy, 
  Check, 
  X, 
  FileCode, 
  Terminal, 
  ShieldCheck, 
  ExternalLink,
  Camera,
  QrCode,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Share2
} from "lucide-react";
import { ANDROID_FILES } from "./androidSourceData";

interface AndroidNativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: "info" | "success" | "warning") => void;
}

export const AndroidNativeModal: React.FC<AndroidNativeModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [activeTab, setActiveTab] = useState<"install" | "code" | "build">("install");
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);

  useEffect(() => {
    setIsAndroidDevice(/Android/i.test(navigator.userAgent));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 1.5,
        color: {
          dark: "#10b981",
          light: "#09090b"
        }
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentFile = ANDROID_FILES[selectedFileIndex] || ANDROID_FILES[0];

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        onToast("¡Instalación iniciada en tu dispositivo!", "success");
      }
      setDeferredPrompt(null);
    } else {
      onToast("Abre el menú (⋮) de Chrome y toca 'Instalar aplicación'", "info");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      onToast("Enlace de la app copiado. ¡Ábrelo en tu celular!", "success");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onToast("Error al copiar enlace", "warning");
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      onToast(`Código de ${currentFile.name} copiado al portapapeles`, "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast("Error al copiar al portapapeles", "warning");
    }
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder("StealthCam-Android");

      ANDROID_FILES.forEach(file => {
        rootFolder?.file(file.path, file.content);
      });

      // Also add root gradle properties and wrapper hints
      rootFolder?.file("gradle.properties", "org.gradle.jvmargs=-Xmx2048m\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\n");
      rootFolder?.file("build.gradle.kts", `// Top-level build file\nplugins {\n    id("com.android.application") version "8.5.2" apply false\n    id("org.jetbrains.kotlin.android") version "2.0.0" apply false\n    id("org.jetbrains.kotlin.plugin.compose") version "2.0.0" apply false\n}\n`);
      rootFolder?.file("settings.gradle.kts", `pluginManagement {\n    repositories {\n        google()\n        mavenCentral()\n        gradlePluginPortal()\n    }\n}\ndependencyResolutionManagement {\n    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)\n    repositories {\n        google()\n        mavenCentral()\n    }\n}\nrootProject.name = "StealthCam"\ninclude(":app")\n`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "StealthCam-Android-Kotlin-Project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onToast("¡Proyecto Android Studio (.ZIP) descargado con éxito!", "success");
    } catch (err) {
      console.error("Error creating ZIP:", err);
      onToast("Error al empaquetar el archivo ZIP", "warning");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-5xl bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">StealthCam para Android</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isAndroidDevice ? "Dispositivo Android Detectado" : "Instalable & Nativo"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Disponible para instalar en tu móvil o compilar nativamente con Kotlin y Android Studio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              title="Descarga el proyecto completo listo para Android Studio"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Preparando..." : "Descargar Proyecto ZIP"}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-neutral-950/50 border-b border-white/5 text-xs font-medium">
          <button
            onClick={() => setActiveTab("install")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "install"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Instalar en tu Celular (Inmediato)</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "code"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Código Nativo Kotlin & CameraX</span>
          </button>

          <button
            onClick={() => setActiveTab("build")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
              activeTab === "build"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Guía de Compilación de APK</span>
          </button>
        </div>

        {/* Tab 1: Instant Install in Android Phone */}
        {activeTab === "install" && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8 items-center md:items-start justify-center">
            {/* QR Code Container */}
            <div className="flex flex-col items-center gap-3 p-5 rounded-3xl bg-neutral-950 border border-white/10 shadow-xl max-w-xs text-center shrink-0">
              <div className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>Escanear con tu Teléfono Android</span>
              </div>
              
              <div className="p-2.5 bg-black rounded-2xl border border-emerald-500/30 shadow-inner">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Escanear QR para abrir en Android" className="w-48 h-48 rounded-lg" />
                ) : (
                  <div className="w-48 h-48 bg-neutral-900 animate-pulse rounded-lg flex items-center justify-center text-xs text-gray-500">
                    Generando QR...
                  </div>
                )}
              </div>

              <p className="text-[11px] text-gray-400 leading-tight">
                Apunta la cámara de tu teléfono a este código para abrir la app directamente en Chrome.
              </p>

              <button
                onClick={handleCopyLink}
                className="w-full mt-1 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-200 hover:text-white transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiar Enlace para Compartir</span>
                  </>
                )}
              </button>
            </div>

            {/* Step-by-Step Installation Guide */}
            <div className="flex-1 max-w-xl space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" />
                  Instalación en 1 minuto en Android
                </div>
                <h4 className="text-lg font-bold text-white">
                  Instala StealthCam como App Nativa en tu Celular
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  StealthCam HD cuenta con soporte oficial para Progressive Web App (PWA / WebAPK) y proyecto nativo Kotlin. Al instalarla en Android, obtienes una experiencia de pantalla completa sin barras de navegador, acceso directo desde el cajón de aplicaciones y máximo rendimiento.
                </p>
              </div>

              {/* In-Device Instant Install CTA if on Android */}
              {deferredPrompt && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between gap-4 shadow-lg shadow-emerald-500/10">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-emerald-300">¡Navegador listo para instalar!</div>
                    <div className="text-[11px] text-gray-300">Presiona el botón para agregar el ícono a tu pantalla de inicio.</div>
                  </div>
                  <button
                    onClick={handleInstallPwa}
                    className="shrink-0 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    Instalar Ahora
                  </button>
                </div>
              )}

              {/* 3 Step Guide Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                    1
                  </div>
                  <div className="text-xs font-semibold text-white">Abre en Chrome</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Escanea el QR o abre el enlace en Google Chrome o Samsung Internet en tu Android.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                    2
                  </div>
                  <div className="text-xs font-semibold text-white">Menú ⋮ de Opciones</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Toca los tres puntos verticales <strong>(⋮)</strong> en la esquina superior derecha del navegador.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-white/10 space-y-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold font-mono text-xs flex items-center justify-center">
                    3
                  </div>
                  <div className="text-xs font-semibold text-white">Instalar App</div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla de inicio"</strong>. ¡Y listo!
                  </p>
                </div>
              </div>

              {/* Hardware features unlocked on Android */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Beneficios en Android:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Grabación FHD 1080p con audio AAC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Modo Black Screen OLED (Ahorro de batería)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Alternancia de cámara trasera / delantera</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Almacenamiento seguro offline en IndexedDB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Kotlin Source Code & Android Studio Project */}
        {activeTab === "code" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* File Selector Sidebar */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-neutral-950/40 p-4 flex flex-col gap-3 overflow-y-auto shrink-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 px-2 flex items-center justify-between">
                <span>Archivos Kotlin & Gradle</span>
                <span className="text-[10px] text-emerald-400 font-bold">{ANDROID_FILES.length}</span>
              </div>

              <div className="space-y-1">
                {ANDROID_FILES.map((file, idx) => {
                  const isSelected = selectedFileIndex === idx;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? "bg-emerald-500/15 text-emerald-300 font-medium border border-emerald-500/30"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                      }`}
                    >
                      <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? "text-emerald-400" : "text-gray-500"}`} />
                      <div className="truncate">
                        <div className="truncate font-mono text-[11px]">{file.name}</div>
                        <div className="text-[9px] text-gray-500">{file.category}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Download CTA in Sidebar */}
              <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? "Generando..." : "Descargar ZIP Completo"}</span>
                </button>
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
              {/* Top Code Toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-neutral-900/40">
                <div className="flex items-center gap-2 font-mono text-xs text-gray-300">
                  <span className="text-gray-500">android/</span>
                  <span className="text-emerald-400 font-semibold">{currentFile.path}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs transition-colors border border-white/10"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-gray-300 bg-neutral-950 select-text">
                <pre className="overflow-x-auto whitespace-pre">
                  {currentFile.content}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Build APK Instructions */}
        {activeTab === "build" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <span>Cómo Compilar el APK con Android Studio y Gradle</span>
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sigue estos sencillos pasos para generar el archivo instalable <strong>.apk</strong> desde el código fuente de Kotlin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Terminal / Gradle */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Terminal className="w-4 h-4" />
                  <span>Opción 1: Compilación por Terminal (Rápida)</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  1. Descarga y extrae el archivo <strong>StealthCam-Android-Kotlin-Project.zip</strong>.
                  <br />
                  2. Abre tu terminal en la carpeta extraída y ejecuta:
                </p>
                <div className="p-3 bg-black/80 rounded-xl border border-white/10 font-mono text-xs text-emerald-400 select-all">
                  # En Linux / macOS:
                  <br />
                  ./gradlew assembleDebug
                  <br />
                  <br />
                  # En Windows (PowerShell/CMD):
                  <br />
                  gradlew.bat assembleDebug
                </div>
                <p className="text-[11px] text-gray-400">
                  El APK generado estará listo en:
                  <br />
                  <span className="font-mono text-emerald-300">app/build/outputs/apk/debug/app-debug.apk</span>
                </p>
              </div>

              {/* Option B: Android Studio GUI */}
              <div className="p-5 rounded-2xl bg-neutral-950 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Opción 2: Desde Android Studio (Recomendado)</span>
                </div>
                <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside leading-relaxed">
                  <li>
                    Abre Android Studio y selecciona <strong>File &gt; Open...</strong>
                  </li>
                  <li>
                    Selecciona la carpeta descomprimida del proyecto. Espera a que termine la sincronización de Gradle.
                  </li>
                  <li>
                    Ve al menú superior: <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong>.
                  </li>
                  <li>
                    O conecta tu teléfono por USB con <em>Depuración USB</em> habilitada y presiona el botón verde <strong>Run (▶)</strong> para instalarlo directamente.
                  </li>
                </ul>
              </div>
            </div>

            {/* Architecture Details Box */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Requisitos de Hardware y Configuración de Android:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase font-mono text-gray-500">Android SDK</div>
                  <div className="font-bold text-white mt-0.5">minSdk 24 • targetSdk 34</div>
                  <div className="text-[10px] text-gray-400 mt-1">Soporte para 98%+ de dispositivos en uso.</div>
                </div>
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase font-mono text-gray-500">Cámara & Sensor</div>
                  <div className="font-bold text-white mt-0.5">CameraX 1.3.4</div>
                  <div className="text-[10px] text-gray-400 mt-1">VideoCapture, PreviewView y Torch Control.</div>
                </div>
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-white/5">
                  <div className="text-[10px] uppercase font-mono text-gray-500">Diseño UI</div>
                  <div className="font-bold text-white mt-0.5">Jetpack Compose BOM 2024</div>
                  <div className="text-[10px] text-gray-400 mt-1">Material Design 3 reactivo y fluido.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Features Bar */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-neutral-950/90 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>CameraX + PWA WebAPK Certificado</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <Camera className="w-4 h-4" />
              <span>Cámara Trasera y Frontal con Audio AAC</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar ZIP (.ZIP)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
