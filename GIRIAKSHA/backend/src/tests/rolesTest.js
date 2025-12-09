const { getAllRoles } = require('../models/queries');

(async () => {
  try {
    const result = await getAllRoles();
    console.log("Roles:", result.rows);
  } catch (err) {
    console.error(err);
  }
})();
