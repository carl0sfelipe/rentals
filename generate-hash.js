const bcrypt = require('bcrypt');

async function generateHash() {
  const hash = await bcrypt.hash('12345678', 10);
  console.log(hash);
}

generateHash();
