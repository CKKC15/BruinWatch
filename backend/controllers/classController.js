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