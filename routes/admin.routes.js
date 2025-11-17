const controller = require("../controllers/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Authorization, Origin, Content-Type, Accept"
    );
    next();
  });

  // === Rute Publik (Autentikasi) ===
  app.post("/api/admin/register", controller.register);
  app.post("/api/admin/login", controller.login);

  
  // === Rute Terproteksi (Wajib Pakai Token) ===

  // --- CRUD untuk Users ---
  
  // (CREATE) Admin membuat User baru
  app.post("/api/admin/users", [verifyToken], controller.createUser);
  
  // (READ-LIST) Admin melihat semua User
  app.get("/api/admin/users", [verifyToken], controller.getListUsers);
  
  // (READ-ONE) Admin melihat 1 User spesifik
  app.get("/api/admin/users/:userId", [verifyToken], controller.getUserById);
  
  // (UPDATE) Admin meng-update User
  app.put("/api/admin/users/:userId", [verifyToken], controller.updateUser);
  
  // (DELETE) Admin menghapus User
  app.delete("/api/admin/users/:userId", [verifyToken], controller.deleteUser);

  
  // --- CRUD untuk ApiKeys ---
  
  // (CREATE) Admin membuatkan key baru untuk User
  app.post("/api/admin/users/:userId/keys", [verifyToken], controller.createApiKeyForUser);

  // (READ-LIST) Admin melihat semua ApiKey
  app.get("/api/admin/apikeys", [verifyToken], controller.getListApiKeys);
  
  // (UPDATE) Admin meng-update status ApiKey (misal: menonaktifkan)
  // Perhatikan: kita pakai ID unik milik key, BUKAN user id
  app.put("/api/admin/apikeys/:keyId", [verifyToken], controller.updateApiKey);
  
  // (DELETE) Admin menghapus ApiKey spesifik
  // Perhatikan: kita pakai ID unik milik key, BUKAN user id
  app.delete("/api/admin/apikeys/:keyId", [verifyToken], controller.deleteApiKey);
  
};