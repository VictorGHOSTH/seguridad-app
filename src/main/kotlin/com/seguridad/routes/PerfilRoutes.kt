package com.seguridad.routes

import com.seguridad.dao.PerfilDAO
import com.seguridad.models.Perfil
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.perfilRoutes(perfilDAO: PerfilDAO) {
    authenticate("auth-jwt") {
        route("/api/perfiles") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val perfiles = perfilDAO.getAllPerfiles(page)
                val total = perfilDAO.getTotalCount()
                call.respond(mapOf(
                    "data" to perfiles,
                    "total" to total,
                    "page" to page,
                    "pageSize" to 5
                ))
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val perfil = perfilDAO.getPerfilById(id)
                    if (perfil != null) {
                        call.respond(perfil)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Perfil no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val perfil = call.receive<Perfil>()
                    val id = perfilDAO.createPerfil(perfil)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, mapOf("id" to id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error al crear perfil"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Error al procesar la solicitud: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val perfil = call.receive<Perfil>()
                        val updated = perfilDAO.updatePerfil(id, perfil)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Perfil actualizado"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Perfil no encontrado"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Error al procesar la solicitud: ${e.message}"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }

            delete("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val deleted = perfilDAO.deletePerfil(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Perfil eliminado"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Perfil no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }
        }
    }
}