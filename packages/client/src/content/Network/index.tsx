import * as React from 'react';
import {
    Button,
    Container, Typography,
} from "@mui/material";
import axiosServerAPI from 'src/utils/axios';

const handleClickPlay = () => {
    axiosServerAPI.post(`/play`)
}

const handleClickPause = () => {
    axiosServerAPI.post(`/pause`)
}

const Network: React.FC = () => {
    return (
        <Container>
            <Typography>Test</Typography>
            <Button onClick={handleClickPlay}>
                Play
            </Button>
            <Button onClick={handleClickPause}>
                Pause
            </Button>
        </Container>
    );
};


export default Network;