import * as React from 'react';
import {
    Button,
    Container, Divider, Typography,
} from "@mui/material";

import AudioSetup from './AudioSetup';
import SystemControl from './SystemControl';
import VideoSetup from './VideoSetup';


const Setup: React.FC = () => {
    return (
        <Container>
            <AudioSetup/>
            <Divider/>
            <VideoSetup/>
            <Divider/>
            <SystemControl/>
        </Container>
    );
};


export default Setup;