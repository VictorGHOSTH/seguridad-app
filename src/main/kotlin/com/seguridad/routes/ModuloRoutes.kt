package com.seguridad.routes

import com.seguridad.dao.ModuloDAO
import com.seguridad.models.Modulo
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Route.moduloRoutes(moduloDAO: ModuloDAO) {
    authenticate("auth-jwt") {
        route("/api/modulos") {
            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val modulos = moduloDAO.getAllModulos(page)
                val total = moduloDAO.getTotalCount()
                call.respond(mapOf(
                    "data" to modulos,
                    "total" to total,
                    "page" to page,
                    "pageSize" to 5
                ))
            }

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
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Módulo no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val modulo = call.receive<Modulo>()
                    val id = moduloDAO.createModulo(modulo)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, mapOf("id" to id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error al crear módulo"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Error al procesar la solicitud: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val modulo = call.receive<Modulo>()
                        val updated = moduloDAO.updateModulo(id, modulo)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Módulo actualizado"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Módulo no encontrado"))
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
                    val deleted = moduloDAO.deleteModulo(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Módulo eliminado"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Módulo no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }
        }
    }
}