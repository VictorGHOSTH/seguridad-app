package com.seguridad.routes

import com.seguridad.dao.UsuarioDAO
import com.seguridad.models.Usuario
import io.ktor.http.*
import io.ktor.http.content.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.utils.io.core.copyTo
import io.ktor.utils.io.core.readBytes
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.io.File
import java.util.UUID

fun Route.usuarioRoutes(usuarioDAO: UsuarioDAO) {
    authenticate("auth-jwt") {
        route("/api/usuarios") {

            get {
                val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                val usuarios = usuarioDAO.getAllUsuarios(page)
                val total = usuarioDAO.getTotalCount()
                call.respond(
                    PaginatedUsuariosResponse(
                        data = usuarios,
                        total = total.toInt(),
                        page = page,
                        pageSize = 5
                    )
                )
            }

            get("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    val usuario = usuarioDAO.getUsuarioById(id)
                    if (usuario != null) {
                        call.respond(usuario)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Usuario no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }

            post {
                try {
                    val body = call.receiveText()
                    val request = Json.decodeFromString<CreateUsuarioRequest>(body)
                    val usuario = Usuario(
                        strNombreUsuario = request.strNombreUsuario,
                        idPerfil = request.idPerfil,
                        strPwd = "",
                        idEstadoUsuario = request.idEstadoUsuario,
                        strCorreo = request.strCorreo,
                        strNumeroCelular = request.strNumeroCelular
                    )
                    val id = usuarioDAO.createUsuario(usuario, request.password)
                    if (id != null) {
                        call.respond(HttpStatusCode.Created, CreatedResponse(id = id))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error al crear usuario"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Error al procesar la solicitud: ${e.message}"))
                }
            }

            put("/{id}") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val body = call.receiveText()
                        val usuario = Json.decodeFromString<Usuario>(body)
                        val updated = usuarioDAO.updateUsuario(id, usuario)
                        if (updated) {
                            call.respond(HttpStatusCode.OK, mapOf("message" to "Usuario actualizado"))
                        } else {
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Usuario no encontrado"))
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
                    val deleted = usuarioDAO.deleteUsuario(id)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Usuario eliminado"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Usuario no encontrado"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID inválido"))
                }
            }

            post("/{id}/foto") {
                val id = call.parameters["id"]?.toIntOrNull()
                if (id != null) {
                    try {
                        val multipart = call.receiveMultipart()
                        var fotoPath: String? = null

                        multipart.forEachPart { part ->
                            when (part) {
                                is PartData.FileItem -> {
                                    val fileName = "${UUID.randomUUID()}_${part.originalFileName}"
                                    val uploadDir = File("src/main/resources/static/uploads")
                                    if (!uploadDir.exists()) uploadDir.mkdirs()
                                    val file = File(uploadDir, fileName)
                                    file.writeBytes(part.provider().readBytes())
                                    fotoPath = "/uploads/$fileName"
                                }
                                else -> { /* ignorar otras partes */ }
                            }
                            part.dispose()
                        }

                        // ✅ fix: copiar a val inmutable para que Kotlin pueda hacer smart cast
                        val fotoPathFinal = fotoPath
                        if (fotoPathFinal != null) {
                            usuarioDAO.updateFotoPerfil(id, fotoPathFinal)
                            call.respond(FotoResponse(fotoPath = fotoPathFinal))
                        } else {
                            call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "No se subió ninguna imagen"))
                        }
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf<String, String>("error" to "Error al subir la imagen: ${e.message}"))
                    }
                } else {
                    call.respond(HttpStatusCode.BadRequest, mapOf<String, String>("error" to "ID inválido"))
                }
            }
        }
    }
}

@Serializable
data class PaginatedUsuariosResponse(
    val data: List<Usuario>,
    val total: Int,
    val page: Int,
    val pageSize: Int
)

@Serializable
data class CreatedResponse(
    val id: Int
)

@Serializable
data class FotoResponse(
    val fotoPath: String
)

@Serializable
data class CreateUsuarioRequest(
    val strNombreUsuario: String,
    val idPerfil: Int,
    val password: String,
    val idEstadoUsuario: Int,
    val strCorreo: String,
    val strNumeroCelular: String
)