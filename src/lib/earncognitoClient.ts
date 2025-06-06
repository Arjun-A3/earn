import axios, { type AxiosInstance } from 'axios';
import jwt from 'jsonwebtoken';

const earncognitoUrl = process.env.EARNCOGNITO_URL;
const earncognitoSecret = process.env.EARNCOGNITO_SECRET;

const earncognitoClient: AxiosInstance = axios.create({
  baseURL: earncognitoUrl,
});

earncognitoClient.interceptors.request.use(
  (config) => {
    const token = jwt.sign(
      { serviceName: 'main-earn-service' },
      earncognitoSecret || '',
      { expiresIn: '60s' },
    );

    config.headers = config.headers || {};

    config.headers['Authorization'] = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default earncognitoClient;
