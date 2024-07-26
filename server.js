const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
require('dotenv').config(); // Para carregar variáveis de ambiente

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const db = new sqlite3.Database('./mydatabase.db');

// Configurar sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'secrettoken',
    resave: false,
    saveUninitialized: true,
}));

// Configurar para servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota para servir index.html
app.get('/index', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err || !user) {
            return res.json({ success: false, message: 'Invalid username or password' });
        }
        bcrypt.compare(password, user.password, (err, match) => {
            if (match) {
                req.session.userId = user.id;
                req.session.role = user.role;
                res.json({ success: true });
            } else {
                res.json({ success: false, message: 'Invalid username or password' });
            }
        });
    });
});

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Failed to logout' });
        }
        res.redirect('/login.html');
    });
});

// Middleware para verificação de autenticação
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/login.html');
    }
}

// Middleware para verificar se é administrador
function isAdmin(req, res, next) {
    if (req.session.role === 'admin') {
        return next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied' });
    }
}

// Rota para registrar usuário (somente admin)
app.post('/register', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error creating user' });
        }
        res.status(201).json({ success: true, message: 'User created successfully' });
    });
});

// Rota para listar usuários (somente admin)
app.get('/users', isAuthenticated, isAdmin, (req, res) => {
    db.all('SELECT username, role FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error retrieving users' });
        }
        res.json({ success: true, users: rows });
    });
});

// Rota para excluir usuário (somente admin)
app.delete('/users/:username', isAuthenticated, isAdmin, (req, res) => {
    const { username } = req.params;
    db.run('DELETE FROM users WHERE username = ?', [username], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    });
});

// Rota para registrar carregamentos
app.post('/carregamentos', isAuthenticated, (req, res) => {
    const { data, composicao, vagoes, destino, filial, material, volume } = req.body;
    if (!data || !composicao || !vagoes || !destino || !filial || !material || !volume) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const sql = 'INSERT INTO carregamentos (data, composicao, vagoes, destino, filial, material, volume) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.run(sql, [data, composicao, vagoes, destino, filial, material, volume], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error registering shipment' });
        }
        res.status(201).json({ success: true, message: 'Shipment registered successfully', id: this.lastID });
    });
});

// Rota para listar carregamentos
app.get('/carregamentos', isAuthenticated, (req, res) => {
    const { data } = req.query;
    let sql = 'SELECT * FROM carregamentos';
    let params = [];
    if (data) {
        sql += ' WHERE data = ?';
        params.push(data);
    }
    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error retrieving shipments' });
        }
        res.json({ success: true, carregamentos: rows });
    });
});

// Rota para editar carregamento (somente admin)
app.put('/carregamentos/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const { data, composicao, vagoes, destino, filial, material, volume } = req.body;
    if (!data || !composicao || !vagoes || !destino || !filial || !material || !volume) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const sql = 'UPDATE carregamentos SET data = ?, composicao = ?, vagoes = ?, destino = ?, filial = ?, material = ?, volume = ? WHERE id = ?';
    db.run(sql, [data, composicao, vagoes, destino, filial, material, volume, id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error updating shipment' });
        }
        res.json({ success: true, message: 'Shipment updated successfully' });
    });
});

// Rota para deletar carregamento (somente admin)
app.delete('/carregamentos/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM carregamentos WHERE id = ?';
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error deleting shipment' });
        }
        res.json({ success: true, message: 'Shipment deleted successfully' });
    });
});

// Rota para obter o papel do usuário
app.get('/getRole', isAuthenticated, (req, res) => {
    db.get('SELECT role FROM users WHERE id = ?', [req.session.userId], (err, row) => {
        if (err || !row) {
            return res.status(500).json({ success: false, message: 'Failed to retrieve user role' });
        }
        res.json({ success: true, role: row.role });
    });
});

// Verificar se existe um usuário administrador, senão criar um
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    db.get('SELECT * FROM users WHERE username = ?', [process.env.ADMIN_USERNAME], async (err, row) => {
        if (err) {
            console.error('Erro ao verificar usuário administrador:', err);
        } else if (!row) {
            const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            db.run('INSERT INTO users (username, password, role) VALUES (?, ?, "admin")', [process.env.ADMIN_USERNAME, adminPassword], (err) => {
                if (err) {
                    console.error('Erro ao criar usuário administrador:', err);
                } else {
                    console.log('Usuário administrador criado com sucesso');
                }
            });
        } else {
            console.log('Usuário administrador já existe');
        }
    });
} else {
    console.log('Variáveis de ambiente ADMIN_USERNAME e ADMIN_PASSWORD não definidas.');
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
