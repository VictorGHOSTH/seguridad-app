package com.seguridad.routes

import com.seguridad.models.MenuModulos
import com.seguridad.models.Menus
import com.seguridad.models.Modulos
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.JoinType
import org.jetbrains.exposed.sql.selectAll

fun Route.menuRoutes() {
    authenticate("auth-jwt") {
        route("/api/menus") {
            get {
                val menus = mutableListOf<Map<String, Any>>()

                Menus.selectAll().forEach { menu ->
                    val modulos = mutableListOf<Map<String, Any>>()

                    val menuModulos = MenuModulos.selectAll()
                        .where { MenuModulos.idMenu eq menu[Menus.id] }

                    menuModulos.forEach { menuModulo ->
                        val modulo = Modulos.selectAll()
                            .where { Modulos.id eq menuModulo[MenuModulos.idModulo] }
                            .singleOrNull()

                        modulo?.let {
                            modulos.add(mapOf(
                                "id" to it[Modulos.id],
                                "strNombreModulo" to it[Modulos.strNombreModulo]
                            ))
                        }
                    }

                    menus.add(mapOf(
                        "id" to menu[Menus.id],
                        "strNombreMenu" to menu[Menus.strNombreMenu],
                        "modulos" to modulos
                    ))
                }

                call.respond(menus)
            }
        }
    }
}