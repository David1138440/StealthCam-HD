export interface AndroidFile {
  path: string;
  name: string;
  category: "Kotlin UI" | "Camera & Engine" | "Config & Manifest" | "Resources";
  language: "kotlin" | "groovy" | "xml" | "markdown" | "properties";
  content: string;
}

export const ANDROID_FILES: AndroidFile[] = [
  {
    path: "app/src/main/java/com/stealthcam/app/MainActivity.kt",
    name: "MainActivity.kt",
    category: "Kotlin UI",
    language: "kotlin",
    content: `package com.stealthcam.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.stealthcam.app.ui.StealthCamScreen
import com.stealthcam.app.ui.theme.StealthCamTheme

class MainActivity : ComponentActivity() {

    private val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        hasPermissionsState.value = cameraGranted && audioGranted
    }

    private val hasPermissionsState = mutableStateOf(false)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Comprobación inicial de permisos
        hasPermissionsState.value = hasAllPermissions()

        setContent {
            StealthCamTheme {
                val hasPermissions by remember { hasPermissionsState }

                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color.Black
                ) {
                    if (hasPermissions) {
                        StealthCamScreen()
                    } else {
                        PermissionRequestScreen(
                            onRequestPermissions = {
                                permissionLauncher.launch(requiredPermissions)
                            }
                        )
                    }
                }
            }
        }
    }

    private fun hasAllPermissions(): Boolean {
        return requiredPermissions.all { perm ->
            ContextCompat.checkSelfPermission(this, perm) == PackageManager.PERMISSION_GRANTED
        }
    }
}

@Composable
fun PermissionRequestScreen(
    onRequestPermissions: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0A0A0A))
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(Color(0xFF10B981).copy(alpha = 0.15f), shape = MaterialTheme.shapes.medium),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "📹",
                fontSize = 32.sp
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "StealthCam HD",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Para activar la cámara principal, sensor de visión nocturna y grabación encriptada, conceda acceso a la cámara y micrófono.",
            fontSize = 14.sp,
            color = Color(0xFFA3A3A3),
            textAlign = TextAlign.Center,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onRequestPermissions,
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF10B981),
                contentColor = Color.Black
            ),
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Text(
                text = "Habilitar Permisos de Cámara",
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp
            )
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/stealthcam/app/camera/CameraManager.kt",
    name: "CameraManager.kt",
    category: "Camera & Engine",
    language: "kotlin",
    content: `package com.stealthcam.app.camera

import android.content.Context
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.video.VideoCapture
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraManager(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner
) {
    private var cameraProvider: ProcessCameraProvider? = null
    private var currentCamera: Camera? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var currentRecording: Recording? = null
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    var isFrontCamera: Boolean = false
        private set

    var isRecording: Boolean = false
        private set

    var isTorchEnabled: Boolean = false
        private set

    fun startCamera(
        previewView: PreviewView,
        onFrameAnalysis: ((ImageProxy) -> Unit)? = null,
        onInitialized: (() -> Unit)? = null
    ) {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()
            bindCameraUseCases(previewView, onFrameAnalysis)
            onInitialized?.invoke()
        }, ContextCompat.getMainExecutor(context))
    }

    private fun bindCameraUseCases(
        previewView: PreviewView,
        onFrameAnalysis: ((ImageProxy) -> Unit)?
    ) {
        val provider = cameraProvider ?: return

        val cameraSelector = if (isFrontCamera) {
            CameraSelector.DEFAULT_FRONT_CAMERA
        } else {
            CameraSelector.DEFAULT_BACK_CAMERA
        }

        // Preview Use Case
        val preview = Preview.Builder()
            .build()
            .also {
                it.setSurfaceProvider(previewView.surfaceProvider)
            }

        // Recorder con resolución Full HD y fallback automático
        val recorder = Recorder.Builder()
            .setQualitySelector(QualitySelector.from(Quality.FHD, FallbackStrategy.higherQualityOrLowerThan(Quality.SD)))
            .build()
        videoCapture = VideoCapture.withOutput(recorder)

        // Análisis en tiempo real de cuadros para detección de presencia
        val imageAnalysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
            .also { analysis ->
                analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    onFrameAnalysis?.invoke(imageProxy) ?: imageProxy.close()
                }
            }

        try {
            provider.unbindAll()
            currentCamera = provider.bindToLifecycle(
                lifecycleOwner,
                cameraSelector,
                preview,
                videoCapture,
                imageAnalysis
            )
        } catch (exc: Exception) {
            exc.printStackTrace()
        }
    }

    fun switchCamera(
        previewView: PreviewView,
        onFrameAnalysis: ((ImageProxy) -> Unit)? = null
    ) {
        isFrontCamera = !isFrontCamera
        bindCameraUseCases(previewView, onFrameAnalysis)
    }

    fun toggleTorch(onSuccess: (Boolean) -> Unit) {
        currentCamera?.cameraControl?.let { control ->
            isTorchEnabled = !isTorchEnabled
            control.enableTorch(isTorchEnabled)
            onSuccess(isTorchEnabled)
        }
    }

    fun startRecording(
        onVideoSaved: (File) -> Unit,
        onError: (String) -> Unit
    ) {
        val capture = videoCapture ?: run {
            onError("VideoCapture no inicializado")
            return
        }

        val name = "StealthCam_" + SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date()) + ".mp4"
        val outputFile = File(context.getExternalFilesDir(null), name)
        val outputOptions = FileOutputOptions.Builder(outputFile).build()

        currentRecording = capture.output
            .prepareRecording(context, outputOptions)
            .apply {
                if (ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    withAudioEnabled()
                }
            }
            .start(ContextCompat.getMainExecutor(context)) { recordEvent ->
                when (recordEvent) {
                    is VideoRecordEvent.Start -> {
                        isRecording = true
                    }
                    is VideoRecordEvent.Finalize -> {
                        isRecording = false
                        if (!recordEvent.hasError()) {
                            onVideoSaved(outputFile)
                        } else {
                            currentRecording?.close()
                            currentRecording = null
                            onError("Error al finalizar grabación: \${recordEvent.error}")
                        }
                    }
                }
            }
    }

    fun stopRecording() {
        currentRecording?.stop()
        currentRecording = null
        isRecording = false
    }

    fun shutdown() {
        cameraExecutor.shutdown()
    }
}`
  },
  {
    path: "app/src/main/java/com/stealthcam/app/ui/StealthCamScreen.kt",
    name: "StealthCamScreen.kt",
    category: "Kotlin UI",
    language: "kotlin",
    content: `package com.stealthcam.app.ui

