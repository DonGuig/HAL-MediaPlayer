import * as React from 'react';
import {
    Container, Divider
} from "@mui/material";
import _ from "lodash";
import Transport from './Transport';
import AudioControls from './Audio';
import FileManagement from './FileManagement';



const Playback: React.FC = () => {


    return (
        <Container>
            <Transport/>
            <Divider/>
            <AudioControls/>
            <Divider />
            <FileManagement/>
        </Container>
    );
};


export default Playback;