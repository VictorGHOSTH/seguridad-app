package com.seguridad.services

import kotlin.random.Random

class CaptchaService {
    fun generateCaptcha(): CaptchaData {
        val num1 = Random.nextInt(1, 10)
        val num2 = Random.nextInt(1, 10)
        val result = num1 + num2
        return CaptchaData("$num1 + $num2", result)
    }

    fun validateCaptcha(captchaResult: Int, expectedResult: Int): Boolean {
        return captchaResult == expectedResult
    }
}

data class CaptchaData(
    val question: String,
    val result: Int
)