import * as React from 'react';
import {
    Button,
    Container, Divider, Typography,
} from "@mui/material";


import DeviceName from './DeviceName';
import AudioSetup from './AudioSetup';
import SystemControl from './SystemControl';
import VideoSetup from './VideoSetup';


const Setup: React.FC = () => {
    return (
        <Container>
            <DeviceName/>
            <Divider/>
            <AudioSetup/>
            <Divider/>
            <VideoSetup/>
            <Divider/>
            <SystemControl/>
        </Container>
    );
};


export default Setup;