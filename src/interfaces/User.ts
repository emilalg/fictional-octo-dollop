// TODO: user interface
// based on the following object

interface User {
  _id: string;
  user_name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

type UserOutput = Omit<User, 'password' | 'role'>;

type UserTest = Partial<User>;

type LoginUser = {
  username: string;
  password: string;
};

export {User, UserOutput, UserTest, LoginUser};
