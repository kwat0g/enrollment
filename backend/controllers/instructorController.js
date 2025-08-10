const getInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    // If id is already a non-numeric string, treat it as the name
    const isNumeric = !isNaN(Number(id));
    const name = isNumeric ? `Instructor ${id}` : String(id);
    return res.json({ id, name });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error.' });
  }
};

module.exports = { getInstructor };
