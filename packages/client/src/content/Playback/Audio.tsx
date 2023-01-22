import axios from 'axios';
import * as React from 'react';
import _ from "lodash";
import { useEffect, useState } from 'react';

import globalSnackbar from 'src/utils/snackbarUtils';
import { Grid, InputAdornment, TextField, Typography } from '@mui/material';
import axiosServerAPI from 'src/utils/axios';

type volumeResponse = {
    volume: number
}

const AudioControls: React.FC = () => {
    const [volume, setVolume] = useState<number>(0);

    const getVolume = () => {
        axiosServerAPI.get<volumeResponse>(`/getVolume`)
            .then((res) => {
                setVolume(res.data.volume);
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

    const sendVolumeChange = (vol: number) => {
        axiosServerAPI
            .post(
                `/setVolume`,
                { volume: vol }
            )
            .then(
                (res) => {
                    getVolume();
                    return;
                },
                (err) => {
                    if (axios.isAxiosError(err)) {
                        globalSnackbar.error(
                            err.response.data
                        );
                    }
                }
            );
    }

    const handleVolumeChange = (event: React.ChangeEvent<any>) => {
        if (Math.abs(event.target.value - volume) === 1) {
            setVolume(event.target.value);
            sendVolumeChange(event.target.value);
        } else {
            setVolume(event.target.value);
        }
    }

    const handleVolumeBlur = () => {
        sendVolumeChange(volume);
    }

    const handleVolumeKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
        if (event.key === "Enter") {
            sendVolumeChange(volume);
        }
    }

    useEffect(() => {
        getVolume();
    }, [])

    return (
        <Grid container marginY={2} justifyContent="center">
            <Typography variant="h4">Audio</Typography>
            <Grid container margin={1} spacing={2} direction="row" justifyContent="center">
                <Grid item>
                    <TextField
                        id="outlined-number"
                        label="Volume (0-200%)"
                        type="number"
                        size="small"
                        sx={{ width: "110px" }}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        InputProps={{
                            inputProps: {
                                max: "200",
                                min: "0",
                                step: "1",
                            },
                            endAdornment: (
                                <InputAdornment position="start">%</InputAdornment>
                            ),
                        }}
                        value={volume}
                        onBlur={handleVolumeBlur}
                        onChange={handleVolumeChange}
                        onKeyDown={handleVolumeKeyDown}

                    />
                </Grid>
            </Grid>
        </Grid>
    )
}

export default AudioControls;
