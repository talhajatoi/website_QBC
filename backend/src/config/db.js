import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

export const connectDatabase = async (uri, options = {}) => {
  mongoose.set('strictQuery', true);
  // Some networks block Node's direct DNS SRV queries for mongodb+srv URIs.
  if (env.dnsServers.length) dns.setServers(env.dnsServers);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, ...options });
  return mongoose.connection;
};

export const disconnectDatabase = () => mongoose.disconnect();
