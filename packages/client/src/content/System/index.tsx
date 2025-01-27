import * as React from 'react';
import {
    Container, Divider
} from "@mui/material";

import SystemControl from './SystemControl';
import FileSystem from './FileSystem';



const System: React.FC = () => {
    return (
        <Container>
            <SystemControl/>
            <Divider/>
            <FileSystem/>
        </Container>
    );
};


export default System;