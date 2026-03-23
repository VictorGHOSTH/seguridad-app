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

@Serializable
data class LoginRequest(
    val username: String,
    val password: String,
    val recaptchaToken: String  // ✅ reemplaza captchaResult y expectedResult
)

fun Route.authRoutes(
    jwtService: JwtService,
    captchaService: CaptchaService,
    usuarioDAO: UsuarioDAO
) {
    route("/api/auth") {
        post("/login") {
            val loginRequest = call.receive<LoginRequest>()

            // ✅ Verificar reCAPTCHA de Google
            if (!captchaService.validateRecaptcha(loginRequest.recaptchaToken)) {
                call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "Captcha inválido"))
                return@post
            }

            val usuario = usuarioDAO.authenticateUser(loginRequest.username, loginRequest.password)

            if (usuario != null) {
                val token = jwtService.generateToken(usuario.id, usuario.strNombreUsuario, usuario.idPerfil)
                call.respond(mapOf("token" to token, "usuario" to usuario))
            } else {
                call.respond(HttpStatusCode.Unauthorized, mapOf<String, String>("error" to "Credenciales inválidas o usuario inactivo"))
            }
        }

        get("/verify") {
            val principal = call.principal<JWTPrincipal>()
            if (principal != null) {
                val userId = principal.payload.getClaim("userId")?.asInt()
                if (userId != null) {
                    call.respond(mapOf("valid" to true, "userId" to userId))
                } else {
                    call.respond(HttpStatusCode.Unauthorized, mapOf<String, String>("valid" to "false", "error" to "Token inválido"))
                }
            } else {
                call.respond(HttpStatusCode.Unauthorized, mapOf<String, String>("valid" to "false", "error" to "No autenticado"))
            }
        }
    }
}