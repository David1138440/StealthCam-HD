package com.stealthcam.app.camera

import android.content.ContentValues
import android.content.Context
import android.os.Build
import android.provider.MediaStore
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

        // Recorder & VideoCapture Use Case with High Quality
        val recorder = Recorder.Builder()
            .setQualitySelector(QualitySelector.from(Quality.FHD, FallbackStrategy.higherQualityOrLowerThan(Quality.SD)))
            .build()
        videoCapture = VideoCapture.withOutput(recorder)

        // Image Analysis for Motion/Presence detection
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
                            onError("Error al finalizar grabación: ${recordEvent.error}")
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
}
