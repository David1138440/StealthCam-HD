package com.stealthcam.app.ui

import android.content.Context
import android.content.Intent
import android.os.SystemClock
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
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
    var showGallery by remember { mutableStateOf(false) }
    var recordedVideos by remember { mutableStateOf(listOf<File>()) }
    var isInfraredActive by remember { mutableStateOf(false) }
    var spotTemp by remember { mutableStateOf(36.6f) }
    var showBatteryOptimizer by remember { mutableStateOf(false) }

    val motionDetector = remember {
        MotionDetector { _ ->
            motionDetected = true
        }
    }

    // Motion indicator auto-reset
    LaunchedEffect(motionDetected) {
        if (motionDetected) {
            delay(1500)
            motionDetected = false
        }
    }

    // Recording duration timer
    LaunchedEffect(isRecording) {
        if (isRecording) {
            recordingSeconds = 0
            while (isRecording) {
                delay(1000)
                recordingSeconds++
            }
        }
    }

    // Refresh video list
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
        // Camera Viewfinder (AndroidView wrapping CameraX PreviewView)
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

        // Camouflage / Blackout Mode Overlay
        if (isStealthBlackout) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onDoubleTap = {
                                isStealthBlackout = false
                            }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                if (isRecording) {
                    // Ultra subtle 1px pulse in bottom corner
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(12.dp)
                            .size(4.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF10B981).copy(alpha = 0.3f))
                    )
                }
            }
        }

        // Standard HUD & Controls (when not in blackout mode)
        if (!isStealthBlackout) {
            // Top HUD Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Camera Lens Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.Black.copy(alpha = 0.65f))
                        .border(1.dp, if (!isFrontCamera) EmeraldPrimary.copy(alpha = 0.5f) else Color.White.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(if (!isFrontCamera) EmeraldPrimary else Color(0xFF60A5FA))
                        )
                        Text(
                            text = if (!isFrontCamera) "CÁMARA PRINCIPAL" else "CÁMARA FRONTAL",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                // Recording Status / Duration
                if (isRecording) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(AlertRed.copy(alpha = 0.2f))
                            .border(1.dp, AlertRed.copy(alpha = 0.6f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(AlertRed)
                            )
                            val minutes = recordingSeconds / 60
                            val secs = recordingSeconds % 60
                            Text(
                                text = String.format("%02d:%02d", minutes, secs),
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }

                // Motion Detection Warning
                if (motionDetected) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color(0xFFF59E0B).copy(alpha = 0.2f))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Text(
                            text = "MOVIMIENTO",
                            color = Color(0xFFF59E0B),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Battery Status Chip & Optimizer Shortcut
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color.Black.copy(alpha = 0.65f))
                        .border(1.dp, SpeedGreen.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                        .clickable { showBatteryOptimizer = true }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.BatteryChargingFull,
                            contentDescription = "Batería y Rendimiento",
                            tint = SpeedGreen,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            text = "84%",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
            }

            // Bottom Action Controls
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Secondary Quick Actions (Torch, Stealth Blackout, Gallery)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 32.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Torch / Flashlight Toggle
                    IconButton(
                        onClick = {
                            cameraManager.toggleTorch { enabled ->
                                isTorchOn = enabled
                            }
                        },
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(if (isTorchOn) EmeraldPrimary.copy(alpha = 0.2f) else Color.Black.copy(alpha = 0.5f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(
                            imageVector = if (isTorchOn) Icons.Default.FlashOn else Icons.Default.FlashOff,
                            contentDescription = "Linterna",
                            tint = if (isTorchOn) EmeraldPrimary else Color.White
                        )
                    }

                    // Stealth Screen Blackout Trigger
                    IconButton(
                        onClick = { isStealthBlackout = true },
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.5f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.VisibilityOff,
                            contentDescription = "Pantalla Oculta (Camuflaje)",
                            tint = Color.White
                        )
                    }

                    // Gallery Launcher
                    IconButton(
                        onClick = {
                            refreshVideos()
                            showGallery = true
                        },
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.5f))
                            .border(1.dp, Color.White.copy(alpha = 0.1f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Folder,
                            contentDescription = "Grabaciones",
                            tint = Color.White
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Primary Shutter Row (Switch Camera Lens, Big Record Button, Placeholder)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 32.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Switch Camera Lens (Back / Principal vs Front)
                    IconButton(
                        onClick = {
                            previewViewRef?.let { pView ->
                                cameraManager.switchCamera(pView)
                                isFrontCamera = cameraManager.isFrontCamera
                            }
                        },
                        enabled = !isRecording,
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(if (!isFrontCamera) EmeraldPrimary.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.1f))
                            .border(1.dp, if (!isFrontCamera) EmeraldPrimary.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.2f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.FlipCameraAndroid,
                            contentDescription = "Alternar Cámara Trasera / Frontal",
                            tint = if (!isFrontCamera) EmeraldPrimary else Color.White
                        )
                    }

                    // Large Shutter / Record Button
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.4f))
                            .border(3.dp, if (isRecording) AlertRed else Color.White, CircleShape)
                            .clickable {
                                if (isRecording) {
                                    cameraManager.stopRecording()
                                    isRecording = false
                                    refreshVideos()
                                } else {
                                    cameraManager.startRecording(
                                        onVideoSaved = { file ->
                                            refreshVideos()
                                        },
                                        onError = { _ ->
                                            isRecording = false
                                        }
                                    )
                                    isRecording = true
                                }
                            }
                            .padding(8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(if (isRecording) 32.dp else 56.dp)
                                .clip(if (isRecording) RoundedCornerShape(8.dp) else CircleShape)
                                .background(if (isRecording) AlertRed else Color(0xFFEF4444))
                        )
                    }

                    // Botón Cámara Infrarroja (IR Térmico)
                    IconButton(
                        onClick = { isInfraredActive = !isInfraredActive },
                        modifier = Modifier
                            .size(54.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isInfraredActive) AlertRed.copy(alpha = 0.25f) else Color.White.copy(alpha = 0.08f))
                            .border(1.dp, if (isInfraredActive) AlertRed.copy(alpha = 0.6f) else Color.White.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                    ) {
                        Icon(
                            Icons.Default.Whatshot,
                            contentDescription = "Cámara Infrarroja",
                            tint = if (isInfraredActive) AlertRed else Color.White
                        )
                    }
                }
            }
        }

        // Recorded Clips Gallery Dialog
        if (showGallery) {
            AlertDialog(
                onDismissRequest = { showGallery = false },
                title = {
                    Text(
                        text = "Grabaciones Seguras (${recordedVideos.size})",
                        color = Color.White,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    if (recordedVideos.isEmpty()) {
                        Text(
                            text = "Aún no hay grabaciones de video guardadas en el almacenamiento privado.",
                            color = Color(0xFFA3A3A3),
                            fontSize = 14.sp
                        )
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.heightIn(max = 350.dp)
                        ) {
                            items(recordedVideos) { file ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(Color(0xFF1F1F1F))
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            text = file.name,
                                            color = Color.White,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            maxLines = 1
                                        )
                                        Text(
                                            text = "${file.length() / (1024 * 1024)} MB • ${SimpleDateFormat("HH:mm:ss dd/MM", Locale.getDefault()).format(Date(file.lastModified()))}",
                                            color = Color(0xFF737373),
                                            fontSize = 11.sp
                                        )
                                    }

                                    // Share Button via Intent
                                    IconButton(
                                        onClick = {
                                            shareVideo(context, file)
                                        }
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Share,
                                            contentDescription = "Compartir Video",
                                            tint = EmeraldPrimary
                                        )
                                    }
                                }
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showGallery = false }) {
                        Text("Cerrar", color = EmeraldPrimary)
                    }
                },
                containerColor = Color(0xFF141414),
                shape = RoundedCornerShape(16.dp)
            )
        }

        // Modal de Diagnóstico y Optimización de Batería
        if (showBatteryOptimizer) {
            BatteryOptimizerModal(
                isOpen = showBatteryOptimizer,
                onDismiss = { showBatteryOptimizer = false },
                onEnableStealth = {
                    isStealthBlackout = true
                }
            )
        }
    }
}

private fun shareVideo(context: Context, file: File) {
    try {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.provider",
            file
        )
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "video/mp4"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, "Compartir Video StealthCam"))
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
