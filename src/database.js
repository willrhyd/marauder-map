// jshint esversion: 6

import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config();

const conn = process.env.MONGODB_URI;

const Schema = mongoose.Schema;

// Creates simple schema for a User.  The hash and salt are derived from the user's given password when they register.
const UserSchema = new Schema({
  email: String,
  name: String,
  tokens: Object,
  
});

// Expose the connection and models
export const User = mongoose.model("User", UserSchema); 
export const connect = mongoose.connect(conn, function(error){
  if(error){
    console.log(error)
  } else {
    console.log(`Connected to Mongo DB on: ${conn}`)
  }
}); 