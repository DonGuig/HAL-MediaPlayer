import * as React from 'react';
import {
    Container, Divider
} from "@mui/material";

import SystemControl from './SystemControl';
import FileSystem from './FileSystem';
import FactoryReset from './FactoryReset';



const System: React.FC = () => {
    return (
        <Container>
            <SystemControl/>
            <Divider/>
            <FileSystem/>
            <Divider/>
            <FactoryReset/>
        </Container>
    );
};


export default System;