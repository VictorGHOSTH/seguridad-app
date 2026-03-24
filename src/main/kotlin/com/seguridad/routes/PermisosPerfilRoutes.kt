package com.seguridad.routes

import com.seguridad.dao.PermisosPerfilDAO
import com.seguridad.models.PermisosPerfil
import io.ktor.http.*
import io.ktor.server.application.call
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class PaginatedPermisosResponse(
    val data: List<PermisosPerfil>,
    val total: Int,
    val page: Int,
    val pageSize: Int
)

@Serializable
data class CreatedPermisosResponse(val id: Int)

fun Route.permisosPerfilRoutes(permisosPerfilDAO: PermisosPerfilDAO) {
    authenticate("auth-jwt") {
        route("/api/permisos-perfil") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val permisos = permisosPerfilDAO.getAllPermisos(page)
                val total = permisosPerfilDAO.getTotalCount()
                call.respond(PaginatedPermisosResponse(
                    data = permisos,
                    total = total.toInt(),
                    page = page,
                    pageSize = 5
                ))
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val permisos = permisosPerfilDAO.getPermisosById(id)
                    if (permisos != null) {
                        call.respond(permisos)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Permisos no encontrados"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val permisos = call.receive<PermisosPerfil>()
                    val id = permisosPerfilDAO.createPermisos(permisos)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, CreatedPermisosResponse(id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf<String, String>("error" to "Error al crear permisos"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "Error: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val permisos = call.receive<PermisosPerfil>()
                        val updated = permisosPerfilDAO.updatePermisos(id, permisos)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf<String, String>("message" to "Permisos actualizados"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Permisos no encontrados"))
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
                    val deleted = permisosPerfilDAO.deletePermisos(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf<String, String>("message" to "Permisos eliminados"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Permisos no encontrados"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }
        }
    }
}