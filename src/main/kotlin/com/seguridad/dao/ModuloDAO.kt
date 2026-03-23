package com.seguridad.dao

import com.seguridad.models.Modulo
import com.seguridad.models.Modulos
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction

class ModuloDAO {

    fun createModulo(modulo: Modulo): Int? {
        return transaction {
            Modulos.insert {
                it[strNombreModulo] = modulo.strNombreModulo
            } get Modulos.id
        }
    }

    fun getModuloById(id: Int): Modulo? {
        return transaction {
            Modulos.select { Modulos.id eq id }
                .map { mapToModulo(it) }
                .singleOrNull()
        }
    }

    fun getAllModulos(page: Int = 1, pageSize: Int = 5): List<Modulo> {
        return transaction {
            val offset = (page - 1) * pageSize
            Modulos.selectAll()
                .orderBy(Modulos.id to SortOrder.ASC)
                .limit(pageSize, offset.toLong())
                .map { mapToModulo(it) }
        }
    }

    fun getAllModulosList(): List<Modulo> {
        return transaction {
            Modulos.selectAll()
                .orderBy(Modulos.id to SortOrder.ASC)
                .map { mapToModulo(it) }
        }
    }

    fun getTotalCount(): Long {
        return transaction {
            Modulos.selectAll().count()
        }
    }

    fun updateModulo(id: Int, modulo: Modulo): Boolean {
        return transaction {
            val updateCount = Modulos.update({ Modulos.id eq id }) {
                it[strNombreModulo] = modulo.strNombreModulo
            }
            updateCount > 0
        }
    }

    fun deleteModulo(id: Int): Boolean {
        return transaction {
            val deleteCount = Modulos.deleteWhere { Modulos.id eq id }
            deleteCount > 0
        }
    }

    private fun mapToModulo(row: ResultRow): Modulo {
        return Modulo(
            id = row[Modulos.id],
            strNombreModulo = row[Modulos.strNombreModulo]
        )
    }
}