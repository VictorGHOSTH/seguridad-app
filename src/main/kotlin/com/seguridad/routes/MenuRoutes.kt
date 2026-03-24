package com.seguridad.routes

import com.seguridad.models.MenuModulos
import com.seguridad.models.Menus
import com.seguridad.models.Modulos
import io.ktor.server.application.call
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

@Serializable
data class ModuloResponse(
    val id: Int,
    val strNombreModulo: String
)

@Serializable
data class MenuResponse(
    val id: Int,
    val strNombreMenu: String,
    val modulos: List<ModuloResponse>
)

fun Route.menuRoutes() {
    authenticate("auth-jwt") {
        route("/api/menus") {
            get {
                val menus = transaction {
                    Menus.selectAll().map { menu ->
                        val modulos = MenuModulos.selectAll()
                            .where { MenuModulos.idMenu eq menu[Menus.id] }
                            .mapNotNull { menuModulo ->
                                Modulos.selectAll()
                                    .where { Modulos.id eq menuModulo[MenuModulos.idModulo] }
                                    .singleOrNull()
                                    ?.let {
                                        ModuloResponse(
                                            id = it[Modulos.id],
                                            strNombreModulo = it[Modulos.strNombreModulo]
                                        )
                                    }
                            }

                        MenuResponse(
                            id = menu[Menus.id],
                            strNombreMenu = menu[Menus.strNombreMenu],
                            modulos = modulos
                        )
                    }
                }

                call.respond(menus)
            }
        }
    }
}