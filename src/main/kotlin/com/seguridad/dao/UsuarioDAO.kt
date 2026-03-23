package com.seguridad.dao

import com.seguridad.models.Usuario
import com.seguridad.models.Usuarios
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

class UsuarioDAO {

    fun createUsuario(usuario: Usuario, password: String): Int? {
        return transaction {
            val hashedPassword = at.favre.lib.crypto.bcrypt.BCrypt.withDefaults()
                .hashToString(12, password.toCharArray())

            Usuarios.insert {
                it[strNombreUsuario] = usuario.strNombreUsuario
                it[idPerfil] = usuario.idPerfil
                it[strPwd] = hashedPassword
                it[idEstadoUsuario] = usuario.idEstadoUsuario
                it[strCorreo] = usuario.strCorreo
                it[strNumeroCelular] = usuario.strNumeroCelular
                it[strFotoPerfil] = usuario.strFotoPerfil
            } get Usuarios.id
        }
    }

    fun getUsuarioById(id: Int): Usuario? {
        return transaction {
            Usuarios.select { Usuarios.id eq id }
                .map { mapToUsuario(it) }
                .singleOrNull()
        }
    }

    fun getAllUsuarios(page: Int = 1, pageSize: Int = 5): List<Usuario> {
        return transaction {
            val offset = (page - 1) * pageSize
            Usuarios.selectAll()
                .orderBy(Usuarios.id to SortOrder.ASC)
                .limit(pageSize, offset.toLong())
                .map { mapToUsuario(it) }
        }
    }

    fun getTotalCount(): Long {
        return transaction {
            Usuarios.selectAll().count()
        }
    }

    fun updateUsuario(id: Int, usuario: Usuario): Boolean {
        return transaction {
            val updateCount = Usuarios.update({ Usuarios.id eq id }) {
                it[strNombreUsuario] = usuario.strNombreUsuario
                it[idPerfil] = usuario.idPerfil
                it[idEstadoUsuario] = usuario.idEstadoUsuario
                it[strCorreo] = usuario.strCorreo
                it[strNumeroCelular] = usuario.strNumeroCelular
                usuario.strFotoPerfil?.let { foto -> it[strFotoPerfil] = foto }
            }
            updateCount > 0
        }
    }

    fun updatePassword(id: Int, newPassword: String): Boolean {
        return transaction {
            val hashedPassword = at.favre.lib.crypto.bcrypt.BCrypt.withDefaults()
                .hashToString(12, newPassword.toCharArray())

            val updateCount = Usuarios.update({ Usuarios.id eq id }) {
                it[strPwd] = hashedPassword
            }
            updateCount > 0
        }
    }

    fun deleteUsuario(id: Int): Boolean {
        return transaction {
            val deleteCount = Usuarios.deleteWhere { Usuarios.id eq id }
            deleteCount > 0
        }
    }

    fun authenticateUser(username: String, password: String): Usuario? {
        return transaction {
            val usuarioRow = Usuarios.select {
                Usuarios.strNombreUsuario eq username
            }.singleOrNull()

            usuarioRow?.let {
                val storedHash = it[Usuarios.strPwd]
                val bcrypt = at.favre.lib.crypto.bcrypt.BCrypt.verifyer()
                val result = bcrypt.verify(password.toCharArray(), storedHash)

                if (result.verified && it[Usuarios.idEstadoUsuario] == 1) {
                    mapToUsuario(it)
                } else {
                    null
                }
            }
        }
    }

    fun updateFotoPerfil(id: Int, fotoPath: String): Boolean {
        return transaction {
            val updateCount = Usuarios.update({ Usuarios.id eq id }) {
                it[strFotoPerfil] = fotoPath
            }
            updateCount > 0
        }
    }

    private fun mapToUsuario(row: ResultRow): Usuario {
        return Usuario(
            id = row[Usuarios.id],
            strNombreUsuario = row[Usuarios.strNombreUsuario],
            idPerfil = row[Usuarios.idPerfil],
            strPwd = row[Usuarios.strPwd],
            idEstadoUsuario = row[Usuarios.idEstadoUsuario],
            strCorreo = row[Usuarios.strCorreo],
            strNumeroCelular = row[Usuarios.strNumeroCelular],
            strFotoPerfil = row[Usuarios.strFotoPerfil]
        )
    }
}