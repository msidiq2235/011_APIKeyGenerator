const db = require("../models");
const Admin = db.admin;
const User = db.user;
const ApiKey = db.apiKey;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// === FUNGSI AUTENTIKASI (Sudah Ada) ===
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ message: "Email and password are required." });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const admin = await Admin.create({
      email: email,
      password: hashedPassword
    });
    res.status(201).send({ message: "Admin registered successfully!", adminId: admin.id });
  } catch (error) {
    res.status(500).send({ message: error.message || "Error registering admin." });
  }
};

exports.login = async (req, res) => {
  try {
    const admin = await Admin.findOne({ where: { email: req.body.email } });
    if (!admin) {
      return res.status(404).send({ message: "Admin Not found." });
    }
    const passwordIsValid = bcrypt.compareSync(req.body.password, admin.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }
    const token = jwt.sign({ id: admin.id }, JWT_SECRET, {
      expiresIn: 86400
    });
    res.status(200).send({
      id: admin.id,
      email: admin.email,
      accessToken: token
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// === FUNGSI READ LIST ===

// (getListUsers)
exports.getListUsers = async (req, res) => {
  try {
    // === PERUBAHAN DI SINI ===
    // Kita tambahkan 'include' untuk mengambil data apikeys yang berelasi
    const users = await User.findAll({
        include: [db.apiKey] // Ini akan menghasilkan array 'apikeys' di data user
    });
    // === AKHIR PERUBAHAN ===
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

// (getListApiKeys)
exports.getListApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.findAll({
      include: [{ 
        model: db.user,
        attributes: ['email', 'firstname'] 
      }]
    });
    
    // === PERUBAHAN DI SINI (Memastikan key_id ada) ===
    const processedKeys = keys.map(k => {
      return {
        key_id: k.id, // Ini yang Anda minta (ID unik dari API Key)
        key: k.key,
        out_of_date: k.outofdate,
        status_inactive: k.outofdate ? "Inactive" : "Active",
        user_email: k.user ? k.user.email : "No User",
        user_name: k.user ? `${k.user.firstname} ${k.user.lastname}` : "No User",
        user_id: k.user ? k.user.id : null
      }
    });
    // === AKHIR PERUBAHAN ===
    res.status(200).send(processedKeys);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


// === FUNGSI CRUD BARU UNTUK ADMIN (Tidak Berubah) ===

// --- USER CRUD ---
exports.createUser = async (req, res) => {
  try {
    const { email, firstname, lastname } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Email is required." });
    }
    const newUser = await User.create({ email, firstname, lastname });
    res.status(201).send({ message: "User created by admin.", user: newUser });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId, {
      include: [db.apiKey]
    });
    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { email, firstname, lastname } = req.body;
    const [updated] = await User.update(
      { email, firstname, lastname },
      { where: { id: req.params.userId } }
    );
    if (updated) {
      const updatedUser = await User.findByPk(req.params.userId);
      res.status(200).send({ message: "User updated by admin.", user: updatedUser });
    } else {
      res.status(404).send({ message: "User not found." });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.destroy({
      where: { id: req.params.userId }
    });
    if (deleted) {
      res.status(200).send({ message: "User deleted successfully." });
    } else {
      res.status(404).send({ message: "User not found." });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};


// --- API KEY CRUD ---
exports.createApiKeyForUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send({ message: "User not found." });
        }
        await ApiKey.update(
            { outofdate: true },
            { where: { userId: userId } }
        );
        const newKeyString = uuidv4();
        const newApiKey = await ApiKey.create({
            key: newKeyString,
            outofdate: false,
            userId: userId
        });
        res.status(201).send({ message: "API Key created for user by admin.", apiKey: newApiKey });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.updateApiKey = async (req, res) => {
    try {
        const { outofdate } = req.body; 
        if (typeof outofdate !== 'boolean') {
            return res.status(400).send({ message: "Invalid input. 'outofdate' (boolean) is required." });
        }
        const [updated] = await ApiKey.update(
            { outofdate: outofdate },
            { where: { id: req.params.keyId } } 
        );
        if (updated) {
            const updatedKey = await ApiKey.findByPk(req.params.keyId);
            res.status(200).send({ message: "API Key status updated.", apiKey: updatedKey });
        } else {
            res.status(404).send({ message: "API Key not found." });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

exports.deleteApiKey = async (req, res) => {
    try {
        const deleted = await ApiKey.destroy({
            where: { id: req.params.keyId } 
        });
        if (deleted) {
            res.status(200).send({ message: "API Key deleted successfully." });
        } else {
            res.status(404).send({ message: "API Key not found." });
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};