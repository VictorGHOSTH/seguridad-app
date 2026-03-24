package com.seguridad.routes

import com.seguridad.dao.PerfilDAO
import com.seguridad.dao.PermisosPerfilDAO
import com.seguridad.dao.UsuarioDAO
import com.seguridad.models.PermisoConModulo
import com.seguridad.models.Usuario
import com.seguridad.services.CaptchaService
import com.seguridad.services.JwtService
import io.ktor.http.*
import io.ktor.server.application.call
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
    val recaptchaToken: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val usuario: Usuario,
    val esAdministrador: Boolean,
    val permisos: List<PermisoConModulo>
)

// ✅ data class para /verify — evita mapOf con tipos mixtos
@Serializable
data class VerifyResponse(
    val valid: Boolean,
    val userId: Int
)

fun Route.authRoutes(
    jwtService: JwtService,
    captchaService: CaptchaService,
    usuarioDAO: UsuarioDAO,
    perfilDAO: PerfilDAO,
    permisosPerfilDAO: PermisosPerfilDAO
) {
    route("/api/auth") {
        post("/login") {
            val loginRequest = call.receive<LoginRequest>()

            if (!captchaService.validateRecaptcha(loginRequest.recaptchaToken)) {
                call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "Captcha inválido"))
                return@post
            }

            val usuario = usuarioDAO.authenticateUser(loginRequest.username, loginRequest.password)

            if (usuario != null) {
                val perfil = perfilDAO.getPerfilById(usuario.idPerfil)
                val esAdministrador = perfil?.bitAdministrador ?: false

                val permisos = if (esAdministrador) {
                    permisosPerfilDAO.getAllModulosComoPermisos()
                } else {
                    permisosPerfilDAO.getPermisosByPerfilConModulo(usuario.idPerfil)
                }

                val token = jwtService.generateToken(
                    usuario.id,
                    usuario.strNombreUsuario,
                    usuario.idPerfil,
                    esAdministrador
                )

                call.respond(LoginResponse(
                    token = token,
                    usuario = usuario,
                    esAdministrador = esAdministrador,
                    permisos = permisos
                ))
            } else {
                call.respond(
                    HttpStatusCode.Unauthorized,
                    mapOf<String, String>("error" to "Credenciales inválidas o usuario inactivo")
                )
            }
        }

        get("/verify") {
            val principal = call.principal<JWTPrincipal>()
            if (principal != null) {
                val userId = principal.payload.getClaim("userId")?.asInt()
                if (userId != null) {
                    // ✅ data class en lugar de mapOf con tipos mixtos
                    call.respond(VerifyResponse(valid = true, userId = userId))
                } else {
                    call.respond(
                        HttpStatusCode.Unauthorized,
                        mapOf<String, String>("error" to "Token inválido")
                    )
                }
            } else {
                call.respond(
                    HttpStatusCode.Unauthorized,
                    mapOf<String, String>("error" to "No autenticado")
                )
            }
        }
    }
}