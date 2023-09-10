/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import mongoose from 'mongoose';
import {NextFunction, Request, Response} from 'express';
import {Cat} from '../../interfaces/Cat';
import CatSchema from '../models/catModel';
import bcrypt from 'bcrypt';
import {validationResult} from 'express-validator';
import CustomError from '../../classes/CustomError';
import {LoginUser, UserOutput} from '../../interfaces/User';
import catModel from '../models/catModel';
// TODO: create following functions:
// - catGetByUser - get all cats by current user id

const catGetByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user as UserOutput;
  const cats = await catModel.find({owner: user._id});
  if (cats) {
    res.json(cats);
  } else {
    next(new CustomError('Cat not found', 404));
  }
};

// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)

const catGetByBoundingBox = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {topRight, bottomLeft} = req.query;

  // Check for existence and type
  if (
    typeof topRight !== 'string' ||
    typeof bottomLeft !== 'string' ||
    !topRight.includes(',') ||
    !bottomLeft.includes(',')
  ) {
    return next(new CustomError('Invalid coordinates', 400));
  }

  const [lon1, lat1] = topRight.split(',').map(parseFloat);
  const [lon2, lat2] = bottomLeft.split(',').map(parseFloat);

  const cats = await catModel.find({
    location: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lat1, lon1],
              [lat2, lon1],
              [lat2, lon2],
              [lat1, lon2],
              [lat1, lon1],
            ],
          ],
        },
      },
    },
  });

  if (cats && cats.length > 0) {
    res.json(cats);
  } else {
    next(new CustomError('Cat not found', 404));
  }
};

// - catPutAdmin - only admin can change cat owner

const catPutAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const {
    user: admin,
    params: {id: catId},
    body,
  } = req;
  const {cat_name, weight, filename, birthdate, location} = body as Cat;

  if (!admin) {
    return next(new CustomError('Unauthorized', 401));
  }

  const catOutput: any = {
    cat_name,
    weight,
    filename,
    birthdate,
    location,
  };

  try {
    await catModel.findByIdAndUpdate(catId, catOutput);
    res.json({message: 'cat updated', data: catOutput});
  } catch (error) {
    next(new CustomError('Failed to update cat', 500));
  }
};

// - catDeleteAdmin - only admin can delete cat

const catDeleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    params: {id: catId},
  } = req;

  try {
    const deletedCat = await catModel.findByIdAndDelete(catId);
    if (deletedCat) {
      res.json({message: 'cat deleted by admin', data: deletedCat});
    } else {
      next(new CustomError('Cat not deleted', 400));
    }
  } catch (error) {
    next(new CustomError('Failed to delete cat', 500));
  }
};

// - catDelete - only owner can delete cat

const catDelete = async (req: Request, res: Response, next: NextFunction) => {
  const {
    user,
    params: {id: catId},
  } = req;
  const loggedUser: LoginUser = user as LoginUser;

  try {
    const deletedCat = await catModel.findByIdAndDelete(catId);
    if (deletedCat?.owner.toString() === (loggedUser as any)._id) {
      res.json({message: 'cat deleted', data: deletedCat});
    } else {
      next(new CustomError('Unauthorized', 401));
    }
  } catch (error) {
    next(new CustomError('Failed to delete cat', 500));
  }
};

// - catPut - only owner can update cat

const catPut = async (req: Request, res: Response, next: NextFunction) => {
  const {
    user,
    params: {id: catId},
    body,
  } = req;
  const owner: UserOutput = user as UserOutput;
  const {cat_name, weight, filename, birthdate, location} = body as Cat;

  if (!owner) {
    return next(new CustomError('Unauthorized', 401));
  }

  const catOwner: UserOutput = {
    _id: owner._id,
    user_name: owner.user_name,
    email: owner.email,
  };

  const catOutput: any = {
    cat_name,
    weight,
    filename,
    birthdate,
    location,
    owner: catOwner,
  };

  try {
    await catModel.findByIdAndUpdate(catId, catOutput);
    res.json({message: 'cat updated', data: catOutput});
  } catch (error) {
    next(new CustomError('Failed to update cat', 500));
  }
};

// - catGet - get cat by id

const catGet = async (req: Request, res: Response, next: NextFunction) => {
  const {
    params: {id: catId},
  } = req;

  if (!catId) {
    return next(new CustomError('Cat not found', 404));
  }

  try {
    const cat = await catModel.findById(catId);

    if (!cat) {
      return next(new CustomError('Cat owner not found', 404));
    }

    const {owner, _id, cat_name, weight, birthdate, location} = cat;
    const ownerOutput: UserOutput = {
      _id: owner._id,
      user_name: owner.user_name,
      email: owner.email,
    };

    const catOutput: any = {
      _id,
      cat_name,
      weight,
      birthdate,
      location,
      owner: ownerOutput,
    };

    res.status(200).json(catOutput);
  } catch (error) {
    next(new CustomError('Failed to retrieve cat', 500));
  }
};

// - catListGet - get all cats

const catListGet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cats = await catModel.find({});

    const catOutput: any[] = cats.map((cat) => {
      const {owner, _id, cat_name, weight, birthdate, location} = cat;

      const ownerOutput: UserOutput = {
        _id: owner._id,
        user_name: owner.user_name,
        email: owner.email,
      };

      if (ownerOutput._id) {
        return {
          _id: _id as string,
          cat_name,
          weight,
          birthdate,
          location,
          owner: ownerOutput,
        };
      } else {
        return next(new CustomError('Cat owner not found', 404));
      }
    });
    console.log(JSON.stringify(catOutput, null, 2));
    res.json(catOutput);
  } catch (err) {
    next(err);
  }
};

// - catPost - create new cat

const catPost = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req.body);

  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');

    console.log('cat_post validation', messages);
    return next(new CustomError(messages, 400));
  }

  const owner: UserOutput = req.user as UserOutput;

  if (!owner) {
    return next(new CustomError('Unauthorized', 401));
  }

  const {weight, birthdate, cat_name} = req.body;

  const catOwner: UserOutput = {
    _id: owner._id,
    user_name: owner.user_name,
    email: owner.email,
  };

  const filename = req.file?.filename;
  const location = res.locals.coords;

  try {
    const newCat = await catModel.create({
      weight,
      birthdate,
      filename,
      location,
      owner: catOwner,
      cat_name,
    });

    res.json({message: 'cat added', data: newCat as Cat});
  } catch (error) {
    next(new CustomError('Failed to add cat', 500));
  }
};

export {
  catGetByUser,
  catGetByBoundingBox,
  catPutAdmin,
  catDeleteAdmin,
  catDelete,
  catPut,
  catGet,
  catListGet,
  catPost,
};
