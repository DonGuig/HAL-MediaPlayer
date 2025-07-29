import axios from 'axios';
import { SERVER_URL } from 'src/ServerURL';

const axiosServerAPI = axios.create({baseURL: `http://${SERVER_URL}/api`});


export default axiosServerAPI;
