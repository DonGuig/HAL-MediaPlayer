import { serverPort } from '@halmediaplayer/shared';
import axios from 'axios';

const axiosInt = axios.create({baseURL: `http://${window.location.hostname}:${serverPort}/api/`});

export default axiosInt;
