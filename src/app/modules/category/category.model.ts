import { Schema, model } from 'mongoose';
import { ICategory, CategoryModel } from './category.interface';

const categorySchema = new Schema<ICategory, CategoryModel>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// virtual for total services count
categorySchema.virtual('totalServices', {
  ref: 'Service',
  localField: '_id',
  foreignField: 'category',
  count: true,
  match: { isDeleted: false },
});

export const Category = model<ICategory, CategoryModel>(
  'Category',
  categorySchema,
);
