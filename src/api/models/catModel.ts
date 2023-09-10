// TODO: mongoose schema for cat

import mongoose, {model} from 'mongoose';
import {Cat} from '../../interfaces/Cat';

const Schema = mongoose.Schema;

const catSchema = new Schema<Cat>({
  cat_name: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  birthdate: {
    type: Date,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number, Number],
      required: true,
    },
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

catSchema.index({location: '2dsphere'});
export default model<Cat>('Cat', catSchema);