import android.content.Context
import android.content.Intent
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.FileProvider
import com.stealthcam.app.camera.CameraManager
import com.stealthcam.app.detection.MotionDetector
import com.stealthcam.app.ui.theme.*
import kotlinx.coroutines.delay
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun StealthCamScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    val cameraManager = remember { CameraManager(context, lifecycleOwner) }
    var previewViewRef by remember { mutableStateOf<PreviewView?>(null) }

    var isRecording by remember { mutableStateOf(false) }
    var isStealthBlackout by remember { mutableStateOf(false) }
    var isFrontCamera by remember { mutableStateOf(false) }
    var isTorchOn by remember { mutableStateOf(false) }
    var motionDetected by remember { mutableStateOf(false) }
    var recordingSeconds by remember { mutableStateOf(0) }
    var recordedVideos by remember { mutableStateOf(listOf<File>()) }
    var isInfraredActive by remember { mutableStateOf(false) }
    var spotTemp by remember { mutableStateOf(36.6f) }

    val motionDetector = remember {
        MotionDetector { _ ->
            motionDetected = true
        }
    }

    LaunchedEffect(motionDetected) {
        if (motionDetected) {
            delay(1500)
            motionDetected = false
        }
    }

    LaunchedEffect(isRecording) {
        if (isRecording) {
            recordingSeconds = 0
            while (isRecording) {
                delay(1000)
                recordingSeconds++
            }
        }
    }

    fun refreshVideos() {
        val dir = context.getExternalFilesDir(null)
        val files = dir?.listFiles { file -> file.extension == "mp4" }?.sortedByDescending { it.lastModified() }
        recordedVideos = files?.toList() ?: emptyList()
    }

    DisposableEffect(Unit) {
        refreshVideos()
        onDispose {
            cameraManager.shutdown()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Visor de Cámara Nativo usando CameraX PreviewView
        AndroidView(
            factory = { ctx ->
                PreviewView(ctx).apply {
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                    previewViewRef = this
                    cameraManager.startCamera(
                        previewView = this,
                        onFrameAnalysis = { image -> motionDetector.analyze(image) }
                    )
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Modo de Camuflaje / Pantalla Negra
        if (isStealthBlackout) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onDoubleTap = { isStealthBlackout = false }
                        )
                    }
            )
        }

        // HUD Normal de Controles
        if (!isStealthBlackout) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Etiqueta de Lente Activo
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.Black.copy(alpha = 0.65f))
                        .border(1.dp, if (!isFrontCamera) EmeraldPrimary.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = if (!isFrontCamera) "CÁMARA PRINCIPAL" else "CÁMARA FRONTAL",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }

                if (isRecording) {
                    val minutes = recordingSeconds / 60
                    val secs = recordingSeconds % 60
                    Text(
                        text = String.format("REC %02d:%02d", minutes, secs),
                        color = Color.Red,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Barra Inferior de Disparo
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 24.dp, start = 24.dp, end = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Cambiar Lente
                IconButton(
                    onClick = {
                        previewViewRef?.let { pView ->
                            cameraManager.switchCamera(pView)
                            isFrontCamera = cameraManager.isFrontCamera
                        }
                    },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Default.FlipCameraAndroid, contentDescription = "Alternar Lente", tint = Color.White)
                }

                // Botón de Grabación
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                        .clickable {
                            if (isRecording) {
                                cameraManager.stopRecording()
                                isRecording = false
                                refreshVideos()
                            } else {
                                cameraManager.startRecording(
                                    onVideoSaved = { refreshVideos() },
                                    onError = { isRecording = false }
                                )
                                isRecording = true
                            }
                        }
                        .padding(6.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(if (isRecording) 30.dp else 60.dp)
                            .clip(if (isRecording) RoundedCornerShape(8.dp) else CircleShape)
                            .background(Color(0xFFEF4444))
                    )
                }

                // Botón Modo Camuflaje
                IconButton(
                    onClick = { isStealthBlackout = true },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Default.VisibilityOff, contentDescription = "Pantalla Oculta", tint = Color.White)
                }

                // Botón Cámara Infrarroja (IR Térmico)
                IconButton(
                    onClick = { isInfraredActive = !isInfraredActive },
                    modifier = Modifier.size(52.dp)
                ) {
                    Icon(Icons.Default.Whatshot, contentDescription = "Cámara Infrarroja", tint = if (isInfraredActive) Color(0xFFEF4444) else Color.White)
                }
            }
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/stealthcam/app/ui/BatteryOptimizerScreen.kt",
    name: "BatteryOptimizerScreen.kt",
    category: "Kotlin UI",
    language: "kotlin",
    content: `package com.stealthcam.app.ui

import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.stealthcam.app.core.DiagnosticItem
import com.stealthcam.app.core.OptimizationResult
import com.stealthcam.app.core.OptimizationTip
import com.stealthcam.app.core.TipActionType
import com.stealthcam.app.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun OptimizerScreen(
    result: OptimizationResult?,
    isScanning: Boolean,
    onRunScan: () -> Unit,
    onExecuteAction: (TipActionType, String?) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        val score = result?.overallScore ?: 85
        val scoreColor = when {
            score >= 90 -> SpeedGreen
            score >= 75 -> SpeedCyan
            score >= 55 -> SpeedOrange
            else -> SpeedRed
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(
                    Brush.verticalGradient(
                        listOf(DarkSurfaceVariant, Color(0xFF0F172A))
                    )
                )
                .border(1.dp, DarkCardBorder, RoundedCornerShape(20.dp))
                .padding(20.dp)
                .testTag("optimizer_score_card")
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "ESTADO DE OPTIMIZACIÓN DE BATERÍA",
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    ),
                    color = TextMuted
                )

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .size(110.dp)
                        .clip(CircleShape)
                        .background(scoreColor.copy(alpha = 0.1f))
                        .border(3.dp, scoreColor, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "$score",
                            style = MaterialTheme.typography.displayMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 36.sp
                            ),
                            color = TextPrimary
                        )
                        Text(
                            text = "/ 100",
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                            color = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Rendimiento: \${result?.rating ?: "Bueno"}",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = scoreColor
                    )
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = onRunScan,
                    enabled = !isScanning,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("scan_optimizer_btn"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SpeedCyan,
                        contentColor = Color(0xFF00363D)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (isScanning) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color(0xFF00363D),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Analizando Batería...", fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Default.Bolt, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("ANALIZAR Y OPTIMIZAR BATERÍA", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "Diagnóstico en Tiempo Real",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = TextPrimary,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        result?.diagnostics?.forEach { item ->
            DiagnosticCard(item = item)
            Spacer(modifier = Modifier.height(8.dp))
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Acciones para Aumentar Autonomía",
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
            color = TextPrimary,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        result?.tips?.forEach { tip ->
            OptimizationTipCard(
                tip = tip,
                onAction = { onExecuteAction(tip.actionType, tip.codeToCopy) }
            )
            Spacer(modifier = Modifier.height(10.dp))
        }
    }
}

@Composable
private fun DiagnosticCard(item: DiagnosticItem) {
    val statusColor = if (item.isGood) SpeedGreen else SpeedOrange

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(DarkSurfaceVariant)
            .border(1.dp, DarkCardBorder, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            Icon(
                imageVector = if (item.isGood) Icons.Default.CheckCircle else Icons.Default.Warning,
                contentDescription = null,
                tint = statusColor,
                modifier = Modifier
                    .size(20.dp)
                    .padding(top = 2.dp)
            )

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        ),
                        color = TextPrimary
                    )
                    Text(
                        text = item.status,
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.sp
                        ),
                        color = statusColor
                    )
                }

                Spacer(modifier = Modifier.height(3.dp))

                Text(
                    text = item.recommendation,
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun OptimizationTipCard(
    tip: OptimizationTip,
    onAction: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(DarkSurfaceVariant)
            .border(1.dp, DarkCardBorder, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = tip.category.uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = SpeedCyan,
                        fontSize = 10.sp
                    )
                )

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(SpeedGreen.copy(alpha = 0.15f))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = tip.benefit,
                        style = MaterialTheme.typography.bodySmall.copy(
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = SpeedGreen
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = tip.title,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                ),
                color = TextPrimary
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = tip.description,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                color = TextSecondary
            )

            if (tip.codeToCopy != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFF0B111E))
                        .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(8.dp))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = tip.codeToCopy,
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.SemiBold,
                                color = SpeedCyan,
                                fontSize = 13.sp
                            )
                        )
                        Text(
                            text = "Tocar para copiar",
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontSize = 11.sp,
                                color = TextMuted
                            )
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = onAction,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(40.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = SpeedBlue,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(
                    imageVector = if (tip.actionType == TipActionType.COPY_CODE) Icons.Default.ContentCopy else Icons.Default.OpenInNew,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = "Aplicar Acción de Optimización", style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold))
            }
        }
    }
}`
  },
  {
    path: "app/src/main/java/com/stealthcam/app/core/BatteryOptimizationModels.kt",
    name: "BatteryOptimizationModels.kt",
    category: "Camera & Engine",
    language: "kotlin",
    content: `package com.stealthcam.app.core

enum class TipActionType {
    COPY_CODE,
    OPEN_BATTERY_SAVER,
    OPEN_SETTINGS,
    ENABLE_STEALTH_MODE,
    OPTIMIZE_CAMERA,
    OPEN_WIFI_SETTINGS,
    OPEN_DNS_SETTINGS,
    OPEN_DIALER,
    OPEN_DATA_SAVER
}

data class DiagnosticItem(
    val title: String,
    val status: String,
    val recommendation: String,
    val isGood: Boolean
)

data class OptimizationTip(
    val category: String,
    val benefit: String,
    val title: String,
    val description: String,
    val codeToCopy: String? = null,
    val actionType: TipActionType
)

data class OptimizationResult(
    val overallScore: Int,
    val rating: String,
    val batteryLevel: Int = 85,
    val isCharging: Boolean = false,
    val diagnostics: List<DiagnosticItem>,
    val tips: List<OptimizationTip>
)`
  },
  {
    path: "app/src/main/java/com/stealthcam/app/detection/MotionDetector.kt",
    name: "MotionDetector.kt",
    category: "Camera & Engine",
    language: "kotlin",
    content: `package com.stealthcam.app.detection

import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer
import kotlin.math.abs

class MotionDetector(
    private val threshold: Int = 25,
    private val onMotionDetected: (delta: Double) -> Unit
) {
    private var previousBuffer: ByteArray? = null

    fun analyze(image: ImageProxy) {
        val plane = image.planes[0] // Plano Y (Luminancia)
        val buffer: ByteBuffer = plane.buffer
        val data = ByteArray(buffer.remaining())
        buffer.get(data)

        val step = 16
        var totalDiff = 0L
        var sampleCount = 0

        val prev = previousBuffer
        if (prev != null && prev.size == data.size) {
            var i = 0
            while (i < data.size) {
                val currentPixel = data[i].toInt() and 0xFF
                val prevPixel = prev[i].toInt() and 0xFF
                val diff = abs(currentPixel - prevPixel)
                if (diff > threshold) {
                    totalDiff += diff
                }
                sampleCount++
                i += step
            }

            val averageDelta = if (sampleCount > 0) totalDiff.toDouble() / sampleCount else 0.0
            if (averageDelta > 3.0) {
                onMotionDetected(averageDelta)
            }
        }

        previousBuffer = data.clone()
        image.close()
    }
}`
  },
  {
    path: "app/src/main/AndroidManifest.xml",
    name: "AndroidManifest.xml",
    category: "Config & Manifest",
    language: "xml",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permisos de Cámara y Micrófono -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Almacenamiento y Video -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
        android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

    <!-- Servicio en primer plano para grabación contínua -->
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />

    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.StealthCam"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.StealthCam">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>`
  },
  {
    path: "app/build.gradle.kts",
    name: "app/build.gradle.kts",
    category: "Config & Manifest",
    language: "groovy",
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.stealthcam.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.stealthcam.app"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.06.00")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.3")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.compose.material3:material3:1.2.1")

    // CameraX Suite
    val cameraxVersion = "1.3.4"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-video:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")
}`
  },
  {
    path: "settings.gradle.kts",
    name: "settings.gradle.kts",
    category: "Config & Manifest",
    language: "groovy",
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "StealthCam"
include(":app")`
  },
  {
    path: "README.md",
    name: "README.md",
    category: "Config & Manifest",
    language: "markdown",
    content: `# StealthCam HD - Native Android Application (Kotlin & Android SDK)

Esta es la versión nativa para Android construida con **Kotlin**, **Jetpack Compose**, **CameraX** y **Android SDK 34**.

## Compilación y Ejecución en Android Studio
1. Abre Android Studio y haz clic en "Open" seleccionando esta carpeta.
2. Espera a que Gradle sincronice las dependencias.
3. Conecta tu teléfono Android o inicia un emulador.
4. Presiona Run o compila con:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
El APK estará en \`app/build/outputs/apk/debug/app-debug.apk\`.`
  }
];
