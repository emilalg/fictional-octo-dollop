/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose, {ObjectId} from 'mongoose';
import {NextFunction, Request, Response} from 'express';
import {User, UserOutput} from '../../interfaces/User';
import UserSchema from '../models/userModel';
import bcrypt from 'bcrypt';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import jwt from 'jsonwebtoken';

// TODO: create the following functions:
// - userGet - get user by id

const userGet = async (
  req: Request<{id: number}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const user = await UserSchema.findById(req.params.id).select(
      '-password -role'
    );
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.json(user as UserOutput);
  } catch (error) {
    console.log('agony');
    next(new CustomError('User not found', 404));
  }
};

// - userListGet - get all users

const userListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }
    const users = await UserSchema.find().select('-password -role');
    if (!users) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.json(users);
  } catch (error) {
    next(new CustomError('Users not found', 404));
  }
};

// - userPost - create new user. Remember to hash password

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const InUser: User = req.body;

    const password = await bcrypt.hash(req.body.password, 10);
    InUser.password = password;

    const user = new UserSchema(InUser);
    user
      .save()
      .then((savedUser: any) => {
        const userObject = savedUser.toObject();
        delete userObject.password;
        delete userObject.role;
        res.json({message: 'User created', data: userObject as UserOutput});
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .catch((err: Error) => {
        next(new CustomError('User creation failed', 500));
      });
  } catch (error) {
    next(new CustomError('User creation failed', 500));
  }
};

// - userPutCurrent - update current user

const userPutCurrent = async (
  req: Request<{id: number}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }

    const email = (req.user as any).email;
    const user: any = await UserSchema.findOneAndUpdate({email}, req.body, {
      new: true,
    });
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    const out = user.toObject();
    delete out.password;
    delete out.role;
    res.json({message: 'User updated', data: out as UserOutput});
  } catch (error) {
    next(new CustomError('User not found', 404));
  }
};

// - userDeleteCurrent - delete current user

const userDeleteCurrent = async (
  req: Request<{}, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const messages = errors
        .array()
        .map((error) => `${error.msg}: ${error.param}`)
        .join(', ');
      next(new CustomError(messages, 400));
      return;
    }
    const email = (req.user as any).email;
    const user_name = (req.user as any).user_name;
    console.log('email ', {email}, 'user_name1', {user_name});
    const user = await UserSchema.findOneAndDelete({email});
    if (!user) {
      next(new CustomError('User not found', 404));
      return;
    }
    res.json({message: 'User deleted', data: {email, user_name}});
  } catch (error) {
    next(new CustomError('User not found', 404));
  }
};

// - checkToken - check if current user token is valid: return data from req.user. No need for database query

const checkToken = async (req: Request, res: Response, next: NextFunction) => {
  //asdf
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({message: 'No token provided.'});
    }
    jwt.verify(token, 'asdf', (err: any, decoded: any) => {
      if (err) {
        return res.status(401).json({message: 'Failed to authenticate token.'});
      } else {
        const resObj: any = req.user;
        delete resObj.password;
        delete resObj.role;
        res.status(200).json(resObj);
      }
    });
  } catch (error) {
    next(new CustomError('User not found', 404));
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
