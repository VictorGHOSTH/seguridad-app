package com.seguridad.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database

fun configureDatabase(): Database {
    val config = HikariConfig().apply {
        jdbcUrl = "jdbc:postgresql://ep-long-shape-aeyhfcxk-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        username = "neondb_owner"
        password = "npg_BEnp01cOLGIN"
        driverClassName = "org.postgresql.Driver"
        maximumPoolSize = 10
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_REPEATABLE_READ"

        // ✅ Requerido para Neon Tech (SSL)
        addDataSourceProperty("ssl", "true")
        addDataSourceProperty("sslmode", "require")

        validate()
    }

    val dataSource = HikariDataSource(config)
    return Database.connect(dataSource)
}