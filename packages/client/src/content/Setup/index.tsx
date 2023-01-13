import * as React from 'react';
import {
    Button,
    Container, Typography,
} from "@mui/material";
import axios from 'axios';


import DeviceName from './DeviceName';


const Setup: React.FC = () => {
    return (
        <Container>
            <DeviceName/>
        </Container>
    );
};


export default Setup;