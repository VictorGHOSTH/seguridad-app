package com.seguridad.routes

import com.seguridad.dao.PerfilDAO
import com.seguridad.models.Perfil
import io.ktor.http.*
import io.ktor.server.application.call
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class PaginatedPerfilesResponse(
    val data: List<Perfil>,
    val total: Int,
    val page: Int,
    val pageSize: Int
)

@Serializable
data class CreatedPerfilResponse(val id: Int)

fun Route.perfilRoutes(perfilDAO: PerfilDAO) {
    authenticate("auth-jwt") {
        route("/api/perfiles") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val perfiles = perfilDAO.getAllPerfiles(page)
                val total = perfilDAO.getTotalCount()
                call.respond(PaginatedPerfilesResponse(
                    data = perfiles,
                    total = total.toInt(),
                    page = page,
                    pageSize = 5
                ))
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val perfil = perfilDAO.getPerfilById(id)
                    if (perfil != null) {
                        call.respond(perfil)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Perfil no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val perfil = call.receive<Perfil>()
                    val id = perfilDAO.createPerfil(perfil)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, CreatedPerfilResponse(id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf<String, String>("error" to "Error al crear perfil"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "Error: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val perfil = call.receive<Perfil>()
                        val updated = perfilDAO.updatePerfil(id, perfil)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf<String, String>("message" to "Perfil actualizado"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Perfil no encontrado"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "Error: ${e.message}"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val deleted = perfilDAO.deletePerfil(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf<String, String>("message" to "Perfil eliminado"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Perfil no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }
        }
    }
}