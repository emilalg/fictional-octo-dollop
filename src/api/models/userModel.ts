// TODO: mongoose schema for user
/* based on the following object {
  "_id": 37,
  "user_name": "Test User", // this is not username, just firsname lastname
  "email": "john@metropolia.fi", // shoud be unique
  "role": "user", // or "admin" // don't send this
  "password": "1234" // don't send this
} */
import mongoose, {model} from 'mongoose';
import {User} from '../../interfaces/User';

const Schema = mongoose.Schema;

const userSchema = new Schema<User>({
  user_name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
});

export default model<User>('User', userSchema);
