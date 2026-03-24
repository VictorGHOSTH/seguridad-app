package com.seguridad.dao

import com.seguridad.models.PermisosPerfil
import com.seguridad.models.PermisosPerfiles
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

class PermisosPerfilDAO {

    fun createPermisos(permisos: PermisosPerfil): Int? {
        return transaction {
            PermisosPerfiles.insert {
                it[idModulo] = permisos.idModulo
                it[idPerfil] = permisos.idPerfil
                it[bitAgregar] = permisos.bitAgregar
                it[bitEditar] = permisos.bitEditar
                it[bitConsulta] = permisos.bitConsulta
                it[bitEliminar] = permisos.bitEliminar
                it[bitDetalle] = permisos.bitDetalle
            } get PermisosPerfiles.id
        }
    }

    fun getPermisosById(id: Int): PermisosPerfil? {
        return transaction {
            PermisosPerfiles.selectAll().where { PermisosPerfiles.id eq id }
                .map { mapToPermisos(it) }
                .singleOrNull()
        }
    }

    fun getAllPermisos(page: Int = 1, pageSize: Int = 5): List<PermisosPerfil> {
        return transaction {
            val offset = (page - 1) * pageSize
            PermisosPerfiles.selectAll()
                .orderBy(PermisosPerfiles.id to SortOrder.ASC)
                .limit(pageSize, offset.toLong())
                .map { mapToPermisos(it) }
        }
    }

    fun getTotalCount(): Long {
        return transaction {
            PermisosPerfiles.selectAll().count()
        }
    }

    fun updatePermisos(id: Int, permisos: PermisosPerfil): Boolean {
        return transaction {
            val updateCount = PermisosPerfiles.update({ PermisosPerfiles.id eq id }) {
                it[idModulo] = permisos.idModulo
                it[idPerfil] = permisos.idPerfil
                it[bitAgregar] = permisos.bitAgregar
                it[bitEditar] = permisos.bitEditar
                it[bitConsulta] = permisos.bitConsulta
                it[bitEliminar] = permisos.bitEliminar
                it[bitDetalle] = permisos.bitDetalle
            }
            updateCount > 0
        }
    }

    fun deletePermisos(id: Int): Boolean {
        return transaction {
            val deleteCount = PermisosPerfiles.deleteWhere { PermisosPerfiles.id eq id }
            deleteCount > 0
        }
    }

    fun getPermisosByPerfil(perfilId: Int): List<PermisosPerfil> {
        return transaction {
            PermisosPerfiles.selectAll().where { PermisosPerfiles.idPerfil eq perfilId }
                .map { mapToPermisos(it) }
        }
    }

    fun getAllModulosComoPermisos(): List<PermisoConModulo> {
        return transaction {
            Modulos.selectAll().map { row ->
                PermisoConModulo(
                    idModulo = row[Modulos.id],
                    strNombreModulo = row[Modulos.strNombreModulo],
                    bitAgregar = true,
                    bitEditar = true,
                    bitConsulta = true,
                    bitEliminar = true,
                    bitDetalle = true
                )
            }
        }
    }

    private fun mapToPermisos(row: ResultRow): PermisosPerfil {
        return PermisosPerfil(
            id = row[PermisosPerfiles.id],
            idModulo = row[PermisosPerfiles.idModulo],
            idPerfil = row[PermisosPerfiles.idPerfil],
            bitAgregar = row[PermisosPerfiles.bitAgregar],
            bitEditar = row[PermisosPerfiles.bitEditar],
            bitConsulta = row[PermisosPerfiles.bitConsulta],
            bitEliminar = row[PermisosPerfiles.bitEliminar],
            bitDetalle = row[PermisosPerfiles.bitDetalle]
        )
    }

    fun getPermisosByPerfilConModulo(perfilId: Int): List<PermisoConModulo> {
        return transaction {
            PermisosPerfiles.selectAll()
                .where { PermisosPerfiles.idPerfil eq perfilId }
                .mapNotNull { row ->
                    val modulo = Modulos.selectAll()
                        .where { Modulos.id eq row[PermisosPerfiles.idModulo] }
                        .singleOrNull() ?: return@mapNotNull null

                    PermisoConModulo(
                        idModulo = row[PermisosPerfiles.idModulo],
                        strNombreModulo = modulo[Modulos.strNombreModulo],
                        bitAgregar = row[PermisosPerfiles.bitAgregar],
                        bitEditar = row[PermisosPerfiles.bitEditar],
                        bitConsulta = row[PermisosPerfiles.bitConsulta],
                        bitEliminar = row[PermisosPerfiles.bitEliminar],
                        bitDetalle = row[PermisosPerfiles.bitDetalle]
                    )
                }
        }
    }
}