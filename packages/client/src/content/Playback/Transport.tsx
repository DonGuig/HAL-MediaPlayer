import { Button, Grid, Typography } from '@mui/material';
import axios from 'axios';
import * as React from 'react';
import _ from "lodash";

import { serverPort } from '@halmediaplayer/shared';
import globalSnackbar from 'src/utils/snackbarUtils';
import Seek from './Seek';
import { useState } from 'react';


const Transport: React.FC = () => {
    const [stopped, setStopped] = useState<boolean>(false);

    const handleClickPlay = () => {
        axios.post(`http://${window.location.hostname}:${serverPort}/api/play`)
            .then(() => setStopped(false))
            .catch((err) => {
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
        axios.post(`http://${window.location.hostname}:${serverPort}/api/restart`)
            .then(() => setStopped(false))
            .catch((err) => {
                if (axios.isAxiosError(err)) {
                    const toDisplay = err.response.data;
                    if (_.isString(toDisplay)) {
                        globalSnackbar.error(toDisplay);
                    }
                }
            })
    }

    const handleClickStop = () => {
        axios.post(`http://${window.location.hostname}:${serverPort}/api/stop`)
            .then(() => setStopped(true))
            .catch((err) => {
                if (axios.isAxiosError(err)) {
                    const toDisplay = err.response.data;
                    if (_.isString(toDisplay)) {
                        globalSnackbar.error(toDisplay);
                    }
                }
            })
    }

    return (
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
            <Seek stopped={stopped} />
        </Grid>
    )
}

export default Transport;