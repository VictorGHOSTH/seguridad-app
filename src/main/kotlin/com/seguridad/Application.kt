package com.seguridad

import com.seguridad.config.configureDatabase
import com.seguridad.config.configureRouting
import com.seguridad.config.configureSecurity
import com.seguridad.config.configureSerialization
import com.seguridad.dao.*
import com.seguridad.models.*
import com.seguridad.services.CaptchaService
import com.seguridad.services.JwtService
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.insertAndGetId
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction

fun main() {
    embeddedServer(Netty, port = 8080, host = "0.0.0.0", module = Application::module)
        .start(wait = true)
}

fun Application.module() {
    val database = configureDatabase()

    transaction(database) {
        try {
            SchemaUtils.create(
                Perfiles,
                Usuarios,
                Modulos,
                PermisosPerfiles,
                Menus,
                MenuModulos
            )
        } catch (e: Exception) {
            println("Tablas ya existen o error: ${e.message}")
        }

        insertInitialData()
    }

    val jwtService = JwtService()
    val captchaService = CaptchaService()
    val perfilDAO = PerfilDAO()
    val usuarioDAO = UsuarioDAO()
    val moduloDAO = ModuloDAO()
    val permisosPerfilDAO = PermisosPerfilDAO()

    configureSerialization()
    configureSecurity(jwtService)
    configureRouting(
        jwtService,
        captchaService,
        perfilDAO,
        usuarioDAO,
        moduloDAO,
        permisosPerfilDAO
    )
}

fun insertInitialData() {
    // Insertar perfiles iniciales
    if (Perfiles.selectAll().empty()) {
        Perfiles.insert {
            it[Perfiles.strNombrePerfil] = "Administrador"
            it[Perfiles.bitAdministrador] = true
        }
        Perfiles.insert {
            it[Perfiles.strNombrePerfil] = "Usuario Normal"
            it[Perfiles.bitAdministrador] = false
        }
    }

    // Insertar usuario administrador
    if (Usuarios.selectAll().empty()) {
        val adminPerfil = Perfiles.selectAll()
            .where { Perfiles.strNombrePerfil eq "Administrador" }
            .firstOrNull()

        adminPerfil?.let {
            Usuarios.insert {
                it[Usuarios.strNombreUsuario] = "admin"
                it[Usuarios.idPerfil] = adminPerfil[Perfiles.id]
                it[Usuarios.strPwd] = at.favre.lib.crypto.bcrypt.BCrypt.withDefaults()
                    .hashToString(12, "Admin123".toCharArray())
                it[Usuarios.idEstadoUsuario] = 1
                it[Usuarios.strCorreo] = "admin@seguridad.com"
                it[Usuarios.strNumeroCelular] = "1234567890"
            }
        }
    }

    // Insertar módulos iniciales
    val modulosIniciales = listOf(
        "Perfil", "Módulo", "Permisos-Perfil", "Usuario",
        "Principal 1.1", "Principal 1.2", "Principal 2.1", "Principal 2.2"
    )

    modulosIniciales.forEach { nombreModulo ->
        if (Modulos.selectAll().where { Modulos.strNombreModulo eq nombreModulo }.empty()) {
            Modulos.insert {
                it[Modulos.strNombreModulo] = nombreModulo
            }
        }
    }

    // Insertar menús y enlaces
    if (Menus.selectAll().empty()) {
        val seguridadMenu = Menus.insert {
            it[Menus.strNombreMenu] = "Seguridad"
        } get Menus.id

        val principal1Menu = Menus.insert {
            it[Menus.strNombreMenu] = "Principal 1"
        } get Menus.id

        val principal2Menu = Menus.insert {
            it[Menus.strNombreMenu] = "Principal 2"
        } get Menus.id

        // Enlazar módulos con menús - Seguridad
        val modulosSeguridad = listOf("Perfil", "Módulo", "Permisos-Perfil", "Usuario")
        modulosSeguridad.forEach { nombreModulo ->
            val modulo = Modulos.selectAll()
                .where { Modulos.strNombreModulo eq nombreModulo }
                .firstOrNull()

            modulo?.let {
                MenuModulos.insert {
                    it[MenuModulos.idMenu] = seguridadMenu
                    it[MenuModulos.idModulo] = modulo[Modulos.id]
                }
            }
        }

        // Enlazar módulos Principal 1
        val modulosPrincipal1 = listOf("Principal 1.1", "Principal 1.2")
        modulosPrincipal1.forEach { nombreModulo ->
            val modulo = Modulos.selectAll()
                .where { Modulos.strNombreModulo eq nombreModulo }
                .firstOrNull()

            modulo?.let {
                MenuModulos.insert {
                    it[MenuModulos.idMenu] = principal1Menu
                    it[MenuModulos.idModulo] = modulo[Modulos.id]
                }
            }
        }

        // Enlazar módulos Principal 2
        val modulosPrincipal2 = listOf("Principal 2.1", "Principal 2.2")
        modulosPrincipal2.forEach { nombreModulo ->
            val modulo = Modulos.selectAll()
                .where { Modulos.strNombreModulo eq nombreModulo }
                .firstOrNull()

            modulo?.let {
                MenuModulos.insert {
                    it[MenuModulos.idMenu] = principal2Menu
                    it[MenuModulos.idModulo] = modulo[Modulos.id]
                }
            }
        }
    }
}