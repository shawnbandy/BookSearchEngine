const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');
const { User, Book } = require('../models');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        return User.findOne({ _id: context.user._id }).populate(
          'bookCount',
          'savedBooks'
        );
      }
    },
  },
  Mutations: {
    addUser: async (parent, { username, email, password }) => {
      const newUser = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },

    login: async (parent, { email, password }) => {
      const returningUser = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('No user found with that email');
      }

      const correctPw = await returningUser.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('invalid password');
      }

      const token = signToken(returningUser);

      return { token, returningUser };
    },

    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const book = await Book.findOneAndDelete({
          _id: bookId,
          who: context.user.username,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: book._id } },
          { $dec: { [`bookCount`]: 1 } },
          { new: true }
        );

        return context.user;
      }
    },

    saveBook: async (
      parent,
      { authors, description, title, image, link },
      context
    ) => {
      if (context.user) {
        const book = await Book.create({
          authors,
          description,
          title,
          image,
          link,
        });

        await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book._id } }
        );

        return context.user;
      }
    },
  },
};

module.exports = resolvers;
