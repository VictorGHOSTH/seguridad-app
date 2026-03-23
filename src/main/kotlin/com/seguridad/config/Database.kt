package com.seguridad.config

import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import org.jetbrains.exposed.sql.Database

fun configureDatabase(): Database {
    val databaseUrl = System.getenv("DATABASE_URL")
        ?: "jdbc:postgresql://localhost:5432/seguridad_db"
    val databaseUser = System.getenv("DATABASE_USER") ?: "postgres"
    val databasePassword = System.getenv("DATABASE_PASSWORD") ?: "postgres"

    val config = HikariConfig().apply {
        jdbcUrl = databaseUrl
        username = databaseUser
        password = databasePassword
        driverClassName = "org.postgresql.Driver"
        maximumPoolSize = 10
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_REPEATABLE_READ"
        addDataSourceProperty("ssl", "true")
        addDataSourceProperty("sslmode", "require")
        validate()
    }

    val dataSource = HikariDataSource(config)
    return Database.connect(dataSource)
}