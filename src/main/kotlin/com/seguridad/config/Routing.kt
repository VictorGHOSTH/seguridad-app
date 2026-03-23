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
            call.response.status(HttpStatusCode.Found)
            call.response.header(HttpHeaders.Location, "/error?code=500&message=${cause.message}")
            call.response.header(HttpHeaders.ContentLength, "0")
            call.respondText("", status = HttpStatusCode.Found)
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
        staticResources("/css", "static/css")
        staticResources("/js", "static/js")
        staticResources("/uploads", "static/uploads")

        get("/") {
            call.respondRedirect("/login")
        }

        get("/login") {
            call.respondFile(java.io.File("src/main/resources/templates/login.html"))
        }

        get("/dashboard") {
            call.respondFile(java.io.File("src/main/resources/templates/dashboard.html"))
        }

        get("/error") {
            call.respondFile(java.io.File("src/main/resources/templates/error.html"))
        }

        get("/templates/{name}") {
            val name = call.parameters["name"]
            if (name != null) {
                call.respondFile(java.io.File("src/main/resources/templates/$name"))
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