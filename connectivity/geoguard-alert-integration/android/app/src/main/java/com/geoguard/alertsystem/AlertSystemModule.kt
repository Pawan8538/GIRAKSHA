package com.geoguard.alertsystem

import android.content.Context
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.alertsystem.managers.SocketManager
import com.alertsystem.managers.VibrationController
import com.alertsystem.managers.AudioController
import com.alertsystem.models.AppConfig
import com.alertsystem.models.Role
import com.alertsystem.models.Alert
import com.alertsystem.utils.Logger

class AlertSystemModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var socketManager: SocketManager? = null
    private var vibrationController: VibrationController? = null
    private var audioController: AudioController? = null
    private var currentRole: Role? = null

    override fun getName(): String {
        return "AlertSystemModule"
    }

    /**
     * Initialize alert system with server configuration
     */
    @ReactMethod
    fun initialize(serverUrl: String, zones: ReadableArray, promise: Promise) {
        try {
            val zoneList = zones.toArrayList().map { it.toString() }
            
            vibrationController = VibrationController(reactApplicationContext)
            audioController = AudioController(reactApplicationContext)
            socketManager = SocketManager(reactApplicationContext, serverUrl).apply {
                onConnectionStateChanged = { state ->
                    sendEvent("AlertSystem:ConnectionState", state.name)
                }
                onAlertReceived = { alert ->
                    handleAlertReceived(alert)
                }
                onSirenReceived = { siren ->
                    sendEvent("AlertSystem:Siren", Arguments.createMap().apply {
                        putString("alertId", siren.alertId)
                        putString("zone", siren.zone)
                        putInt("severity", siren.severity)
                    })
                }
                onSirenCancelReceived = { cancel ->
                    audioController?.stopSiren(cancel.alertId)
                    sendEvent("AlertSystem:SirenCancel", Arguments.createMap().apply {
                        putString("alertId", cancel.alertId)
                    })
                }
            }
            
            socketManager?.connect()
            
            promise.resolve(Arguments.createMap().apply {
                putBoolean("success", true)
                putString("serverUrl", serverUrl)
                putArray("zones", Arguments.fromList(zoneList))
            })
            
            Logger.i("AlertSystemModule initialized")
        } catch (e: Exception) {
            Logger.e("Failed to initialize AlertSystemModule", e)
            promise.reject("INIT_ERROR", e.message, e)
        }
    }

    /**
     * Enable worker mode (vibration + ACK capability)
     */
    @ReactMethod
    fun enableWorkerMode(workerId: String, promise: Promise) {
        try {
            currentRole = Role.BAND
            socketManager?.register(
                AppConfig(
                    role = Role.BAND,
                    serverUrl = socketManager?.serverUrl ?: "",
                    zones = emptyList(),
                    workerId = workerId
                )
            )
            promise.resolve(true)
            Logger.i("Worker mode enabled: $workerId")
        } catch (e: Exception) {
            promise.reject("WORKER_MODE_ERROR", e.message, e)
        }
    }

    /**
     * Enable siren mode (audio alerts)
     */
    @ReactMethod
    fun enableSirenMode(promise: Promise) {
        try {
            currentRole = Role.SIREN
            audioController?.enableAudio()
            socketManager?.register(
                AppConfig(
                    role = Role.SIREN,
                    serverUrl = socketManager?.serverUrl ?: "",
                    zones = emptyList()
                )
            )
            promise.resolve(true)
            Logger.i("Siren mode enabled")
        } catch (e: Exception) {
            promise.reject("SIREN_MODE_ERROR", e.message, e)
        }
    }

    /**
     * Send ACK for an alert
     */
    @ReactMethod
    fun sendAck(alertId: String, workerId: String, promise: Promise) {
        try {
            vibrationController?.stopVibration(alertId)
            socketManager?.sendAck(alertId, workerId)
            promise.resolve(true)
            Logger.i("ACK sent for $alertId by $workerId")
        } catch (e: Exception) {
            promise.reject("ACK_ERROR", e.message, e)
        }
    }

    /**
     * Create alert (from rockfall prediction)
     */
    @ReactMethod
    fun createAlert(zone: String, severity: Int, metadata: ReadableMap?, promise: Promise) {
        try {
            socketManager?.createAlert(zone, severity)
            promise.resolve(Arguments.createMap().apply {
                putString("zone", zone)
                putInt("severity", severity)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            })
            Logger.i("Alert created: zone=$zone, severity=$severity")
        } catch (e: Exception) {
            promise.reject("CREATE_ALERT_ERROR", e.message, e)
        }
    }

    /**
     * Test alarm sound
     */
    @ReactMethod
    fun testAlarm(promise: Promise) {
        try {
            audioController?.playTestAlarm()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("TEST_ALARM_ERROR", e.message, e)
        }
    }

    /**
     * Enable audio (required for siren)
     */
    @ReactMethod
    fun enableAudio(promise: Promise) {
        try {
            audioController?.enableAudio()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ENABLE_AUDIO_ERROR", e.message, e)
        }
    }

    /**
     * Get connection status
     */
    @ReactMethod
    fun getConnectionStatus(promise: Promise) {
        try {
            val isConnected = socketManager?.isConnected() ?: false
            promise.resolve(Arguments.createMap().apply {
                putBoolean("connected", isConnected)
                putString("role", currentRole?.name)
            })
        } catch (e: Exception) {
            promise.reject("STATUS_ERROR", e.message, e)
        }
    }

    /**
     * Cleanup
     */
    @ReactMethod
    fun cleanup(promise: Promise) {
        try {
            vibrationController?.release()
            audioController?.release()
            socketManager?.disconnect()
            promise.resolve(true)
            Logger.i("AlertSystemModule cleanup complete")
        } catch (e: Exception) {
            promise.reject("CLEANUP_ERROR", e.message, e)
        }
    }

    // Internal methods

    private fun handleAlertReceived(alert: Alert) {
        // Trigger vibration if in worker mode
        if (currentRole == Role.BAND) {
            vibrationController?.vibrate(alert.alertId, alert.severity)
        }
        
        // Send event to React Native
        sendEvent("AlertSystem:Alert", Arguments.createMap().apply {
            putString("alertId", alert.alertId)
            putString("zone", alert.zone)
            putInt("severity", alert.severity)
            putDouble("timestamp", alert.timestamp.toDouble())
        })
    }

    private fun sendEvent(eventName: String, params: Any?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in Event Emitter
    }
}
