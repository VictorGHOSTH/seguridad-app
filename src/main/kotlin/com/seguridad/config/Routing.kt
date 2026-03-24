package com.seguridad.config

import com.seguridad.dao.*
import com.seguridad.routes.*
import com.seguridad.services.CaptchaService
import com.seguridad.services.JwtService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting(
    jwtService: JwtService,
    captchaService: CaptchaService,
    perfilDAO: PerfilDAO,
    usuarioDAO: UsuarioDAO,
    moduloDAO: ModuloDAO,
    permisosPerfilDAO: PermisosPerfilDAO
) {

    install(StatusPages) {
        exception<Throwable> { call, cause ->
            cause.printStackTrace()
            // ✅ Encodear el mensaje para evitar caracteres ilegales en el header
            val message = java.net.URLEncoder.encode(cause.message ?: "Error interno", "UTF-8")
            call.response.headers.append(HttpHeaders.Location, "/error?code=500&message=$message")
            call.respond(HttpStatusCode.Found, "")
        }
        status(HttpStatusCode.NotFound) { call, status ->
            call.respondRedirect("/error?code=404&message=Página no encontrada")
        }
        status(HttpStatusCode.Unauthorized) { call, status ->
            call.response.headers.append(HttpHeaders.Location, "/error?code=401&message=No autorizado")
            call.respond(HttpStatusCode.Found, "")
        }
        status(HttpStatusCode.Forbidden) { call, status ->
            call.response.headers.append(HttpHeaders.Location, "/error?code=403&message=Acceso prohibido")
            call.respond(HttpStatusCode.Found, "")
        }
    }

    routing {
        staticResources("/static", "static")
        //staticResources("/css", "static/css")
        //staticResources("/js", "static/js")
        //staticResources("/uploads", "static/uploads")

        get("/") {
            call.respondRedirect("/login")
        }

        // ✅ Leer templates desde classpath en lugar de File()
        get("/login") {
            val content = Thread.currentThread()
                .contextClassLoader
                .getResourceAsStream("templates/login.html")
                ?.readBytes()
                ?.toString(Charsets.UTF_8)
                ?: "Login no encontrado"
            call.respondText(content, ContentType.Text.Html)
        }

        get("/dashboard") {
            val content = Thread.currentThread()
                .contextClassLoader
                .getResourceAsStream("templates/dashboard.html")
                ?.readBytes()
                ?.toString(Charsets.UTF_8)
                ?: "Dashboard no encontrado"
            call.respondText(content, ContentType.Text.Html)
        }

        get("/error") {
            val content = Thread.currentThread()
                .contextClassLoader
                .getResourceAsStream("templates/error.html")
                ?.readBytes()
                ?.toString(Charsets.UTF_8)
                ?: "Error no encontrado"
            call.respondText(content, ContentType.Text.Html)
        }

        get("/templates/{name}") {
            val name = call.parameters["name"]
            if (name != null) {
                val content = Thread.currentThread()
                    .contextClassLoader
                    .getResourceAsStream("templates/$name")
                    ?.readBytes()
                    ?.toString(Charsets.UTF_8)
                if (content != null) {
                    call.respondText(content, ContentType.Text.Html)
                } else {
                    call.respond(HttpStatusCode.NotFound)
                }
            }
        }

        authRoutes(jwtService, captchaService, usuarioDAO)
        perfilRoutes(perfilDAO)
        usuarioRoutes(usuarioDAO)
        moduloRoutes(moduloDAO)
        permisosPerfilRoutes(permisosPerfilDAO)
        menuRoutes()
    }
}