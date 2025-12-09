package com.alertsystem

import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.alertsystem.managers.AudioController
import com.alertsystem.managers.SocketManager
import com.alertsystem.models.AppConfig
import com.alertsystem.models.Role
import com.alertsystem.models.SirenCancelMessage
import com.alertsystem.models.SirenMessage
import com.alertsystem.services.AlertForegroundService
import com.alertsystem.utils.Logger
import com.google.android.material.card.MaterialCardView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SirenActivity : AppCompatActivity() {

    private lateinit var socketManager: SocketManager
    private lateinit var audioController: AudioController
    
    private lateinit var tvServer: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvZones: TextView
    private lateinit var btnEnableAudio: Button
    private lateinit var tvAudioStatus: TextView
    private lateinit var btnTestAlarm: Button
    private lateinit var sirenActiveCard: MaterialCardView
    private lateinit var tvSirenZone: TextView
    private lateinit var tvSirenAlertId: TextView
    private lateinit var tvSirenStarted: TextView
    private lateinit var btnStopSiren: Button
    
    private lateinit var serverUrl: String
    private lateinit var zones: List<String>
    private var audioEnabledByUser = false
    
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_siren)

        // Get intent extras
        serverUrl = intent.getStringExtra("server_url") ?: ""
        zones = intent.getStringArrayExtra("zones")?.toList() ?: emptyList()
        audioEnabledByUser = intent.getBooleanExtra("audio_enabled", false)

        initViews()
        setupManagers()
        connectToServer()
        
        if (audioEnabledByUser) {
            enableAudio()
        }
    }

    private fun initViews() {
        tvServer = findViewById(R.id.tvServer)
        tvStatus = findViewById(R.id.tvStatus)
        tvZones = findViewById(R.id.tvZones)
        btnEnableAudio = findViewById(R.id.btnEnableAudio)
        tvAudioStatus = findViewById(R.id.tvAudioStatus)
        btnTestAlarm = findViewById(R.id.btnTestAlarm)
        sirenActiveCard = findViewById(R.id.sirenActiveCard)
        tvSirenZone = findViewById(R.id.tvSirenZone)
        tvSirenAlertId = findViewById(R.id.tvSirenAlertId)
        tvSirenStarted = findViewById(R.id.tvSirenStarted)
        btnStopSiren = findViewById(R.id.btnStopSiren)

        tvServer.text = getString(R.string.server_label, serverUrl)
        tvZones.text = getString(R.string.subscribed_zones, zones.joinToString(", "))
        
        btnEnableAudio.setOnClickListener { enableAudio() }
        btnTestAlarm.setOnClickListener { testAlarm() }
        btnStopSiren.setOnClickListener { stopSiren() }
    }

    private fun setupManagers() {
        audioController = AudioController(this)

        socketManager = SocketManager(this, serverUrl).apply {
            onConnectionStateChanged = { state ->
                runOnUiThread { updateConnectionStatus(state) }
            }
            onSirenReceived = { siren ->
                runOnUiThread { handleSirenReceived(siren) }
            }
            onSirenCancelReceived = { cancel ->
                runOnUiThread { handleSirenCancel(cancel) }
            }
        }
    }

    private fun connectToServer() {
        updateConnectionStatus(SocketManager.ConnectionState.CONNECTING)
        socketManager.connect()
        
        // Register after a short delay
        btnEnableAudio.postDelayed({
            if (socketManager.isConnected()) {
                socketManager.register(
                    AppConfig(
                        role = Role.SIREN,
                        serverUrl = serverUrl,
                        zones = zones
                    )
                )
                
                // Start foreground service
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    AlertForegroundService.start(this, serverUrl)
                }
            }
        }, 1000)
    }

    private fun enableAudio() {
        audioController.enableAudio()
        audioEnabledByUser = true
        
        tvAudioStatus.text = getString(R.string.audio_enabled)
        tvAudioStatus.setTextColor(getColor(R.color.status_connected))
        btnTestAlarm.isEnabled = true
        
        Toast.makeText(this, "Audio enabled", Toast.LENGTH_SHORT).show()
        Logger.i("Audio enabled by user")
    }

    private fun testAlarm() {
        if (!audioController.isAudioEnabled()) {
            Toast.makeText(this, R.string.audio_not_enabled, Toast.LENGTH_SHORT).show()
            return
        }
        
        audioController.playTestAlarm()
        Toast.makeText(this, "Playing test alarm", Toast.LENGTH_SHORT).show()
    }

    private fun updateConnectionStatus(state: SocketManager.ConnectionState) {
        tvStatus.text = when (state) {
            SocketManager.ConnectionState.CONNECTED -> getString(R.string.status_connected)
            SocketManager.ConnectionState.DISCONNECTED -> getString(R.string.status_disconnected)
            SocketManager.ConnectionState.CONNECTING -> getString(R.string.status_connecting)
            SocketManager.ConnectionState.ERROR -> getString(R.string.status_error)
        }
    }

    private fun handleSirenReceived(siren: SirenMessage) {
        Logger.i("Siren received: ${siren.alertId} for zone ${siren.zone}")
        
        // Show active siren card
        sirenActiveCard.visibility = View.VISIBLE
        tvSirenZone.text = getString(R.string.siren_zone, siren.zone)
        tvSirenAlertId.text = getString(R.string.alert_id, siren.alertId)
        tvSirenStarted.text = getString(R.string.siren_started_at, timeFormat.format(Date()))
        
        // Start alarm audio
        if (audioController.isAudioEnabled()) {
            audioController.startSiren(siren.alertId)
            Toast.makeText(this, "SIREN ACTIVE: ${siren.zone}", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(this, "SIREN: Audio not enabled!", Toast.LENGTH_LONG).show()
        }
    }

    private fun handleSirenCancel(cancel: SirenCancelMessage) {
        Logger.i("Siren cancel received: ${cancel.alertId}")
        
        // Stop audio
        audioController.stopSiren(cancel.alertId)
        
        // Hide siren card if it matches
        if (audioController.getCurrentAlertId() == null) {
            sirenActiveCard.visibility = View.GONE
        }
        
        Toast.makeText(this, "Siren cancelled", Toast.LENGTH_SHORT).show()
    }

    private fun stopSiren() {
        // Manual stop
        audioController.stopSiren()
        sirenActiveCard.visibility = View.GONE
        Toast.makeText(this, "Siren stopped manually", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        audioController.release()
        socketManager.disconnect()
        AlertForegroundService.stop(this)
    }
}
