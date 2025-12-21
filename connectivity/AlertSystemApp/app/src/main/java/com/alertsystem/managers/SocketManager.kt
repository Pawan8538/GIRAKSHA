package com.alertsystem.managers

import android.content.Context
import android.os.Handler
import android.os.Looper
import com.alertsystem.models.*
import com.alertsystem.utils.Logger
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import java.net.URISyntaxException

class SocketManager(
    private val context: Context,
    private val serverUrl: String
) {
    private var socket: Socket? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    
    // Connection state
    private var reconnectAttempts = 0
    private val maxReconnectDelay = 30000L // 30 seconds
    
    // Callbacks
    var onConnectionStateChanged: ((ConnectionState) -> Unit)? = null
    var onAlertReceived: ((AlertMessage) -> Unit)? = null
    var onSirenReceived: ((SirenMessage) -> Unit)? = null
    var onSirenCancelReceived: ((SirenCancelMessage) -> Unit)? = null
    var onLogReceived: ((LogMessage) -> Unit)? = null
    
    enum class ConnectionState {
        DISCONNECTED,
        CONNECTING,
        CONNECTED,
        ERROR
    }
    
    fun connect() {
        try {
            Logger.i("Connecting to server: $serverUrl")
            updateConnectionState(ConnectionState.CONNECTING)
            
            val options = IO.Options().apply {
                reconnection = true
                reconnectionDelay = 1000
                reconnectionDelayMax = maxReconnectDelay
                timeout = 5000
            }
            
            socket = IO.socket(serverUrl, options).apply {
                on(Socket.EVENT_CONNECT, onConnect)
                on(Socket.EVENT_DISCONNECT, onDisconnect)
                on(Socket.EVENT_CONNECT_ERROR, onConnectError)
                on("alert", onAlert)
                on("siren", onSiren)
                on("sirenCancel", onSirenCancel)
                on("log", onLog)
            }
            
            socket?.connect()
        } catch (e: URISyntaxException) {
            Logger.e("Invalid server URL: $serverUrl", e)
            updateConnectionState(ConnectionState.ERROR)
        }
    }
    
    fun disconnect() {
        Logger.i("Disconnecting from server")
        socket?.disconnect()
        socket?.off()
        socket = null
        updateConnectionState(ConnectionState.DISCONNECTED)
    }
    
    fun register(config: AppConfig) {
        val roleString = when (config.role) {
            Role.WORKER -> "band"
            Role.SIREN -> "siren"
            Role.DASHBOARD -> "dashboard"
        }
        
        val message = RegisterMessage(
            role = roleString,
            zones = config.zones,
            workerId = config.workerId
        )
        
        Logger.i("Registering as $roleString with zones: ${config.zones}")
        socket?.emit("register", message.toJson())
    }
    
    fun sendAck(alertId: String, workerId: String) {
        val message = AckMessage(alertId, workerId)
        Logger.i("Sending ACK for alert: $alertId")
        socket?.emit("ack", message.toJson())
    }
    
    fun createAlert(zone: String, alertId: String? = null) {
        val message = CreateAlertMessage(zone, alertId)
        Logger.i("Creating alert for zone: $zone")
        socket?.emit("createAlert", message.toJson())
    }
    
    fun createScenario(epicenterZone: String, magnitude: Double) {
        val message = CreateScenarioMessage(epicenterZone, magnitude)
        Logger.i("Creating scenario: epicenter=$epicenterZone, magnitude=$magnitude")
        socket?.emit("createScenario", message.toJson())
    }
    
    // Socket event listeners
    private val onConnect = Emitter.Listener {
        Logger.i("Connected to server")
        reconnectAttempts = 0
        updateConnectionState(ConnectionState.CONNECTED)
    }
    
    private val onDisconnect = Emitter.Listener {
        Logger.w("Disconnected from server")
        updateConnectionState(ConnectionState.DISCONNECTED)
    }
    
    private val onConnectError = Emitter.Listener { args ->
        reconnectAttempts++
        val delay = calculateBackoffDelay()
        Logger.e("Connection error (attempt $reconnectAttempts), retrying in ${delay}ms", 
            args.firstOrNull() as? Throwable)
        updateConnectionState(ConnectionState.ERROR)
    }
    
    private val onAlert = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val alert = AlertMessage.fromJson(data)
            Logger.i("Received alert: ${alert.alertId} for zone ${alert.zone}")
            mainHandler.post { onAlertReceived?.invoke(alert) }
        } catch (e: Exception) {
            Logger.e("Error parsing alert message", e)
        }
    }
    
    private val onSiren = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val siren = SirenMessage.fromJson(data)
            Logger.i("Received siren: ${siren.alertId} for zone ${siren.zone}")
            mainHandler.post { onSirenReceived?.invoke(siren) }
        } catch (e: Exception) {
            Logger.e("Error parsing siren message", e)
        }
    }
    
    private val onSirenCancel = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val cancel = SirenCancelMessage.fromJson(data)
            Logger.i("Received siren cancel: ${cancel.alertId}")
            mainHandler.post { onSirenCancelReceived?.invoke(cancel) }
        } catch (e: Exception) {
            Logger.e("Error parsing siren cancel message", e)
        }
    }
    
    private val onLog = Emitter.Listener { args ->
        try {
            val data = args[0] as JSONObject
            val log = LogMessage.fromJson(data)
            Logger.i("Received log: ${log.type}")
            mainHandler.post { onLogReceived?.invoke(log) }
        } catch (e: Exception) {
            Logger.e("Error parsing log message", e)
        }
    }
    
    private fun updateConnectionState(state: ConnectionState) {
        mainHandler.post { onConnectionStateChanged?.invoke(state) }
    }
    
    private fun calculateBackoffDelay(): Long {
        val baseDelay = 1000L
        val delay = baseDelay * (1 shl (reconnectAttempts - 1).coerceAtMost(5))
        return delay.coerceAtMost(maxReconnectDelay)
    }
    
    fun isConnected(): Boolean {
        return socket?.connected() == true
    }
}
