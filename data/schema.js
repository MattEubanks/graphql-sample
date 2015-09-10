import Sequelize from 'sequelize';

import {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLInt,
  GraphQLString,
} from 'graphql';

var sequelize = new Sequelize('postgres://localhost/test');

let User = sequelize.define('users', {
  name: {
    type: Sequelize.STRING,
    field: 'name'
  },
  age: {
    type: Sequelize.INTEGER,
    field: 'age'
  },
});

User.belongsToMany(User, {as: 'friends', through: 'friendships'});
sequelize.sync().then(function(){});

let userType = new GraphQLObjectType({
    name: 'user',
    fields : {
      'name' : {type: GraphQLString},
      'age' : {type: GraphQLInt}
    }
});

let Query = new GraphQLObjectType({
  name: 'query',
  description: 'this is the root query',
  fields: {
    getUser: {
      type: userType,
      description: 'get user object with provided name',
      args: {
        name: {type: GraphQLString}
      },
      resolve: (root, {name})=>{
        return User
          .findOne({
            where: { name : name }
          })
      }
    }
  }
});

let Mutation = new GraphQLObjectType({
  name: 'mutation',
  description: 'this is the root mutation',
  fields: {
    addUser:{
      type: userType,
      args: {
        name: {type: GraphQLString},
        age: {type:GraphQLInt}
      },
      description: 'returns user object',
      resolve: (root,{name, age})=>{
      //add to database
      //database returns userobject added
      var data;
      return User
        .findOrCreate({
          where: {
            name : name
          },
          defaults:{
            age: age,
          }
        }).spread(function(user){return user}); //why spread instead of then?
    }
    },
    updateUser:{
      type: userType,
      description: 'finds user of Name, and updates his/her Age',
      args:{
        name: {type: GraphQLString},
        age: {type: GraphQLInt}
      },
      resolve: (root,{name,age})=>{
        User.update(
          {age: age},
          {where:
            {name: name}
          }
        )
      }
    },
    deleteUser:{
      type: userType,
      description: 'finds user of Name and removes user object from the database',
      args:{
        name: {type: GraphQLString}
      },
      resolve: (root, {name})=>{
        return User.destroy({
            where: {name: name}
          })
      }
    },
    addFriend:{
      type: GraphQLString,
      description: 'adds friendship between 2 users',
      args:{
        user1: {type: GraphQLString},
        user2: {type: GraphQLString}
      },
      resolve: (root, {user1, user2})=>{
        User.findOne({
            where: {
              name: user1
            }
          }).then(function(userone, created){
            User.findOne({
              where: {
                name: user2
              }
            }).then(function(usertwo, created){
              userone.addFriend(usertwo);
              usertwo.addFriend(userone);
            })
          });
      }
    },
    removeFriend:{
      type: GraphQLString,
      description: 'remove friendship between 2 users',
      args:{
        user1: {type: GraphQLString},
        user2: {type: GraphQLString}
      },
      resolve: (root, {user1, user2})=>{
        User.findOne({
            where: {
              name: user1
            }
          }).then(function(userone, created){
            User.findOne({
              where: {
                name: user2
              }
            }).then(function(usertwo, created){
              userone.removeFriend(usertwo);
              usertwo.removeFriend(userone);
            })
          });
      }
    }
  }
});

let schema = new GraphQLSchema({
  query : Query,
  mutation : Mutation
});

module.exports = schema;
