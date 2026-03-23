package com.seguridad.utils

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class ApiResponse(
    val success: Boolean,
    val message: String,
    val data: JsonElement? = null
)

@Serializable
data class PaginatedResponse(
    val data: List<JsonElement>,
    val total: Long,
    val page: Int,
    val pageSize: Int,
    val totalPages: Int
)