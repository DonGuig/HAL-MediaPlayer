import * as React from 'react';
import {
    Box,
    Button,
    Container, Divider, Grid, Typography,
} from "@mui/material";
import axios from 'axios';
import _ from "lodash";
import { serverPort } from '@halmediaplayer/shared';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import globalSnackbar from 'src/utils/snackbarUtils';

type fileNameResponse = {
    fileName: string;
}

const Playback: React.FC = () => {
    const [fileName, setFileName] = useState<string>("...");
    const fileUploadButtonRef = useRef<HTMLInputElement>();


    const getFileName = () => {
        axios.get<fileNameResponse>(`http://${window.location.hostname}:${serverPort}/api/getFileName`)
            .then((res) => {
                console.log(res.data.fileName);
                setFileName(res.data.fileName);
            })
            .catch((err) => {
                if (axios.isAxiosError(err)) {
                    const toDisplay = err.response.data;
                    if (_.isString(toDisplay)) {
                        globalSnackbar.error(toDisplay);
                    }
                }
            });
    }

    const handleClickPlay = () => {
        axios.post(`http://${window.location.hostname}:${serverPort}/api/play`).catch((err) => {
            if (axios.isAxiosError(err)) {
                const toDisplay = err.response.data;
                if (_.isString(toDisplay)) {
                    globalSnackbar.error(toDisplay);
                }
            }
        })
    }

    const handleClickPause = () => {
        axios.post(`http://${window.location.hostname}:${serverPort}/api/pause`).catch((err) => {
            if (axios.isAxiosError(err)) {
                const toDisplay = err.response.data;
                if (_.isString(toDisplay)) {
                    globalSnackbar.error(toDisplay);
                }
            }
        })
    }

    const handleClickRestart = () => {
        axios.post(`http://${window.location.hostname}:${serverPort}/api/restart`).catch((err) => {
            if (axios.isAxiosError(err)) {
                const toDisplay = err.response.data;
                if (_.isString(toDisplay)) {
                    globalSnackbar.error(toDisplay);
                }
            }
        })
    }

    const handleClickStop = () => {
        axios.post(`http://${window.location.hostname}:${serverPort}/api/stop`).catch((err) => {
            if (axios.isAxiosError(err)) {
                const toDisplay = err.response.data;
                if (_.isString(toDisplay)) {
                    globalSnackbar.error(toDisplay);
                }
            }
        })
    }

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files;
        if (file !== null) {
            const formData = new FormData();
            formData.append("file", file[0], file[0].name);
            axios
                .post(
                    `http://${window.location.hostname}:${serverPort}/api/uploadVideoFile`,
                    formData
                )
                .then(
                    (res) => {
                        getFileName();
                        globalSnackbar.success("Video file changed");
                    },
                    (err) => {
                        if (axios.isAxiosError(err)) {
                            globalSnackbar.error(
                                `Problème dans l'envoi du fichier : ${err.response.data}`
                            );
                        }
                    }
                );
        }
    };

    useEffect(() => {
        getFileName();
    }, [])

    return (
        <Container>
            <Grid container marginY={2} justifyContent="center">
                <Typography variant="h4">Transport</Typography>
                <Grid container margin={1} spacing={2} direction="row" justifyContent="center">
                    <Grid item>
                        <Button variant="contained" onClick={handleClickPlay}>
                            Play
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" onClick={handleClickPause}>
                            Pause
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" color="warning" onClick={handleClickRestart}>
                            Restart
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" color="error" onClick={handleClickStop}>
                            Stop
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            <Divider />
            <Grid container marginY={2} justifyContent="center">
                <Typography variant="h4">File</Typography>
                <Grid container margin={1} spacing={2} direction="row" justifyContent="center" alignItems="center">
                    <Grid item>
                        <input
                            type="file"
                            ref={fileUploadButtonRef}
                            hidden
                            accept="mov mp4"
                            onChange={handleUpload}
                            onClick={() => {
                                fileUploadButtonRef.current.value = "";
                            }}
                        />
                        <label htmlFor="upload-file-input">
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    if (fileUploadButtonRef.current) {
                                        fileUploadButtonRef.current.click();
                                    }
                                }}
                            >
                                Upload file
                            </Button>
                        </label>
                    </Grid>
                    <Grid item>
                        <Box height="100%" alignItems="center">
                            <Typography variant="h6">{fileName}</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};


export default Playback;