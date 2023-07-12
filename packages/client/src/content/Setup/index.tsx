import * as React from 'react';
import {
    Container, Divider
} from "@mui/material";

import AudioSetup from './AudioSetup';
import VideoSetup from './VideoSetup';


const Setup: React.FC = () => {
    return (
        <Container>
            <AudioSetup/>
            <Divider/>
            <VideoSetup/>
        </Container>
    );
};


export default Setup;