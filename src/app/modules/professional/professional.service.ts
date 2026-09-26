import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IProfessional } from './professional.interface';
import { Professional } from './professional.model';

// update professional
const updateProfessional = async (
  userId: string,
  payload: Partial<IProfessional>,
): Promise<IProfessional> => {
  const result = await Professional.findOneAndUpdate(
    { user: userId },
    payload,
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Professional not found');
  }
  return result;
};

export const ProfessionalServices = {
  updateProfessional,
};
