package com.alertsystem.managers

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import com.alertsystem.R
import com.alertsystem.utils.Logger

class AudioController(private val context: Context) {
    
    private var mediaPlayer: MediaPlayer? = null
    private var audioEnabled = false
    private var currentAlertId: String? = null
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    
    /**
     * Enable audio after user gesture (required for Android audio policy)
     */
    fun enableAudio() {
        audioEnabled = true
        Logger.i("Audio enabled by user gesture")
    }
    
    /**
     * Play a test alarm (short duration)
     */
    fun playTestAlarm() {
        if (!audioEnabled) {
            Logger.w("Cannot play test alarm: audio not enabled")
            return
        }
        
        try {
            // Use system alarm sound for test
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            
            val testPlayer = MediaPlayer().apply {
                setDataSource(context, alarmUri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build()
                )
                setVolume(1.0f, 1.0f)
                prepare()
                setOnCompletionListener { 
                    it.release()
                    Logger.i("Test alarm completed")
                }
                start()
            }
            Logger.i("Playing test alarm")
        } catch (e: Exception) {
            Logger.e("Error playing test alarm", e)
        }
    }
    
    /**
     * Start playing siren alarm in loop
     */
    fun startSiren(alertId: String) {
        if (!audioEnabled) {
            Logger.w("Cannot start siren: audio not enabled")
            return
        }
        
        // Stop any existing siren first
        stopSiren()
        
        currentAlertId = alertId
        
        try {
            // Use system alarm sound for guaranteed playback
            val soundUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                ?: Uri.parse("content://settings/system/alarm_alert")
            
            mediaPlayer = MediaPlayer().apply {
                setDataSource(context, soundUri)
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build()
                )
                isLooping = true
                setVolume(1.0f, 1.0f)
                
                // Set to max volume
                val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0)
                
                prepare()
                start()
            }
            Logger.i("Started siren for alert $alertId (volume: max)")
        } catch (e: Exception) {
            Logger.e("Error starting siren", e)
            currentAlertId = null
            
            // Emergency fallback: use Ringtone directly
            try {
                val ringtone = RingtoneManager.getRingtone(
                    context,
                    RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                )
                ringtone.play()
                Logger.i("Using ringtone fallback for siren")
            } catch (e2: Exception) {
                Logger.e("Ringtone fallback also failed", e2)
            }
        }
    }
    
    /**
     * Stop siren for specific alert
     */
    fun stopSiren(alertId: String? = null) {
        if (alertId != null && currentAlertId != alertId) {
            Logger.w("Ignoring stop siren for different alertId: $alertId (current: $currentAlertId)")
            return
        }
        
        try {
            mediaPlayer?.apply {
                if (isPlaying) {
                    stop()
                }
                release()
            }
            Logger.i("Stopped siren for alert ${currentAlertId ?: alertId}")
        } catch (e: Exception) {
            Logger.e("Error stopping siren", e)
        } finally {
            mediaPlayer = null
            currentAlertId = null
        }
    }
    
    /**
     * Check if siren is currently playing
     */
    fun isSirenActive(): Boolean {
        return mediaPlayer?.isPlaying == true
    }
    
    /**
     * Get current siren alert ID
     */
    fun getCurrentAlertId(): String? {
        return currentAlertId
    }
    
    /**
     * Check if audio is enabled
     */
    fun isAudioEnabled(): Boolean {
        return audioEnabled
    }
    
    /**
     * Release resources
     */
    fun release() {
        stopSiren()
        Logger.i("Audio controller released")
    }
}
