// First we need to import axios.js
import axios from "axios";
// Next we make an 'instance' of it
const API = import.meta.env.VITE_API;

const axiosConfig = axios.create({
  // .. where we make our configurations
  baseURL: API,
});

type User = {
  email: string;
  first_name: string;
  id: number;
  last_name: string;
  role: string;
  accessToken: string;
};
const user = JSON.parse(sessionStorage.getItem("user") || "{}");
// Where you would set stuff like your 'Authorization' header, etc ...
axiosConfig.defaults.headers.common["Authorization"] =
  "Bearer " + user?.accessToken;

// Also add/ configure interceptors && all the other cool stuff

// instance.interceptors.request...

export default axiosConfig;
