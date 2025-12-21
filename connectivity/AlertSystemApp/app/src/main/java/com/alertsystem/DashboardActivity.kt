package com.alertsystem

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.alertsystem.managers.SocketManager
import com.alertsystem.models.AppConfig
import com.alertsystem.models.LogMessage
import com.alertsystem.models.Role
import com.alertsystem.utils.Logger
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class DashboardActivity : AppCompatActivity() {

    private lateinit var socketManager: SocketManager
    
    private lateinit var tvServer: TextView
    private lateinit var tvStatus: TextView
    private lateinit var rvServerLogs: RecyclerView
    
    private lateinit var serverUrl: String
    private lateinit var zones: List<String>
    
    private val serverLogs = mutableListOf<LogEntry>()
    private lateinit var logAdapter: ServerLogAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        // Get intent extras
        serverUrl = intent.getStringExtra("server_url") ?: ""
        zones = intent.getStringArrayExtra("zones")?.toList() ?: emptyList()

        initViews()
        setupRecyclerView()
        setupSocketManager()
        connectToServer()
    }

    private fun initViews() {
        tvServer = findViewById(R.id.tvServer)
        tvStatus = findViewById(R.id.tvStatus)
        rvServerLogs = findViewById(R.id.rvServerLogs)

        tvServer.text = getString(R.string.server_label, serverUrl)
        
        findViewById<View>(R.id.btnCreateAlert).setOnClickListener { showCreateAlertDialog() }
        findViewById<View>(R.id.btnCreateScenario).setOnClickListener { showCreateScenarioDialog() }
    }

    private fun setupRecyclerView() {
        logAdapter = ServerLogAdapter(serverLogs)
        rvServerLogs.apply {
            layoutManager = LinearLayoutManager(this@DashboardActivity)
            adapter = logAdapter
        }
    }

    private fun setupSocketManager() {
        socketManager = SocketManager(this, serverUrl).apply {
            onConnectionStateChanged = { state ->
                runOnUiThread { updateConnectionStatus(state) }
            }
            onLogReceived = { log ->
                runOnUiThread { handleLogReceived(log) }
            }
        }
    }

    private fun connectToServer() {
        updateConnectionStatus(SocketManager.ConnectionState.CONNECTING)
        socketManager.connect()
        
        // Register after a short delay
        findViewById<View>(R.id.btnCreateAlert).postDelayed({
            if (socketManager.isConnected()) {
                socketManager.register(
                    AppConfig(
                        role = Role.DASHBOARD,
                        serverUrl = serverUrl,
                        zones = zones
                    )
                )
            }
        }, 1000)
    }

    private fun updateConnectionStatus(state: SocketManager.ConnectionState) {
        tvStatus.text = when (state) {
            SocketManager.ConnectionState.CONNECTED -> getString(R.string.status_connected)
            SocketManager.ConnectionState.DISCONNECTED -> getString(R.string.status_disconnected)
            SocketManager.ConnectionState.CONNECTING -> getString(R.string.status_connecting)
            SocketManager.ConnectionState.ERROR -> getString(R.string.status_error)
        }
    }

    private fun handleLogReceived(log: LogMessage) {
        Logger.i("Log received: ${log.type}")
        
        val logEntry = LogEntry(
            type = log.type,
            message = log.data.toString(),
            timestamp = System.currentTimeMillis()
        )
        
        serverLogs.add(0, logEntry)
        logAdapter.notifyItemInserted(0)
        rvServerLogs.scrollToPosition(0)
    }

    private fun showCreateAlertDialog() {
        val dialogView = layoutInflater.inflate(android.R.layout.simple_list_item_1, null)
        val editText = EditText(this).apply {
            hint = getString(R.string.zone_label)
            setText("Unit-3")
        }
        
        AlertDialog.Builder(this)
            .setTitle(R.string.create_alert_dialog_title)
            .setView(editText)
            .setPositiveButton(R.string.create_button) { _, _ ->
                val zone = editText.text.toString().trim()
                if (zone.isNotEmpty()) {
                    socketManager.createAlert(zone)
                    Toast.makeText(this, "Creating alert for $zone", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton(R.string.cancel_button, null)
            .show()
    }

    private fun showCreateScenarioDialog() {
        val dialogView = layoutInflater.inflate(android.R.layout.simple_list_item_2, null)
        val linearLayout = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(50, 20, 50, 20)
        }
        
        val etEpicenter = EditText(this).apply {
            hint = getString(R.string.epicenter_zone_label)
            setText("Unit-3")
        }
        
        val etMagnitude = EditText(this).apply {
            hint = getString(R.string.magnitude_label)
            setText("3.0")
            inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
        }
        
        linearLayout.addView(etEpicenter)
        linearLayout.addView(etMagnitude)
        
        AlertDialog.Builder(this)
            .setTitle(R.string.create_scenario_dialog_title)
            .setView(linearLayout)
            .setPositiveButton(R.string.create_button) { _, _ ->
                val epicenter = etEpicenter.text.toString().trim()
                val magnitudeStr = etMagnitude.text.toString().trim()
                
                if (epicenter.isNotEmpty() && magnitudeStr.isNotEmpty()) {
                    try {
                        val magnitude = magnitudeStr.toDouble()
                        socketManager.createScenario(epicenter, magnitude)
                        Toast.makeText(this, "Creating scenario: $epicenter, mag $magnitude", Toast.LENGTH_SHORT).show()
                    } catch (e: NumberFormatException) {
                        Toast.makeText(this, "Invalid magnitude", Toast.LENGTH_SHORT).show()
                    }
                }
            }
            .setNegativeButton(R.string.cancel_button, null)
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        socketManager.disconnect()
    }

    // Data class for log entries
    data class LogEntry(
        val type: String,
        val message: String,
        val timestamp: Long
    )

    // RecyclerView Adapter
    private class ServerLogAdapter(
        private val logs: List<LogEntry>
    ) : RecyclerView.Adapter<ServerLogAdapter.ViewHolder>() {

        private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

        class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val tvLogZone: TextView = view.findViewById(R.id.tvLogZone)
            val tvLogStatus: TextView = view.findViewById(R.id.tvLogStatus)
            val tvLogAlertId: TextView = view.findViewById(R.id.tvLogAlertId)
            val tvLogTimestamp: TextView = view.findViewById(R.id.tvLogTimestamp)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_alert_log, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val log = logs[position]
            
            holder.tvLogZone.text = log.type.uppercase()
            holder.tvLogStatus.text = "Server Log"
            holder.tvLogAlertId.text = log.message.take(60) + if (log.message.length > 60) "..." else ""
            holder.tvLogTimestamp.text = timeFormat.format(Date(log.timestamp))
        }

        override fun getItemCount() = logs.size
    }
}
