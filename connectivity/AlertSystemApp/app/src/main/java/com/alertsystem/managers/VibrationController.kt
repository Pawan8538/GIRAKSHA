package com.alertsystem.managers

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.alertsystem.utils.Logger

class VibrationController(private val context: Context) {
    
    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }
    
    private var currentAlertId: String? = null
    
    /**
     * Vibrate with pattern based on severity.
     * Severity 1: [200ms, 150ms, 200ms, 150ms, 200ms]
     * Severity 2: [300ms, 150ms, 300ms, 150ms, 300ms]
     * Severity 3: [400ms, 150ms, 400ms, 150ms, 400ms]
     */
    fun vibrateForAlert(alertId: String, severity: Int) {
        if (!hasVibrator()) {
            Logger.w("Vibrator not available on this device")
            return
        }
        
        currentAlertId = alertId
        
        val pulseDuration = when (severity) {
            1 -> 200L
            2 -> 300L
            else -> 400L
        }
        val pauseDuration = 150L
        
        // Pattern: [delay, pulse, pause, pulse, pause, pulse]
        val pattern = longArrayOf(
            0,              // Start immediately
            pulseDuration,  // First pulse
            pauseDuration,  // Pause
            pulseDuration,  // Second pulse
            pauseDuration,  // Pause
            pulseDuration   // Third pulse
        )
        
        // Amplitudes for each timing (255 = max, 0 = off)
        val amplitudes = intArrayOf(
            0,    // Initial delay
            255,  // First pulse
            0,    // Pause
            255,  // Second pulse
            0,    // Pause
            255   // Third pulse
        )
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = VibrationEffect.createWaveform(pattern, amplitudes, -1) // -1 = no repeat
                vibrator?.vibrate(effect)
                Logger.i("Vibrating for alert $alertId with severity $severity (${pulseDuration}ms pulses)")
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, -1)
                Logger.i("Vibrating for alert $alertId (legacy API)")
            }
        } catch (e: Exception) {
            Logger.e("Error vibrating", e)
        }
    }
    
    /**
     * Cancel vibration for a specific alert
     */
    fun cancelVibration(alertId: String) {
        if (currentAlertId == alertId) {
            Logger.i("Cancelling vibration for alert $alertId")
            vibrator?.cancel()
            currentAlertId = null
        }
    }
    
    /**
     * Cancel any active vibration
     */
    fun cancelAll() {
        Logger.i("Cancelling all vibrations")
        vibrator?.cancel()
        currentAlertId = null
    }
    
    /**
     * Check if device has vibrator capability
     */
    fun hasVibrator(): Boolean {
        return vibrator?.hasVibrator() == true
    }
    
    /**
     * Check if device supports amplitude control
     */
    fun hasAmplitudeControl(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.hasAmplitudeControl() == true
        } else {
            false
        }
    }
}
