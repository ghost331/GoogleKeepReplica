import User from '../models/user.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { MailService } from '@sendgrid/mail';
import {main} from '../utils/mailer';
import { utils } from 'mocha';
import {sender} from '../config/rabbitmq';
import {client} from'../config/redis';
//get all users
export const getAllUsers = async () => {
  const data = await User.find();
  return data;
};

//create new user
export const newUser = async (body) => {
  
  await client.del('allNotes');
  console.log(body);
  const emailexist=await User.findOne({email:body.email});
  console.log("email exist",emailexist);
  if(emailexist){
    throw new Error("user already exist");
  }
  else{  
    const saltRounds = 10;
   const hashpassword=await bcrypt.hash(body.password, saltRounds);
   body.password=hashpassword;  
      // Store hash in your password DB.
   
  const data = await User.create(body);
  sender(data);
  return data;
  }
};
export const login=async(body)=>{
  await client.del('allNotes');
  const emailexist=await User.findOne({email:body.email});
  console.log(emailexist);
  if(emailexist){
  let match= await bcrypt.compare(body.password, emailexist.password) ;
  if(match){

    let token= jwt.sign({id:emailexist._id,email:emailexist.email},process.env.SECRET_KEY);
    return token;
  }
  else{
    throw new Error("Password did not match");
  }
  }
  else{
    throw new Error("user does not exist");
  }
}
//update single user
export const updateUser = async (_id, body) => {
  const data = await User.findByIdAndUpdate(
    {
      _id
    },
    body,
    {
      new: true
    }
  );
  return data;
};

//delete single user
export const deleteUser = async (id) => {
  await User.findByIdAndDelete(id);
  return '';
};

//get single user
export const getUser = async (id) => {
  const data = await User.findById(id);
  return data;
};

export const forgetpassword=async(body)=>{
  const data =await User.findOne({email:body.email});  

  console.log("inside the forget password",data);
  if(data==null){
    throw new Error("user does not exist");
  }
  else{
    let token=jwt.sign({id:data._id,email:data.email},process.env.NEW_SECRET_KEY);
    await main(data.email,token);
    return "message have been sent to respective mail";
  }
}
export const resetpassword=async (body)=>{
  const saltRounds = 10;
  const hashpassword=await bcrypt.hash(body.newpassword, saltRounds);

  const data =await User.findOneAndUpdate({email:body.email},{password:hashpassword});
  return data;


}