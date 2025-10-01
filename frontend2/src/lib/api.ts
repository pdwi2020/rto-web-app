import axios from 'axios';

const api = axios.create({
  baseURL: '/', // Using '/' as base url because of the proxy
});

export default api;
