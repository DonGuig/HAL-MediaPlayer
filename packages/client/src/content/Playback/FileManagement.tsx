import axios from 'axios';
import * as React from 'react';
import _ from "lodash";
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import globalSnackbar from 'src/utils/snackbarUtils';
import { Box, Button, Grid, Typography } from '@mui/material';
import axiosServerAPI from 'src/utils/axios';

type fileNameResponse = {
    fileName: string;
}

const FileManagement: React.FC = () => {
    const [fileName, setFileName] = useState<string>("...");

    const fileUploadButtonRef = useRef<HTMLInputElement>();


    const getFileName = () => {
        axiosServerAPI.get<fileNameResponse>(`/getFileName`)
            .then((res) => {
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

    const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files;
        if (file !== null) {
            const formData = new FormData();
            formData.append("file", file[0], file[0].name);
            axiosServerAPI
                .post(
                    `/uploadVideoFile`,
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
    )
}

export default FileManagement;