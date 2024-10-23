let url: string = "sdv";

if (process.env.NODE_ENV === "production"){
  // Use this if you are communicating with local server
  url = `${window.location.hostname}:${window.location.port}`
} else {
  if (process.env.REACT_APP_LOCAL_DEV_SERVER === '1'){
    url = `127.0.0.1:${process.env.REACT_APP_SERVER_PORT}`
  } else {
    url = `${process.env.REACT_APP_RASPBERRY_PI_IP}:${process.env.REACT_APP_SERVER_PORT}`
  }
};
export const SERVER_URL=url;