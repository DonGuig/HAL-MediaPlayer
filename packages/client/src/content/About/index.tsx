import * as React from 'react';
import {
    Button,
    Container, Typography,
} from "@mui/material";
import axios from 'axios';
import { serverPort } from '@halmediaplayer/shared';

const handleClickPlay = () => {
    axios.post(`http://${window.location.hostname}:${serverPort}/api/play`)
}

const handleClickPause = () => {
    axios.post(`http://${window.location.hostname}:${serverPort}/api/pause`)
}

const About: React.FC = () => {
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


export default About;