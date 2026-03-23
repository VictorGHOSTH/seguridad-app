package com.seguridad.models

import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.Table

@Serializable
data class Perfil(
    val id: Int = 0,
    val strNombrePerfil: String,
    val bitAdministrador: Boolean
)

@Serializable
data class Usuario(
    val id: Int = 0,
    val strNombreUsuario: String,
    val idPerfil: Int,
    val strPwd: String = "",
    val idEstadoUsuario: Int,
    val strCorreo: String,
    val strNumeroCelular: String,
    val strFotoPerfil: String? = null
)

@Serializable
data class Modulo(
    val id: Int = 0,
    val strNombreModulo: String
)

@Serializable
data class PermisosPerfil(
    val id: Int = 0,
    val idModulo: Int,
    val idPerfil: Int,
    val bitAgregar: Boolean,
    val bitEditar: Boolean,
    val bitConsulta: Boolean,
    val bitEliminar: Boolean,
    val bitDetalle: Boolean
)

@Serializable
data class Menu(
    val id: Int,
    val strNombreMenu: String
)

@Serializable
data class MenuModulo(
    val idMenu: Int,
    val idModulo: Int
)

// Tablas de la base de datos
object Perfiles : Table("perfiles") {
    val id = integer("id").autoIncrement()
    val strNombrePerfil = varchar("str_nombre_perfil", 100)
    val bitAdministrador = bool("bit_administrador")

    override val primaryKey = PrimaryKey(id)
}

object Usuarios : Table("usuarios") {
    val id = integer("id").autoIncrement()
    val strNombreUsuario = varchar("str_nombre_usuario", 100)
    val idPerfil = integer("id_perfil")
    val strPwd = varchar("str_pwd", 255)
    val idEstadoUsuario = integer("id_estado_usuario")
    val strCorreo = varchar("str_correo", 150)
    val strNumeroCelular = varchar("str_numero_celular", 20)
    val strFotoPerfil = varchar("str_foto_perfil", 255).nullable()

    override val primaryKey = PrimaryKey(id)
}

object Modulos : Table("modulos") {
    val id = integer("id").autoIncrement()
    val strNombreModulo = varchar("str_nombre_modulo", 100)

    override val primaryKey = PrimaryKey(id)
}

object PermisosPerfiles : Table("permisos_perfiles") {
    val id = integer("id").autoIncrement()
    val idModulo = integer("id_modulo")
    val idPerfil = integer("id_perfil")
    val bitAgregar = bool("bit_agregar")
    val bitEditar = bool("bit_editar")
    val bitConsulta = bool("bit_consulta")
    val bitEliminar = bool("bit_eliminar")
    val bitDetalle = bool("bit_detalle")

    override val primaryKey = PrimaryKey(id)
}

object Menus : Table("menus") {
    val id = integer("id").autoIncrement()
    val strNombreMenu = varchar("str_nombre_menu", 100)

    override val primaryKey = PrimaryKey(id)
}

object MenuModulos : Table("menu_modulos") {
    val id = integer("id").autoIncrement()
    val idMenu = integer("id_menu")
    val idModulo = integer("id_modulo")

    override val primaryKey = PrimaryKey(id)
}