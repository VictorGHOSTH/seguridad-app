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

        get("/") { call.respondRedirect("/login") }

        // ✅ Función helper para evitar repetición
        get("/login")     { respondTemplate(call, "login.html") }
        get("/dashboard") { respondTemplate(call, "dashboard.html") }
        get("/error")     { respondTemplate(call, "error.html") }

        get("/templates/{name}") {
            val name = call.parameters["name"]
            if (name != null) {
                respondTemplate(call, name)
            }
        }

        // ✅ authRoutes ahora recibe perfilDAO y permisosPerfilDAO
        authRoutes(jwtService, captchaService, usuarioDAO, perfilDAO, permisosPerfilDAO)
        perfilRoutes(perfilDAO)
        usuarioRoutes(usuarioDAO)
        moduloRoutes(moduloDAO)
        permisosPerfilRoutes(permisosPerfilDAO)
        menuRoutes()
    }
}

// ✅ Helper para leer templates desde classpath
private suspend fun respondTemplate(
    call: io.ktor.server.application.ApplicationCall,
    templateName: String
) {
    val content = Thread.currentThread()
        .contextClassLoader
        .getResourceAsStream("templates/$templateName")
        ?.readBytes()
        ?.toString(Charsets.UTF_8)

    if (content != null) {
        call.respondText(content, ContentType.Text.Html)
    } else {
        call.respond(HttpStatusCode.NotFound, "Template $templateName no encontrado")
    }
}