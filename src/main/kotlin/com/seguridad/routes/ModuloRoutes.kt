package com.seguridad.routes

import com.seguridad.dao.ModuloDAO
import com.seguridad.models.Modulo
import io.ktor.http.*
import io.ktor.server.application.call
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable

@Serializable
data class PaginatedModulosResponse(
    val data: List<Modulo>,
    val total: Int,
    val page: Int,
    val pageSize: Int
)

@Serializable
data class CreatedModuloResponse(val id: Int)

fun Route.moduloRoutes(moduloDAO: ModuloDAO) {
    authenticate("auth-jwt") {
        route("/api/modulos") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val modulos = moduloDAO.getAllModulos(page)
                val total = moduloDAO.getTotalCount()
                call.respond(PaginatedModulosResponse(
                    data = modulos,
                    total = total.toInt(),
                    page = page,
                    pageSize = 5
                ))
            }

            // ✅ /all debe ir ANTES de /{id}
            get("/all") {
                val modulos = moduloDAO.getAllModulosList()
                call.respond(modulos)
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val modulo = moduloDAO.getModuloById(id)
                    if (modulo != null) {
                        call.respond(modulo)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Módulo no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val modulo = call.receive<Modulo>()
                    val id = moduloDAO.createModulo(modulo)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, CreatedModuloResponse(id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf<String, String>("error" to "Error al crear módulo"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "Error: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val modulo = call.receive<Modulo>()
                        val updated = moduloDAO.updateModulo(id, modulo)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf<String, String>("message" to "Módulo actualizado"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Módulo no encontrado"))
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
                    val deleted = moduloDAO.deleteModulo(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf<String, String>("message" to "Módulo eliminado"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf<String, String>("error" to "Módulo no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }
        }
    }
}