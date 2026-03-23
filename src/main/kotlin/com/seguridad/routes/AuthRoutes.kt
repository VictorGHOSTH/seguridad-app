package com.seguridad.routes

import com.seguridad.dao.UsuarioDAO
import com.seguridad.services.CaptchaService
import com.seguridad.services.JwtService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

fun Route.authRoutes(
    jwtService: JwtService,
    captchaService: CaptchaService,
    usuarioDAO: UsuarioDAO
) {
    route("/api/auth") {
        post("/login") {
            val loginRequest = call.receive<LoginRequest>()

            if (!captchaService.validateCaptcha(loginRequest.captchaResult, loginRequest.expectedResult)) {
                call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Captcha incorrecto"))
                return@post
            }

            val usuario = usuarioDAO.authenticateUser(loginRequest.username, loginRequest.password)

            if (usuario != null) {
                val token = jwtService.generateToken(usuario.id, usuario.strNombreUsuario, usuario.idPerfil)
                call.respond(mapOf("token" to token, "usuario" to usuario))
            } else {
                call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Credenciales inválidas o usuario inactivo"))
            }
        }

        get("/captcha") {
            val captcha = captchaService.generateCaptcha()
            call.respond(captcha)
        }

        get("/verify") {
            val principal = call.principal<JWTPrincipal>()
            if (principal != null) {
                val userId = principal.payload.getClaim("userId")?.asInt()
                if (userId != null) {
                    call.respond(mapOf("valid" to true, "userId" to userId))
                } else {
                    call.respond(HttpStatusCode.Unauthorized, mapOf("valid" to false, "error" to "Token inválido"))
                }
            } else {
                call.respond(HttpStatusCode.Unauthorized, mapOf("valid" to false, "error" to "No autenticado"))
            }
        }
    }
}

@Serializable
data class LoginRequest(
    val username: String,
    val password: String,
    val captchaResult: Int,
    val expectedResult: Int
)