// TODO: cat interface

interface Cat {
  _id: string;
  cat_name: string;
  weight: number;
  filename: string;
  birthdate: Date;
  location: {
    type: [number];
    index: '2d';
  };
  owner: {
    _id: string;
    user_name: string;
    email: string;
  };
}

type CatInput = Omit<Cat, '_id'>;

export {Cat, CatInput};
