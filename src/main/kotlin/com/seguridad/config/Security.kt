package com.seguridad.config

import com.seguridad.services.JwtService
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*

fun Application.configureSecurity(jwtService: JwtService) {
    authentication {
        jwt("auth-jwt") {
            verifier(jwtService.verifier)
            validate { credential ->
                if (credential.payload.getClaim("userId")?.asInt() != null) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
        }
    }
}