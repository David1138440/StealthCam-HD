package com.stealthcam.app.core

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
)
