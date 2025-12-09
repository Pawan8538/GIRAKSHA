package com.alertsystem

import android.os.Build
import android.os.Bundle
import android.os.CountDownTimer
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AlertDialog
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.alertsystem.managers.SocketManager
import com.alertsystem.managers.VibrationController
import com.alertsystem.models.Alert
import com.alertsystem.models.AlertMessage
import com.alertsystem.models.AlertStatus
import com.alertsystem.services.AlertForegroundService
import com.alertsystem.utils.Logger
import com.google.android.material.card.MaterialCardView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class WorkerActivity : AppCompatActivity() {

    private lateinit var socketManager: SocketManager
    private lateinit var vibrationController: VibrationController
    
    private lateinit var tvServer: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvZones: TextView
    private lateinit var tvVibratorWarning: TextView
    private lateinit var alertCard: MaterialCardView
    private lateinit var tvAlertTitle: TextView
    private lateinit var tvAlertSeverity: TextView
    private lateinit var tvAlertId: TextView
    private lateinit var tvCountdown: TextView
    private lateinit var btnAck: View
    private lateinit var rvAlertLog: RecyclerView
    
    private lateinit var serverUrl: String
    private lateinit var zones: List<String>
    private lateinit var workerId: String
    
    private var currentAlert: Alert? = null
    private var countDownTimer: CountDownTimer? = null
    private val alertLog = mutableListOf<Alert>()
    private lateinit var logAdapter: AlertLogAdapter
    
    companion object {
        private const val ACK_TIMEOUT_MS = 15000L // 15 seconds
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_worker)

        // Get intent extras
        serverUrl = intent.getStringExtra("server_url") ?: ""
        zones = intent.getStringArrayExtra("zones")?.toList() ?: emptyList()
        workerId = intent.getStringExtra("worker_id") ?: "unknown"

        initViews()
        setupRecyclerView()
        setupManagers()
        connectToServer()
    }

    private fun initViews() {
        tvServer = findViewById(R.id.tvServer)
        tvStatus = findViewById(R.id.tvStatus)
        tvZones = findViewById(R.id.tvZones)
        tvVibratorWarning = findViewById(R.id.tvVibratorWarning)
        alertCard = findViewById(R.id.alertCard)
        tvAlertTitle = findViewById(R.id.tvAlertTitle)
        tvAlertSeverity = findViewById(R.id.tvAlertSeverity)
        tvAlertId = findViewById(R.id.tvAlertId)
        tvCountdown = findViewById(R.id.tvCountdown)
        btnAck = findViewById(R.id.btnAck)
        rvAlertLog = findViewById(R.id.rvAlertLog)

        tvServer.text = getString(R.string.server_label, serverUrl)
        tvZones.text = getString(R.string.subscribed_zones, zones.joinToString(", "))
        
        btnAck.setOnClickListener { onAckClicked() }
    }

    private fun setupRecyclerView() {
        logAdapter = AlertLogAdapter(alertLog)
        rvAlertLog.apply {
            layoutManager = LinearLayoutManager(this@WorkerActivity)
            adapter = logAdapter
        }
    }

    private fun setupManagers() {
        vibrationController = VibrationController(this)
        
        if (!vibrationController.hasVibrator()) {
            tvVibratorWarning.visibility = View.VISIBLE
            Logger.w("Vibrator not available on this device")
        }

        socketManager = SocketManager(this, serverUrl).apply {
            onConnectionStateChanged = { state ->
                runOnUiThread { updateConnectionStatus(state) }
            }
            onAlertReceived = { alert ->
                runOnUiThread { handleAlertReceived(alert) }
            }
        }
    }

    private fun connectToServer() {
        try {
            updateConnectionStatus(SocketManager.ConnectionState.CONNECTING)
            socketManager.connect()
            
            // Register after a short delay to ensure connection
            btnAck.postDelayed({
                if (socketManager.isConnected()) {
                    socketManager.register(
                        com.alertsystem.models.AppConfig(
                            role = com.alertsystem.models.Role.WORKER,
                            serverUrl = serverUrl,
                            zones = zones,
                            workerId = workerId
                        )
                    )
                    
                    // Start foreground service
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        AlertForegroundService.start(this, serverUrl)
                    }
                }
            }, 1000)
            
        } catch (e: Exception) {
            Logger.e("Failed to connect to server", e)
            showErrorDialog()
        }
    }

    private fun updateConnectionStatus(state: SocketManager.ConnectionState) {
        tvStatus.text = when (state) {
            SocketManager.ConnectionState.CONNECTED -> getString(R.string.status_connected)
            SocketManager.ConnectionState.DISCONNECTED -> getString(R.string.status_disconnected)
            SocketManager.ConnectionState.CONNECTING -> getString(R.string.status_connecting)
            SocketManager.ConnectionState.ERROR -> getString(R.string.status_error)
        }
    }

    private fun handleAlertReceived(alertMessage: AlertMessage) {
        Logger.i("Handling alert: ${alertMessage.alertId}")
        
        // Check if this alert was already processed
        if (alertLog.any { it.alertId == alertMessage.alertId }) {
            Logger.w("Alert ${alertMessage.alertId} already received, ignoring duplicate")
            return
        }
        
        val alert = Alert(
            alertId = alertMessage.alertId,
            zone = alertMessage.zone,
            severity = alertMessage.severity,
            timestamp = alertMessage.timestamp
        )
        
        // Add to log
        alertLog.add(0, alert)
        logAdapter.notifyItemInserted(0)
        
        // Set as current alert and show UI
        currentAlert = alert
        showAlertCard(alert)
        
        // Vibrate
        vibrationController.vibrateForAlert(alert.alertId, alert.severity)
        
        // Start countdown timer
        startAckCountdown(alert)
    }

    private fun showAlertCard(alert: Alert) {
        alertCard.visibility = View.VISIBLE
        tvAlertTitle.text = getString(R.string.alert_card_title, alert.zone)
        tvAlertSeverity.text = getString(R.string.alert_severity, alert.severity)
        tvAlertId.text = getString(R.string.alert_id, alert.alertId)
        
        // Set severity color
        val severityColor = when (alert.severity) {
            1 -> getColor(R.color.severity_1)
            2 -> getColor(R.color.severity_2)
            else -> getColor(R.color.severity_3)
        }
        tvAlertTitle.setTextColor(severityColor)
        tvCountdown.setTextColor(severityColor)
    }

    private fun startAckCountdown(alert: Alert) {
        countDownTimer?.cancel()
        
        countDownTimer = object : CountDownTimer(ACK_TIMEOUT_MS, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val secondsLeft = (millisUntilFinished / 1000).toInt()
                tvCountdown.text = getString(R.string.ack_countdown, secondsLeft)
            }

            override fun onFinish() {
                onAckTimeout(alert)
            }
        }.start()
    }

    private fun onAckClicked() {
        currentAlert?.let { alert ->
            Logger.i("ACK button pressed for alert ${alert.alertId}")
            
            // Send ACK to server
            socketManager.sendAck(alert.alertId, workerId)
            
            // Update alert status
            alert.status = AlertStatus.ACKED
            alert.ackTimestamp = System.currentTimeMillis()
            
            // Stop vibration
            vibrationController.cancelVibration(alert.alertId)
            
            // Cancel countdown
            countDownTimer?.cancel()
            
            // Hide alert card
            alertCard.visibility = View.GONE
            
            // Update log
            updateLogForAlert(alert)
            
            // Clear current alert
            currentAlert = null
            
            Toast.makeText(this, "Alert ACKed", Toast.LENGTH_SHORT).show()
        }
    }

    private fun onAckTimeout(alert: Alert) {
        Logger.w("ACK timeout for alert ${alert.alertId}")
        
        // Update alert status
        alert.status = AlertStatus.ESCALATED
        
        // Stop vibration
        vibrationController.cancelVibration(alert.alertId)
        
        // Hide alert card
        alertCard.visibility = View.GONE
        
        // Update log
        updateLogForAlert(alert)
        
        // Clear current alert
        if (currentAlert?.alertId == alert.alertId) {
            currentAlert = null
        }
        
        Toast.makeText(this, "Alert escalated (no ACK)", Toast.LENGTH_SHORT).show()
    }

    private fun updateLogForAlert(alert: Alert) {
        val index = alertLog.indexOfFirst { it.alertId == alert.alertId }
        if (index >= 0) {
            logAdapter.notifyItemChanged(index)
        }
    }

    private fun showErrorDialog() {
        AlertDialog.Builder(this)
            .setTitle("Connection Failed")
            .setMessage(getString(R.string.error_connection_failed, serverUrl))
            .setPositiveButton("Retry") { _, _ ->
                connectToServer()
            }
            .setNegativeButton("Cancel") { _, _ ->
                finish()
            }
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        countDownTimer?.cancel()
        vibrationController.cancelAll()
        socketManager.disconnect()
        AlertForegroundService.stop(this)
    }

    // RecyclerView Adapter
    private class AlertLogAdapter(
        private val alerts: List<Alert>
    ) : RecyclerView.Adapter<AlertLogAdapter.ViewHolder>() {

        private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvLogZone: TextView = view.findViewById(R.id.tvLogZone)
            val tvLogStatus: TextView = view.findViewById(R.id.tvLogStatus)
            val tvLogAlertId: TextView = view.findViewById(R.id.tvLogAlertId)
            val tvLogTimestamp: TextView = view.findViewById(R.id.tvLogTimestamp)
            val tvLogSeverity: TextView = view.findViewById(R.id.tvLogSeverity)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_alert_log, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val alert = alerts[position]
            
            holder.tvLogZone.text = alert.zone
            holder.tvLogAlertId.text = alert.alertId
            holder.tvLogTimestamp.text = timeFormat.format(Date(alert.timestamp))
            holder.tvLogSeverity.text = "Severity ${alert.severity}"
            
            when (alert.status) {
                AlertStatus.ACTIVE -> {
                    holder.tvLogStatus.text = "Active"
                    holder.tvLogStatus.setTextColor(holder.itemView.context.getColor(R.color.status_connecting))
                }
                AlertStatus.ACKED -> {
                    holder.tvLogStatus.text = holder.itemView.context.getString(R.string.alert_acked)
                    holder.tvLogStatus.setTextColor(holder.itemView.context.getColor(R.color.status_connected))
                }
                AlertStatus.ESCALATED -> {
                    holder.tvLogStatus.text = holder.itemView.context.getString(R.string.alert_escalated)
                    holder.tvLogStatus.setTextColor(holder.itemView.context.getColor(R.color.status_disconnected))
                }
            }
            
            val severityColor = when (alert.severity) {
                1 -> holder.itemView.context.getColor(R.color.severity_1)
                2 -> holder.itemView.context.getColor(R.color.severity_2)
                else -> holder.itemView.context.getColor(R.color.severity_3)
            }
            holder.tvLogSeverity.setTextColor(severityColor)
        }

        override fun getItemCount() = alerts.size
    }
}
