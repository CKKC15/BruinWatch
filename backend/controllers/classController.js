import Class from '../models/class.js';

export const createClass = async ({ name, professor, term, color }) => {
  return await Class.create({ name, professor, term, color });
};

export const fetchAllClasses = async (classIds) => {
  return await Class.find({ _id: { $in: classIds } });
};

export const fetchClassById = async (classId) => {
  return await Class.findById(classId);
};

export const updateClass = async (classId, updatedData) => {
  return await Class.findByIdAndUpdate(classId, updatedData, { new: true });
};

export const deleteClass = async (classId) => {
  return await Class.findByIdAndDelete(classId);
};