import * as React from 'react';
import { Grid, Paper, Slider, Stack, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { WebSocketContext } from 'src/contexts/WebSocketContext';
import { PlaybackContext } from './PlaybackContext';
import HttpApiRequests from 'src/utils/HttpRequests';

type TimeRequestResponse = { time: number; length: number };


const Seek: React.FC = () => {
    const [time, setTime] = useState<number>(0);
    const [length, setLength] = useState<number>(0);
    const [pauseTimeInterval, setPauseTimeInterval] = useState<boolean>(false);
    const { sendMessage } = useContext(WebSocketContext);
    const { stopped } = useContext(PlaybackContext);


    const handleFaderChange = (event: Event, val: number) => {
        setPauseTimeInterval(true);
        if (val !== time) {
            setTime(val);
            sendMessage("/setTime", val);
        }
    };

    const handleFaderCommitted = (event: Event, val: number) => {
        setPauseTimeInterval(false);
    };

    const requestTime = () => {
        HttpApiRequests.get<TimeRequestResponse>(`/getTime`)
            .then((res) => {
                setTime(res.time);
                setLength(res.length);
            }).catch((err) => {
                setTime(0);
            })
    }

    useEffect(() => {
        requestTime();
        const updateTimeInterval = setInterval(() => {
            if (!pauseTimeInterval && !stopped) {
                requestTime();
            };
            if (stopped){
                setTime(0.1);
                setLength(1);    
            }
        }, 900)
        return function () {
            clearInterval(updateTimeInterval);
        }
    }, [pauseTimeInterval, stopped]);

    return (
        <Grid container marginY={2} justifyContent="center">
            <Paper variant="outlined" sx={{padding:1, border: `#1975FF solid 1px`, width:"100%", minWidth: "150px", maxWidth: "80%" }}>
                <Stack direction="row" spacing={2} marginX={2} width="100%" alignItems="center" justifyContent="center">
                    <Typography>Seek</Typography>
                    <Slider
                        value={time}
                        onChange={handleFaderChange}
                        onChangeCommitted={handleFaderCommitted}
                        orientation="horizontal"
                        min={0}
                        max={Math.floor(length)}
                        step={1}
                        size="small"
                        valueLabelDisplay="off"
                        sx={{ marginX: "20px" }}
                        disabled={stopped}
                    />
                    <Typography noWrap sx={{minWidth:"100px"}}>{Math.floor(time / 60)} min {Math.floor(time % 60)} sec</Typography>
                </Stack>
            </Paper>
        </Grid>


    )
}

export default Seek