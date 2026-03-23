package com.seguridad.services

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonPrimitive
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

class CaptchaService {
    private val secretKey = System.getenv("RECAPTCHA_SECRET")
        ?: "6Lcj3ossAAAAAAFK0hIW8FrgfTQfeivriiYQUUEq"

    fun validateRecaptcha(token: String): Boolean {
        return try {
            val url = URL("https://www.google.com/recaptcha/api/siteverify")
            val connection = url.openConnection() as HttpURLConnection
            connection.requestMethod = "POST"
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")

            val params = "secret=${URLEncoder.encode(secretKey, "UTF-8")}" +
                    "&response=${URLEncoder.encode(token, "UTF-8")}"

            connection.outputStream.use { it.write(params.toByteArray()) }

            val response = connection.inputStream.bufferedReader().readText()
            val json = Json.parseToJsonElement(response).jsonObject
            json["success"]?.jsonPrimitive?.boolean ?: false
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
}