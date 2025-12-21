package com.alertsystem

import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.View
import android.widget.RadioGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.alertsystem.models.AppConfig
import com.alertsystem.models.Role
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout
import com.google.android.material.switchmaterial.SwitchMaterial

class MainActivity : AppCompatActivity() {

    private lateinit var radioGroupRole: RadioGroup
    private lateinit var etServerIp: TextInputEditText
    private lateinit var etZones: TextInputEditText
    private lateinit var layoutWorkerId: TextInputLayout
    private lateinit var etWorkerId: TextInputEditText
    private lateinit var switchEnableAudio: SwitchMaterial
    private lateinit var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        prefs = getSharedPreferences("alert_system_prefs", MODE_PRIVATE)

        initViews()
        loadSavedConfig()
        setupListeners()
    }

    private fun initViews() {
        radioGroupRole = findViewById(R.id.radioGroupRole)
        etServerIp = findViewById(R.id.etServerIp)
        etZones = findViewById(R.id.etZones)
        layoutWorkerId = findViewById(R.id.layoutWorkerId)
        etWorkerId = findViewById(R.id.etWorkerId)
        switchEnableAudio = findViewById(R.id.switchEnableAudio)
    }

    private fun loadSavedConfig() {
        etServerIp.setText(prefs.getString("server_ip", "192.168.43.1:3000"))
        etZones.setText(prefs.getString("zones", "Unit-1,Unit-2,Unit-3"))
        etWorkerId.setText(prefs.getString("worker_id", "worker1"))
        
        val savedRole = prefs.getString("role", "WORKER")
        when (savedRole) {
            "WORKER" -> radioGroupRole.check(R.id.radioWorker)
            "SIREN" -> radioGroupRole.check(R.id.radioSiren)
            "DASHBOARD" -> radioGroupRole.check(R.id.radioDashboard)
        }
        
        updateConditionalFields()
    }

    private fun setupListeners() {
        radioGroupRole.setOnCheckedChangeListener { _, _ ->
            updateConditionalFields()
        }

        findViewById<View>(R.id.btnHelp).setOnClickListener {
            showHelpDialog()
        }

        findViewById<View>(R.id.btnConnect).setOnClickListener {
            validateAndConnect()
        }
    }

    private fun updateConditionalFields() {
        when (radioGroupRole.checkedRadioButtonId) {
            R.id.radioWorker -> {
                layoutWorkerId.visibility = View.VISIBLE
                switchEnableAudio.visibility = View.GONE
            }
            R.id.radioSiren -> {
                layoutWorkerId.visibility = View.GONE
                switchEnableAudio.visibility = View.VISIBLE
            }
            R.id.radioDashboard -> {
                layoutWorkerId.visibility = View.GONE
                switchEnableAudio.visibility = View.GONE
            }
        }
    }

    private fun showHelpDialog() {
        AlertDialog.Builder(this)
            .setTitle(R.string.help_find_ip)
            .setMessage(R.string.help_find_ip_message)
            .setPositiveButton("OK", null)
            .show()
    }

    private fun validateAndConnect() {
        val serverIp = etServerIp.text.toString().trim()
        val zonesText = etZones.text.toString().trim()
        val workerId = etWorkerId.text.toString().trim()

        // Validate server IP
        if (serverIp.isEmpty() || !serverIp.contains(":")) {
            Toast.makeText(this, R.string.error_invalid_ip, Toast.LENGTH_SHORT).show()
            return
        }

        // Validate zones
        if (zonesText.isEmpty()) {
            Toast.makeText(this, R.string.error_no_zones, Toast.LENGTH_SHORT).show()
            return
        }

        val zones = zonesText.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        if (zones.isEmpty()) {
            Toast.makeText(this, R.string.error_no_zones, Toast.LENGTH_SHORT).show()
            return
        }

        // Get selected role
        val role = when (radioGroupRole.checkedRadioButtonId) {
            R.id.radioWorker -> {
                if (workerId.isEmpty()) {
                    Toast.makeText(this, R.string.error_no_worker_id, Toast.LENGTH_SHORT).show()
                    return
                }
                Role.WORKER
            }
            R.id.radioSiren -> Role.SIREN
            R.id.radioDashboard -> Role.DASHBOARD
            else -> Role.WORKER
        }

        // Save config
        saveConfig(serverIp, zonesText, workerId, role)

        // Create config object
        val config = AppConfig(
            role = role,
            serverUrl = "http://$serverIp",
            zones = zones,
            workerId = if (role == Role.WORKER) workerId else null,
            audioEnabled = switchEnableAudio.isChecked
        )

        // Launch appropriate activity
        launchActivity(config)
    }

    private fun saveConfig(serverIp: String, zones: String, workerId: String, role: Role) {
        prefs.edit().apply {
            putString("server_ip", serverIp)
            putString("zones", zones)
            putString("worker_id", workerId)
            putString("role", role.name)
            apply()
        }
    }

    private fun launchActivity(config: AppConfig) {
        val intent = when (config.role) {
            Role.WORKER -> Intent(this, WorkerActivity::class.java)
            Role.SIREN -> Intent(this, SirenActivity::class.java)
            Role.DASHBOARD -> Intent(this, DashboardActivity::class.java)
        }

        intent.apply {
            putExtra("server_url", config.serverUrl)
            putExtra("zones", config.zones.toTypedArray())
            putExtra("worker_id", config.workerId)
            putExtra("audio_enabled", config.audioEnabled)
        }

        startActivity(intent)
    }
}
