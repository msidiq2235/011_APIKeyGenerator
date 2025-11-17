const express = require("express");
const cors = require("cors");
const path = require("path"); // <-- Pastikan ini ada di atas
require('dotenv').config();

const app = express(); // <-- INI YANG HILANG. 'app' dibuat di sini

// Middleware harus didefinisikan SETELAH 'app' dibuat
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === Sinkronisasi Database ===
const db = require("./models");
// Pastikan baris sync di-komentar (//) agar tidak me-reset data
// db.sequelize.sync({ force: true }).then(() => {
//   console.log('Drop and re-sync db.');
// });

// === Rute API ===
// Rute ini menggunakan 'app', jadi harus ada setelah 'app' dibuat
require('./routes/admin.routes')(app);
require('./routes/user.routes')(app);

// === Menyajikan Tampilan Web (HTML Sederhana) ===
// Baris ini juga menggunakan 'app' dan 'path'
app.use(express.static(path.join(__dirname, 'views')));

app.get('/user-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'user.html'));
});

// RUTE ADMIN BARU (DIPISAH)
app.get('/admin-login-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-login.html'));
});

app.get('/admin-register-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin-register.html'));
});

app.get('/admin-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Rute dasar
app.get("/", (req, res) => {
  res.json({ message: "Selamat datang di API service." });
});

// Set port dan jalankan server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}. http://localhost:${PORT}`);
});