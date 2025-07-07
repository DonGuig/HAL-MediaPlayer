let url: string = "sdv";

if (import.meta.env.MODE === "production"){
  // Use this if you are communicating with local server
  url = `${window.location.hostname}:${window.location.port}`
} else {
  if (import.meta.env.VITE_LOCAL_DEV_SERVER === '1'){
    url = `127.0.0.1:${import.meta.env.VITE_SERVER_PORT}`
  } else {
    url = `${import.meta.env.VITE_RASPBERRY_PI_IP}:${import.meta.env.VITE_SERVER_PORT}`
  }
};
export const SERVER_URL=url;