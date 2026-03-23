package com.seguridad.dao

import com.seguridad.models.Perfil
import com.seguridad.models.Perfiles
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

class PerfilDAO {

    fun createPerfil(perfil: Perfil): Int? {
        return transaction {
            Perfiles.insert {
                it[strNombrePerfil] = perfil.strNombrePerfil
                it[bitAdministrador] = perfil.bitAdministrador
            } get Perfiles.id
        }
    }

    fun getPerfilById(id: Int): Perfil? {
        return transaction {
            Perfiles.select { Perfiles.id eq id }
                .map { mapToPerfil(it) }
                .singleOrNull()
        }
    }

    fun getAllPerfiles(page: Int = 1, pageSize: Int = 5): List<Perfil> {
        return transaction {
            val offset = (page - 1) * pageSize
            Perfiles.selectAll()
                .orderBy(Perfiles.id to SortOrder.ASC)
                .limit(pageSize, offset.toLong())
                .map { mapToPerfil(it) }
        }
    }

    fun getTotalCount(): Long {
        return transaction {
            Perfiles.selectAll().count()
        }
    }

    fun updatePerfil(id: Int, perfil: Perfil): Boolean {
        return transaction {
            val updateCount = Perfiles.update({ Perfiles.id eq id }) {
                it[strNombrePerfil] = perfil.strNombrePerfil
                it[bitAdministrador] = perfil.bitAdministrador
            }
            updateCount > 0
        }
    }

    fun deletePerfil(id: Int): Boolean {
        return transaction {
            val deleteCount = Perfiles.deleteWhere { Perfiles.id eq id }
            deleteCount > 0
        }
    }

    private fun mapToPerfil(row: ResultRow): Perfil {
        return Perfil(
            id = row[Perfiles.id],
            strNombrePerfil = row[Perfiles.strNombrePerfil],
            bitAdministrador = row[Perfiles.bitAdministrador]
        )
    }
}