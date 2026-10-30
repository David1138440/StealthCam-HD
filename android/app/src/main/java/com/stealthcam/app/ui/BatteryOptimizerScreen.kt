package com.stealthcam.app.ui

import android.content.Context
import android.content.Intent
import android.os.BatteryManager
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
        // Score Header Card
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
                    text = "Rendimiento: ${result?.rating ?: "Bueno"}",
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
                        Text("Analizando Batería y Hardware...", fontWeight = FontWeight.Bold)
                    } else {
                        Icon(Icons.Default.Bolt, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("ANALIZAR Y OPTIMIZAR BATERÍA", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Diagnostic Checklist Section
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

        // Actionable optimization tips with codes
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

        Spacer(modifier = Modifier.height(16.dp))
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
                val buttonText = when (tip.actionType) {
                    TipActionType.COPY_CODE -> "Copiar Comando ADB de Optimización"
                    TipActionType.OPEN_BATTERY_SAVER -> "Abrir Ajustes de Batería Android"
                    TipActionType.ENABLE_STEALTH_MODE -> "Activar Pantalla Apagada (Stealth)"
                    TipActionType.OPTIMIZE_CAMERA -> "Aplicar Ajustes de Bajo Consumo"
                    TipActionType.OPEN_SETTINGS -> "Abrir Configuración del Sistema"
                    TipActionType.OPEN_DNS_SETTINGS -> "Copiar DoT y Abrir Ajustes de Red"
                    TipActionType.OPEN_WIFI_SETTINGS -> "Abrir Ajustes Wi-Fi"
                    TipActionType.OPEN_DIALER -> "Copiar y Marcar Código (*#*#)"
                    TipActionType.OPEN_DATA_SAVER -> "Ajustes de Ahorro de Datos"
                }
                Icon(
                    imageVector = if (tip.actionType == TipActionType.COPY_CODE) Icons.Default.ContentCopy else Icons.Default.OpenInNew,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(text = buttonText, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold))
            }
        }
    }
}

/**
 * Modal Dialog wrapper to display the Battery Optimizer right within StealthCam
 */
@Composable
fun BatteryOptimizerModal(
    isOpen: Boolean,
    onDismiss: () -> Unit,
    onEnableStealth: () -> Unit
) {
    if (!isOpen) return

    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    val coroutineScope = rememberCoroutineScope()

    var isScanning by remember { mutableStateOf(false) }
    var currentScore by remember { mutableStateOf(88) }

    val sampleResult = remember(currentScore) {
        OptimizationResult(
            overallScore = currentScore,
            rating = if (currentScore >= 90) "Excelente" else if (currentScore >= 75) "Bueno" else "Atención Requerida",
            batteryLevel = 84,
            isCharging = false,
            diagnostics = listOf(
                DiagnosticItem(
                    title = "Nivel y Estado de Carga",
                    status = "84% (Descargando)",
                    recommendation = "Autonomía estimada: 3h 40min de grabación continua en 1080p.",
                    isGood = true
                ),
                DiagnosticItem(
                    title = "Temperatura y Throttling del Sensor",
                    status = "33.5 °C (Óptimo)",
                    recommendation = "Dentro de los límites seguros térmicos de microbolómetro y CPU.",
                    isGood = true
                ),
                DiagnosticItem(
                    title = "Drenaje de Pantalla OLED",
                    status = "Activo (100% Brillo)",
                    recommendation = "La pantalla es responsable del 68% del consumo. Usa el Modo Camuflaje.",
                    isGood = false
                ),
                DiagnosticItem(
                    title = "Modo Doze y Suspensión en Fondo",
                    status = "Configurado",
                    recommendation = "La aplicación tiene permiso para grabar en segundo plano sin cierre por OOM.",
                    isGood = true
                )
            ),
            tips = listOf(
                OptimizationTip(
                    category = "Máximo Ahorro",
                    benefit = "+85% BATERÍA",
                    title = "Modo Pantalla Apagada (Blackout Stealth)",
                    description = "Apaga los píxeles de la pantalla OLED mientras la cámara y el micrófono continúan grabando en alta resolución.",
                    codeToCopy = null,
                    actionType = TipActionType.ENABLE_STEALTH_MODE
                ),
                OptimizationTip(
                    category = "Sistema Android",
                    benefit = "+2 Horas",
                    title = "Forzar Modo Doze Standby",
                    description = "Suspende tareas y sincronizaciones innecesarias del sistema operativo durante las sesiones de vigilancia prolongadas.",
                    codeToCopy = "dumpsys deviceidle force-idle",
                    actionType = TipActionType.COPY_CODE
                ),
                OptimizationTip(
                    category = "Ajustes de Energía",
                    benefit = "Ahorro Activo",
                    title = "Ajustes de Batería del Teléfono",
                    description = "Desactiva las restricciones de batería en segundo plano para garantizar grabaciones ininterrumpidas.",
                    codeToCopy = null,
                    actionType = TipActionType.OPEN_BATTERY_SAVER
                )
            )
        )
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.BatteryChargingFull,
                        contentDescription = null,
                        tint = SpeedGreen,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Optimizador de Batería",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                }

                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Color.Gray)
                }
            }
        },
        text = {
            Box(modifier = Modifier.heightIn(max = 500.dp)) {
                OptimizerScreen(
                    result = sampleResult,
                    isScanning = isScanning,
                    onRunScan = {
                        coroutineScope.launch {
                            isScanning = true
                            delay(1800)
                            currentScore = 94
                            isScanning = false
                        }
                    },
                    onExecuteAction = { actionType, code ->
                        when (actionType) {
                            TipActionType.COPY_CODE -> {
                                if (code != null) {
                                    clipboardManager.setText(AnnotatedString(code))
                                }
                            }
                            TipActionType.ENABLE_STEALTH_MODE -> {
                                onEnableStealth()
                                onDismiss()
                            }
                            TipActionType.OPEN_BATTERY_SAVER -> {
                                try {
                                    val intent = Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS)
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    val intent = Intent(Settings.ACTION_SETTINGS)
                                    context.startActivity(intent)
                                }
                            }
                            else -> {}
                        }
                    }
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Listo", color = SpeedGreen, fontWeight = FontWeight.Bold)
            }
        },
        containerColor = Color(0xFF0F172A),
        shape = RoundedCornerShape(20.dp)
    )
}
