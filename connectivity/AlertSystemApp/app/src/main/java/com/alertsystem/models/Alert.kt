package com.alertsystem.models

enum class AlertStatus {
    ACTIVE,
    ACKED,
    ESCALATED
}

data class Alert(
    val alertId: String,
    val zone: String,
    val severity: Int = 1,
    val timestamp: Long = System.currentTimeMillis(),
    var ackTimestamp: Long? = null,
    var status: AlertStatus = AlertStatus.ACTIVE
)
