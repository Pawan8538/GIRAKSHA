package com.alertsystem.models

enum class Role {
    WORKER,
    SIREN,
    DASHBOARD
}

data class AppConfig(
    val role: Role,
    val serverUrl: String,
    val zones: List<String>,
    val workerId: String? = null,
    val audioEnabled: Boolean = false
)
