import bcrypt from 'bcrypt';

const createAdminAccount = async (username, password) => {
  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  try {
    const user = "admin";
    const pass = "admin";
    const hashedPassword = await bcrypt.hash(pass, 10);
    console.log('Username:', username);
    console.log('Hashed Password:', hashedPassword);
  } catch (err) {
    console.error(err);
    throw new Error('Error creating admin account.');
  }
};

// Test call
createAdminAccount('adminUser', 'securePassword123')
  .then(() => console.log('Admin account creation simulated successfully.'))
  .catch(err => console.error('Error:', err));