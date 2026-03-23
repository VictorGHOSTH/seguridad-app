package com.seguridad.services

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import com.auth0.jwt.interfaces.JWTVerifier
import java.util.*

class JwtService {
    private val secretKey = System.getenv("JWT_SECRET") ?: "my-secret-key-for-jwt-authentication-2024-seguridad-app"
    private val issuer = "seguridad-app"
    private val expirationTime = 86400000L // 24 horas

    private val algorithm = Algorithm.HMAC256(secretKey)

    val verifier: JWTVerifier = JWT.require(algorithm)
        .withIssuer(issuer)
        .build()

    fun generateToken(userId: Int, username: String, perfilId: Int): String {
        return JWT.create()
            .withSubject(username)
            .withClaim("userId", userId)
            .withClaim("perfilId", perfilId)
            .withIssuer(issuer)
            .withIssuedAt(Date())
            .withExpiresAt(Date(System.currentTimeMillis() + expirationTime))
            .sign(algorithm)
    }

    fun verifyToken(token: String): DecodedJWT? {
        return try {
            verifier.verify(token)
        } catch (e: Exception) {
            null
        }
    }
}