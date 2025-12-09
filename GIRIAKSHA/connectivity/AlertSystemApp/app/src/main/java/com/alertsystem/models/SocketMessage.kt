package com.alertsystem.models

import org.json.JSONArray
import org.json.JSONObject

// Socket Message Models matching the exact API specification

data class RegisterMessage(
    val role: String,
    val zones: List<String>,
    val workerId: String? = null
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("role", role)
            put("zones", JSONArray(zones))
            workerId?.let { put("workerId", it) }
        }
    }
}

data class AlertMessage(
    val alertId: String,
    val zone: String,
    val severity: Int = 1,
    val timestamp: Long = System.currentTimeMillis()
) {
    companion object {
        fun fromJson(json: JSONObject): AlertMessage {
            return AlertMessage(
                alertId = json.getString("alertId"),
                zone = json.getString("zone"),
                severity = json.optInt("severity", 1),
                timestamp = json.optLong("timestamp", System.currentTimeMillis())
            )
        }
    }
}

data class AckMessage(
    val alertId: String,
    val workerId: String
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("alertId", alertId)
            put("workerId", workerId)
        }
    }
}

data class SirenMessage(
    val alertId: String,
    val zone: String,
    val severity: Int = 1
) {
    companion object {
        fun fromJson(json: JSONObject): SirenMessage {
            return SirenMessage(
                alertId = json.getString("alertId"),
                zone = json.getString("zone"),
                severity = json.optInt("severity", 1)
            )
        }
    }
}

data class SirenCancelMessage(
    val alertId: String
) {
    companion object {
        fun fromJson(json: JSONObject): SirenCancelMessage {
            return SirenCancelMessage(
                alertId = json.getString("alertId")
            )
        }
    }
}

data class CreateAlertMessage(
    val zone: String,
    val alertId: String? = null
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("zone", zone)
            alertId?.let { put("alertId", it) }
        }
    }
}

data class CreateScenarioMessage(
    val epicenterZone: String,
    val magnitude: Double
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("epicenterZone", epicenterZone)
            put("magnitude", magnitude)
        }
    }
}

data class LogMessage(
    val type: String,
    val data: JSONObject
) {
    companion object {
        fun fromJson(json: JSONObject): LogMessage {
            return LogMessage(
                type = json.optString("type", "unknown"),
                data = json
            )
        }
    }
}
