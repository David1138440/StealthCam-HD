package com.stealthcam.app.detection

import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer
import kotlin.math.abs

class MotionDetector(
    private val threshold: Int = 25,
    private val onMotionDetected: (delta: Double) -> Unit
) {
    private var previousBuffer: ByteArray? = null

    fun analyze(image: ImageProxy) {
        val plane = image.planes[0] // Luminance (Y plane)
        val buffer: ByteBuffer = plane.buffer
        val data = ByteArray(buffer.remaining())
        buffer.get(data)

        // Subsample every 16th pixel to minimize CPU and battery load during stealth operations
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
}
