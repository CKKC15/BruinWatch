import Class from '../models/class.js';

export const createClassRecord = async ({ name, professor, term, color }) => {
  return await Class.create({ name, professor, term, color });
};

export const fetchAllClasses = async (classIds) => {
  return await Class.find({ _id: { $in: classIds } });
};

export const fetchClassById = async (classId) => {
  return await Class.findById(classId);
};

export const updateClassRecord = async (classId, updatedData) => {
  return await Class.findByIdAndUpdate(classId, updatedData, { new: true });
};

export const deleteClassRecord = async (classId) => {
  return await Class.findByIdAndDelete(classId);
};

export const fetchAllClassesNames = async () => {
  try {
    const classes = await Class.find({}, { name: 1, _id: 0 }).lean();
    return classes.map(c => c.name);
  } catch (error) {
    console.error('Error fetching class names:', error);
    throw new Error('Failed to fetch class names');
  }
};