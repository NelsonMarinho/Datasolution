const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./mydatabase.db');

// Criar a tabela users se não existir
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
)`);

console.log('Tabela users verificada ou criada com sucesso.');
db.close();
