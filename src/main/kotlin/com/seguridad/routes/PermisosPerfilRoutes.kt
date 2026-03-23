package com.seguridad.routes

import com.seguridad.dao.PermisosPerfilDAO
import com.seguridad.models.PermisosPerfil
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.permisosPerfilRoutes(permisosPerfilDAO: PermisosPerfilDAO) {
    authenticate("auth-jwt") {
        route("/api/permisos-perfil") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val permisos = permisosPerfilDAO.getAllPermisos(page)
                val total = permisosPerfilDAO.getTotalCount()
                call.respond(mapOf(
                    "data" to permisos,
                    "total" to total,
                    "page" to page,
                    "pageSize" to 5
                ))
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val permisos = permisosPerfilDAO.getPermisosById(id)
                    if (permisos != null) {
                        call.respond(permisos)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Permisos no encontrados"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val permisos = call.receive<PermisosPerfil>()
                    val id = permisosPerfilDAO.createPermisos(permisos)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, mapOf("id" to id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error al crear permisos"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Error al procesar la solicitud: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val permisos = call.receive<PermisosPerfil>()
                        val updated = permisosPerfilDAO.updatePermisos(id, permisos)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Permisos actualizados"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Permisos no encontrados"))
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
                    val deleted = permisosPerfilDAO.deletePermisos(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Permisos eliminados"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Permisos no encontrados"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }
        }
    }
}